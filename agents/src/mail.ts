import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { config } from "./config.js";

// Почта: SMTP (отправка) + IMAP (чтение входящих).
// Всё включается только когда заданы MAIL_USER/MAIL_PASSWORD/SMTP_HOST/IMAP_HOST.

export function brevoConfigured(): boolean {
  return Boolean(config.brevoApiKey && config.mailUser);
}

export function mailSendConfigured(): boolean {
  return brevoConfigured() || Boolean(config.mailUser && config.mailPassword && config.smtpHost);
}

export function mailReadConfigured(): boolean {
  return Boolean(config.mailUser && config.mailPassword && config.imapHost);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465, // 465 = SSL, 587 = STARTTLS
      auth: { user: config.mailUser, pass: config.mailPassword },
      // Явные таймауты, чтобы не висеть минутами и давать понятную ошибку.
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

// Превращаем техническую ошибку почты в понятное объяснение для команды.
function explainMailError(err: unknown): string {
  const e = err as { code?: string; responseCode?: number; message?: string };
  const code = e.code || "";
  if (code === "EAUTH" || e.responseCode === 535) {
    return (
      "почта не приняла логин/пароль. Для Gmail нужен ПАРОЛЬ ПРИЛОЖЕНИЯ (16 букв с " +
      "myaccount.google.com/apppasswords), а не обычный пароль. Проверьте MAIL_PASSWORD на Railway."
    );
  }
  if (code === "ETIMEDOUT" || code === "ESOCKET" || code === "ECONNECTION") {
    return (
      "не удалось соединиться с SMTP-сервером (таймаут). Проверьте SMTP_HOST и SMTP_PORT " +
      "на Railway (Gmail: smtp.gmail.com, порт 465). Если не помогает — попробуйте порт 587."
    );
  }
  return `техническая ошибка почты: ${e.message || String(err)}`;
}

// Отправка через Brevo (HTTP API) — не блокируется хостингами, в отличие от SMTP.
async function brevoSend(to: string, subject: string, body: string): Promise<string> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.brevoApiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: config.mailFromName, email: config.mailUser },
      to: [{ email: to }],
      subject,
      textContent: body,
    }),
  });
  if (res.status === 201) {
    return `Письмо отправлено на ${to}.`;
  }
  const text = (await res.text()).slice(0, 400);
  // Частая ошибка: адрес-отправитель не подтверждён в Brevo.
  if (res.status === 400 && /sender/i.test(text)) {
    return (
      `НЕ ОТПРАВЛЕНО — адрес-отправитель ${config.mailUser} не подтверждён в Brevo. ` +
      `Зайдите в Brevo → Senders и подтвердите его по ссылке из письма.`
    );
  }
  if (res.status === 401) {
    return "НЕ ОТПРАВЛЕНО — неверный BREVO_API_KEY. Проверьте ключ на Railway.";
  }
  return `НЕ ОТПРАВЛЕНО — Brevo вернул ошибку (${res.status}): ${text}`;
}

async function brevoVerify(): Promise<string> {
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": config.brevoApiKey, accept: "application/json" },
    });
    if (res.ok) {
      return `✅ Почта готова (Brevo). Отправитель: ${config.mailUser}. Не забудьте подтвердить этот адрес в Brevo → Senders.`;
    }
    if (res.status === 401) return "❌ Неверный BREVO_API_KEY — проверьте ключ на Railway.";
    return `❌ Brevo вернул ошибку ${res.status}.`;
  } catch (err) {
    return `❌ Не удалось связаться с Brevo: ${(err as Error).message}`;
  }
}

export async function verifyMail(): Promise<string> {
  if (brevoConfigured()) return brevoVerify();
  try {
    await getTransporter().verify();
    return `✅ Почта подключена: ${config.mailUser} (SMTP ${config.smtpHost}:${config.smtpPort}).`;
  } catch (err) {
    return `❌ Почта не работает — ${explainMailError(err)}`;
  }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  if (brevoConfigured()) {
    try {
      return await brevoSend(to, subject, body);
    } catch (err) {
      return `НЕ ОТПРАВЛЕНО — ошибка Brevo: ${(err as Error).message}`;
    }
  }
  try {
    const info = await getTransporter().sendMail({
      from: `"${config.mailFromName}" <${config.mailUser}>`,
      to,
      subject,
      text: body,
    });
    return `Письмо отправлено на ${to} (id: ${info.messageId}).`;
  } catch (err) {
    // Возвращаем понятную причину — агент перескажет её владельцу.
    return `НЕ ОТПРАВЛЕНО — ${explainMailError(err)}`;
  }
}

export interface IncomingEmail {
  uid: number;
  from: string;
  subject: string;
  date: string;
  text: string;
}

async function withImap<T>(fn: (client: ImapFlow) => Promise<T>): Promise<T> {
  const client = new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: true,
    auth: { user: config.mailUser, pass: config.mailPassword },
    logger: false,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

function firstText(source: unknown): string {
  const s = typeof source === "string" ? source : "";
  return s.replace(/\s+/g, " ").trim().slice(0, 1500);
}

// Непрочитанные письма (для автоуведомлений). helper пометит их прочитанными.
export async function fetchUnseen(limit = 10): Promise<IncomingEmail[]> {
  return withImap(async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ seen: false }, { uid: true });
      const pick = (uids || []).slice(-limit);
      const out: IncomingEmail[] = [];
      for (const uid of pick) {
        const msg = await client.fetchOne(
          String(uid),
          { envelope: true, source: true },
          { uid: true },
        );
        if (!msg || !msg.envelope) continue;
        const fromAddr = msg.envelope.from?.[0];
        out.push({
          uid,
          from: fromAddr ? `${fromAddr.name || ""} <${fromAddr.address || ""}>`.trim() : "неизвестно",
          subject: msg.envelope.subject || "(без темы)",
          date: msg.envelope.date ? new Date(msg.envelope.date).toISOString() : "",
          text: firstText(msg.source?.toString()),
        });
      }
      // Помечаем прочитанными, чтобы не слать повторно.
      if (pick.length) {
        await client.messageFlagsAdd(pick, ["\\Seen"], { uid: true });
      }
      return out;
    } finally {
      lock.release();
    }
  });
}

// Последние письма (для запроса «покажи входящие») — не меняем флаги.
export async function fetchRecent(limit = 8): Promise<IncomingEmail[]> {
  return withImap(async (client) => {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages || 0;
      if (total === 0) return [];
      const start = Math.max(1, total - limit + 1);
      const out: IncomingEmail[] = [];
      for await (const msg of client.fetch(`${start}:*`, { envelope: true })) {
        const fromAddr = msg.envelope?.from?.[0];
        out.push({
          uid: msg.uid,
          from: fromAddr ? `${fromAddr.name || ""} <${fromAddr.address || ""}>`.trim() : "неизвестно",
          subject: msg.envelope?.subject || "(без темы)",
          date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
          text: "",
        });
      }
      return out.reverse();
    } finally {
      lock.release();
    }
  });
}
