import { NextResponse } from "next/server";

/**
 * Contact lead handler.
 *
 * Behaviour:
 *  - If NEST_API_URL is set, the lead is forwarded to the NestJS backend
 *    (see /api in the repo root) which owns delivery (Telegram, CRM, etc.).
 *  - Otherwise, if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set, the lead is
 *    sent straight to Telegram (mirrors the original site's behaviour).
 *  - If nothing is configured the lead is logged and a success response is
 *    returned, so the form is always usable in local/demo mode.
 */
export async function POST(req: Request) {
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
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    try {
      const text = `🪨 New Starpass Stone lead\nName: ${name}\nPhone: ${phone}`;
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        }
      );
      if (res.ok) return NextResponse.json({ ok: true });
    } catch {
      /* fall through */
    }
  }

  // 3) Demo mode
  console.log("[contact] new lead (demo mode):", lead);
  return NextResponse.json({ ok: true, mode: "demo" });
}
