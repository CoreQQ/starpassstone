import { config } from "./config.js";

const API = `https://api.telegram.org/bot${config.telegramBotToken}`;

export interface TgUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name?: string; username?: string; is_bot?: boolean };
    chat: { id: number; type: string; title?: string };
    text?: string;
    reply_to_message?: { from?: { id: number; is_bot?: boolean } };
  };
}

async function call<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: params ? JSON.stringify(params) : undefined,
  });
  const body = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!body.ok) {
    throw new Error(`Telegram ${method} failed: ${body.description ?? res.status}`);
  }
  return body.result;
}

export async function getMe(): Promise<{ id: number; username: string }> {
  return call("getMe");
}

export async function getUpdates(offset: number): Promise<TgUpdate[]> {
  return call("getUpdates", {
    offset,
    timeout: 50,
    allowed_updates: ["message"],
  });
}

// Telegram ограничивает сообщение 4096 символами — режем длинные тексты.
export async function sendMessage(chatId: number | string, text: string): Promise<void> {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 0) {
    chunks.push(rest.slice(0, 4000));
    rest = rest.slice(4000);
  }
  for (const chunk of chunks) {
    await call("sendMessage", { chat_id: chatId, text: chunk });
  }
}

export async function sendTyping(chatId: number | string): Promise<void> {
  try {
    await call("sendChatAction", { chat_id: chatId, action: "typing" });
  } catch {
    // не критично
  }
}
