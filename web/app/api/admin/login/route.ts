import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { COOKIE, checkPassword, makeToken } from "@/lib/auth";
import { getIp, readRequestInfo } from "@/lib/request-info";
import { rateLimit } from "@/lib/rate-limit";
import { addLog } from "@/lib/analytics";
import { sendTelegram, esc } from "@/lib/telegram";

export async function POST(req: Request) {
  const h = await headers();
  const ip = getIp(h);

  // Throttle password attempts to slow down brute-force guessing.
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts — try again later." },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!checkPassword(body.password || "")) {
    await addLog({ type: "error", ip, message: "Failed admin login attempt" });
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const info = readRequestInfo(h);
  await addLog({ type: "admin_login", ip, message: `Admin signed in from ${info.country}` });
  void sendTelegram(
    `🔐 *Admin login*\n🌐 IP: ${esc(ip)}\n📍 ${esc(info.city)}, ${esc(info.country)}\n💻 ${esc(info.device)} · ${esc(info.browser)}`
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}
