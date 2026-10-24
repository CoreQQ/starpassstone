import crypto from "node:crypto";
import { config } from "./config.js";
import { store } from "./store.js";
import type { IncomingEmail } from "./mail.js";

// Gmail API: отправка и чтение почты через серверы Google по HTTPS.
// Письма уходят от настоящего Gmail-адреса (доходят во «Входящие», видны в
// «Отправленных»), а HTTPS-порт не блокируется хостингами вроде Railway.
//
// Доступ выдаётся один раз через /gmailauth в рабочей группе; постоянный
// ключ (refresh token) сохраняется в базе бота на постоянном диске.

// Адреса можно переопределить только для локальных тестов.
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const API = process.env.GMAIL_API_URL || "https://gmail.googleapis.com/gmail/v1/users/me";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const REDIRECT_URI = "http://localhost";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
];
const AUTH_TTL_MS = 15 * 60_000;

function refreshToken(): string {
  return config.gmailRefreshToken || store.getState("gmailRefreshToken") || "";
}

// Ключи приложения Google заданы (можно запускать /gmailauth).
export function gmailClientConfigured(): boolean {
  return Boolean(config.gmailClientId && config.gmailClientSecret);
}

// Доступ к почте полностью выдан.
export function gmailConfigured(): boolean {
  return gmailClientConfigured() && Boolean(refreshToken());
}

// ─── Подключение аккаунта ─────────────────────────────────────────────

export function startAuth(): string {
  const state = crypto.randomBytes(16).toString("hex");
  store.setState("gmailAuthState", JSON.stringify({ state, ts: Date.now() }));
  const params = new URLSearchParams({
    client_id: config.gmailClientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // нужен постоянный ключ, а не на час
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

// Принимаем адрес страницы, на которую Google вернул после входа
// (http://localhost/?state=...&code=...), или сам код.
export async function finishAuth(input: string): Promise<string> {
  const pendingRaw = store.getState("gmailAuthState");
  if (!pendingRaw) return "Сначала выполните /gmailauth.";
  const pending = JSON.parse(pendingRaw) as { state: string; ts: number };
  if (Date.now() - pending.ts > AUTH_TTL_MS) {
    return "Ссылка устарела (прошло больше 15 минут). Выполните /gmailauth заново.";
  }

  let code = input.trim();
  let state: string | null = null;
  if (code.includes("code=") || code.includes("error=")) {
    const query = code.includes("?") ? code.slice(code.indexOf("?") + 1) : code;
    const p = new URLSearchParams(query);
    if (p.get("error")) {
      return `Google вернул ошибку «${p.get("error")}» — скорее всего, доступ не был разрешён. Выполните /gmailauth заново.`;
    }
    code = p.get("code") || "";
    state = p.get("state");
  } else {
    try {
      code = decodeURIComponent(code);
    } catch {
      // оставляем как есть
    }
  }
  if (state !== null && state !== pending.state) {
    return "Этот адрес не от последней команды /gmailauth. Выполните /gmailauth заново.";
  }
  if (!code) {
    return "Не нашёл код в сообщении. Отправьте полный адрес страницы, начиная с http://localhost.";
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: config.gmailClientId,
      client_secret: config.gmailClientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok) {
    return `❌ Google не принял код: ${data.error_description || data.error || res.status}. Выполните /gmailauth заново (код одноразовый и живёт несколько минут).`;
  }
  if (!data.refresh_token) {
    return (
      "❌ Google не выдал постоянный ключ. Откройте myaccount.google.com/permissions, " +
      "удалите доступ для вашего приложения и выполните /gmailauth заново."
    );
  }

  store.setState("gmailRefreshToken", data.refresh_token);
  store.setState("gmailAuthState", "");
  store.setState("gmailSeenIds", ""); // новый ящик — заново запомним, что уже было
  profileCache = null;
  cached = data.access_token
    ? { token: data.access_token, exp: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000 }
    : null;

  const email = await profileEmail();
  return `✅ Gmail подключён: ${email}. Теперь письма уходят от этого адреса.`;
}

// ─── Доступ к API ────────────────────────────────────────────────────

let cached: { token: string; exp: number } | null = null;
let profileCache: string | null = null;

async function accessToken(): Promise<string> {
  if (cached && Date.now() < cached.exp) return cached.token;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      client_id: config.gmailClientId,
      client_secret: config.gmailClientSecret,
      refresh_token: refreshToken(),
      grant_type: "refresh_token",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    if (data.error === "invalid_grant") {
      throw new Error(
        "доступ к Gmail истёк или был отозван. Выполните /gmailauth заново. " +
          "Чтобы доступ не истекал каждые 7 дней, переведите приложение в Google Cloud " +
          "в статус «In production» (Audience → Publish app).",
      );
    }
    if (data.error === "invalid_client") {
      throw new Error("неверные GMAIL_CLIENT_ID или GMAIL_CLIENT_SECRET — проверьте их на Railway.");
    }
    throw new Error(`Google не выдал доступ: ${data.error_description || data.error || res.status}`);
  }
  cached = { token: data.access_token, exp: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000 };
  return cached.token;
}

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 401) cached = null;
    if (res.status === 403 && /has not been used|is disabled|accessNotConfigured/i.test(text)) {
      throw new Error(
        "Gmail API не включён в проекте Google Cloud. Откройте APIs & Services → Library → Gmail API → Enable.",
      );
    }
    if (res.status === 403) {
      throw new Error(
        "у бота нет нужных прав на почту. Выполните /gmailauth заново и разрешите все запрошенные доступы.",
      );
    }
    throw new Error(`ошибка Gmail API (${res.status}): ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function profileEmail(): Promise<string> {
  if (!profileCache) {
    const p = await api("/profile");
    profileCache = String(p.emailAddress || "");
  }
  return profileCache;
}

export async function verifyGmail(): Promise<string> {
  try {
    return `✅ Gmail подключён: ${await profileEmail()}.`;
  } catch (err) {
    return `❌ Gmail не работает — ${(err as Error).message}`;
  }
}

// ─── Отправка ────────────────────────────────────────────────────────

// Переносы строк в заголовках = возможность подставить лишние заголовки
// (например, скрытую копию). Убираем их у всего, что приходит от модели.
function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

// Заголовки письма с не-латиницей кодируем по стандарту RFC 2047.
function encodeHeader(s: string): string {
  return /^[\x20-\x7E]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

export async function sendGmail(to: string, subject: string, body: string): Promise<string> {
  const recipient = oneLine(to);
  if (!EMAIL_RE.test(recipient)) {
    return `НЕ ОТПРАВЛЕНО — некорректный адрес получателя: ${recipient}`;
  }
  try {
    const from = await profileEmail();
    const bodyB64 = Buffer.from(body, "utf8")
      .toString("base64")
      .replace(/.{76}(?=.)/g, "$&\r\n");
    const raw = [
      `From: ${encodeHeader(oneLine(config.mailFromName))} <${from}>`,
      `To: ${recipient}`,
      `Subject: ${encodeHeader(oneLine(subject))}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      bodyB64,
    ].join("\r\n");
    await api("/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: Buffer.from(raw, "utf8").toString("base64url") }),
    });
    return `Письмо отправлено на ${recipient} (от ${from}).`;
  } catch (err) {
    return `НЕ ОТПРАВЛЕНО — ${(err as Error).message}`;
  }
}

