// Thin wrapper around the Telegram Bot API.
// All notifications (visits, admin login, contact leads, uploads, errors) go
// through here. It is a no-op when the bot is not configured, so the site keeps
// working in local/demo mode without any secrets.
//
// IMPORTANT for serverless hosts (Vercel): always `await` sendTelegram — the
// function instance is frozen as soon as the response is returned, so
// fire-and-forget sends are silently lost.

// Trimmed defensively — a pasted trailing space/newline breaks the API call.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();

export const telegramEnabled = !!(TOKEN && CHAT_ID);

export type TelegramResult = { ok: boolean; error?: string };

/**
 * Send a Markdown message to the configured Telegram chat.
 * Never throws; failures are reported in the result and logged to the console
 * so they show up in the host's function logs.
 */
export async function sendTelegram(text: string): Promise<TelegramResult> {
  if (!telegramEnabled) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured" };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (res.ok) return { ok: true };
    const data = (await res.json().catch(() => null)) as { description?: string } | null;
    const error = data?.description || `Telegram API returned HTTP ${res.status}`;
    console.error("[telegram] send failed:", error);
    return { ok: false, error };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("[telegram] send failed:", error);
    return { ok: false, error };
  }
}

/** Escape the characters Telegram treats as Markdown control chars. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/([_*`\[\]])/g, "\\$1")
    .slice(0, 400);
}
