import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getIp, readRequestInfo } from "@/lib/request-info";
import { rateLimit } from "@/lib/rate-limit";
import { addLog } from "@/lib/analytics";
import { sendTelegram, esc } from "@/lib/telegram";

/**
 * Contact lead handler.
 *
 * Behaviour:
 *  - If NEST_API_URL is set, the lead is forwarded to the NestJS backend
 *    (see /api in the repo root) which owns delivery (Telegram, CRM, etc.).
 *  - Otherwise, if the Telegram bot is configured, the lead is sent straight to
 *    Telegram (mirrors the original site's behaviour).
 *  - If nothing is configured the lead is logged and a success response is
 *    returned, so the form is always usable in local/demo mode.
 *
 * Every lead is recorded in the audit log regardless of delivery channel.
 */
export async function POST(req: Request) {
  const h = await headers();
  const ip = getIp(h);

  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests — please try again shortly." },
      { status: 429 }
    );
  }

  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const name = (body.name || "").toString().trim().slice(0, 120);
  const phone = (body.phone || "").toString().trim().slice(0, 60);

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 422 }
    );
  }

  const lead = { name, phone, at: new Date().toISOString() };
  const info = readRequestInfo(h);
  await addLog({ type: "contact", ip, message: `New lead: ${name} · ${phone}` });

  // 1) Forward to NestJS backend if available
  const nestUrl = process.env.NEST_API_URL;
  if (nestUrl) {
    try {
      const res = await fetch(`${nestUrl.replace(/\/$/, "")}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (res.ok) return NextResponse.json({ ok: true });
    } catch {
      /* fall through */
    }
  }

  // 2) Direct Telegram delivery
  const sent = await sendTelegram(
    `🪨 *New Starpass Stone lead*\n` +
      `👤 Name: ${esc(name)}\n` +
      `📞 Phone: ${esc(phone)}\n` +
      `🌐 IP: ${esc(ip)}\n` +
      `📍 ${esc(info.city)}, ${esc(info.country)}`
  );
  if (sent) return NextResponse.json({ ok: true });

  // 3) Demo mode
  console.log("[contact] new lead (demo mode):", lead);
  return NextResponse.json({ ok: true, mode: "demo" });
}
