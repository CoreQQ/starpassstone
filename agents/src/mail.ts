import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { config } from "./config.js";

// Почта: SMTP (отправка) + IMAP (чтение входящих).
// Всё включается только когда заданы MAIL_USER/MAIL_PASSWORD/SMTP_HOST/IMAP_HOST.

export function mailSendConfigured(): boolean {
  return Boolean(config.mailUser && config.mailPassword && config.smtpHost);
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
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, body: string): Promise<string> {
  const info = await getTransporter().sendMail({
    from: `"${config.mailFromName}" <${config.mailUser}>`,
    to,
    subject,
    text: body,
  });
  return `Письмо отправлено на ${to} (id: ${info.messageId}).`;
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
