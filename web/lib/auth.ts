import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "sps_admin";

const SECRET = process.env.ADMIN_SECRET || "starpass-dev-secret-change-me";
/** Admin password. Override with ADMIN_PASSWORD in .env.local for production. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "starpass";

export function makeToken(): string {
  return createHmac("sha256", SECRET).update("admin-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  return safeEqual(String(input || ""), ADMIN_PASSWORD);
}

/** True when the request carries a valid admin session cookie. */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return !!token && safeEqual(token, makeToken());
}
