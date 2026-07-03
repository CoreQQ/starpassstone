import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readRequestInfo, getIp } from "@/lib/request-info";
import { repo } from "@/lib/repo";
import { rateLimit } from "@/lib/rate-limit";
import { sendTelegram, esc } from "@/lib/telegram";

export const dynamic = "force-dynamic";

type Payload = {
  type?: "view" | "end";
  visitorId?: string;
  isNew?: boolean;
  path?: string;
  referrer?: string;
  language?: string;
  duration?: number;
};

/**
 * Visitor tracking endpoint, called client-side on every page load.
 *  - type "view": records the visit and fires a Telegram notification.
 *  - type "end":  attaches the time-on-page to the visit (unload beacon).
 */
export async function POST(req: Request) {
  const h = await headers();
  const ip = getIp(h);

  if (!rateLimit(`track:${ip}`, 60, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const visitorId = String(body.visitorId || "").slice(0, 64);
  if (!visitorId) return NextResponse.json({ ok: false }, { status: 400 });

  const r = await repo();

  if (body.type === "end") {
    await r.recordDuration(visitorId, Number(body.duration));
    return NextResponse.json({ ok: true });
  }

  const info = readRequestInfo(h, {
    language: typeof body.language === "string" ? body.language : undefined,
  });
  const path = String(body.path || "/").slice(0, 300);
  const referrer = String(body.referrer || "").slice(0, 500);
  const isNew = body.isNew !== false;

  await r.recordVisit({ ...info, visitorId, path, referrer, isNew });
  await r.addLog({
    type: "visit",
    ip: info.ip,
    message: `${isNew ? "New" : "Returning"} visitor · ${path} · ${info.country}`,
  });

  // Fire-and-forget Telegram notification (never blocks the response).
  const text =
    `👁️ *Site visit*\n` +
    `🕒 ${esc(new Date().toLocaleString("en-GB", { timeZone: "UTC" }))} UTC\n` +
    `🌐 IP: ${esc(info.ip)}\n` +
    `📍 ${esc(info.city)}, ${esc(info.country)}\n` +
    `🏢 ISP: ${esc(info.provider)}\n` +
    `💻 ${esc(info.device)} · ${esc(info.os)} · ${esc(info.browser)}\n` +
    `🗣️ Lang: ${esc(info.language)}\n` +
    `🔗 Referrer: ${esc(referrer || "Direct")}\n` +
    `📄 Page: ${esc(path)}\n` +
    `${isNew ? "✨ New visitor" : "🔁 Returning visitor"}`;
  void sendTelegram(text);

  return NextResponse.json({ ok: true });
}