// ─── Чтение ──────────────────────────────────────────────────────────

function header(headers: { name: string; value: string }[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function getMeta(id: string): Promise<IncomingEmail> {
  const m = await api(
    `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
  );
  const h = m.payload?.headers ?? [];
  return {
    uid: id,
    from: header(h, "From") || "неизвестно",
    subject: header(h, "Subject") || "(без темы)",
    date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : header(h, "Date"),
    text: decodeEntities(m.snippet || ""),
  };
}

async function listIds(q: string, max: number): Promise<string[]> {
  const r = await api(`/messages?${new URLSearchParams({ q, maxResults: String(max) })}`);
  return (r.messages ?? []).map((m: { id: string }) => m.id);
}

export async function fetchRecentGmail(limit = 8): Promise<IncomingEmail[]> {
  const ids = await listIds("in:inbox", limit);
  return Promise.all(ids.map(getMeta));
}

// Новые письма с прошлой проверки. Ящик не трогаем (ничего не помечаем
// прочитанным) — просто помним, какие письма уже видели.
export async function fetchNewGmail(): Promise<IncomingEmail[]> {
  const ids = await listIds("in:inbox newer_than:2d", 25);
  const seenRaw = store.getState("gmailSeenIds");
  if (!seenRaw) {
    // Первая проверка после подключения: запоминаем, что уже лежит в ящике,
    // и не засыпаем группу старыми письмами.
    store.setState("gmailSeenIds", JSON.stringify(ids));
    return [];
  }
  const seenList = JSON.parse(seenRaw) as string[];
  const seen = new Set(seenList);
  const fresh = ids.filter((id) => !seen.has(id));
  if (!fresh.length) return [];
  const emails = await Promise.all([...fresh].reverse().map(getMeta)); // от старых к новым
  store.setState("gmailSeenIds", JSON.stringify([...fresh, ...seenList].slice(0, 500)));
  return emails;
}
