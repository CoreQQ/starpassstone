// Thin wrapper around the Telegram Bot API.
// All notifications (visits, admin login, contact leads, uploads, errors) go
// through here. It is a no-op when the bot is not configured, so the site keeps
// working in local/demo mode without any secrets.

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const telegramEnabled = !!(TOKEN && CHAT_ID);

/**
 * Send a Markdown message to the configured Telegram chat.
 * Never throws — network/config failures are swallowed and reported as `false`
 * so a failed notification can never break a request.
 */
export async function sendTelegram(text: string): Promise<boolean> {
  if (!telegramEnabled) return false;
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
    return res.ok;
  } catch {
    return false;
  }
}

/** Escape the characters Telegram treats as Markdown control chars. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/([_*`\[\]])/g, "\\$1")
    .slice(0, 400);
}
