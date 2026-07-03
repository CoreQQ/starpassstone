import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { sendTelegram, telegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Sends a test message to the configured Telegram chat and returns the exact
 *  Telegram API error when it fails — so misconfiguration (wrong token, wrong
 *  chat id, bot not started) is diagnosable right from the admin panel. */
export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!telegramEnabled) {
    return NextResponse.json({
      ok: false,
      error:
        "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set in the environment (set them and redeploy).",
    });
  }
  const result = await sendTelegram(
    `✅ *Test message*\nStarpass Stone admin — Telegram is configured correctly.`
  );
  return NextResponse.json(result);
}
