import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Public configuration health-check. Reports ONLY booleans — never values —
 * so it is safe to expose. Open /api/health after a deploy to instantly see
 * which environment variables actually reached the runtime.
 */
export async function GET() {
  const has = (name: string) => !!process.env[name]?.trim();
  const storage = has("DATABASE_URL")
    ? "postgres"
    : has("BLOB_READ_WRITE_TOKEN")
      ? "vercel-blob"
      : "ephemeral";
  return NextResponse.json({
    ok: true,
    env: {
      ADMIN_PASSWORD: has("ADMIN_PASSWORD"),
      ADMIN_SECRET: has("ADMIN_SECRET"),
      JWT_SECRET: has("JWT_SECRET"),
      TELEGRAM_BOT_TOKEN: has("TELEGRAM_BOT_TOKEN"),
      TELEGRAM_CHAT_ID: has("TELEGRAM_CHAT_ID"),
      BLOB_READ_WRITE_TOKEN: has("BLOB_READ_WRITE_TOKEN"),
      DATABASE_URL: has("DATABASE_URL"),
    },
    storage,
    warning:
      storage === "ephemeral"
        ? "No Blob store or database connected — analytics, admin photo edits, news, banners and registered users will NOT persist. Connect Vercel Blob (Storage → Blob) or set DATABASE_URL."
        : undefined,
    // Bump when debugging deploys to confirm which build is live.
    codeVersion: 4,
  });
}
