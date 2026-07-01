import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";
import { rateLimit } from "@/lib/rate-limit";
import { signSession, sessionCookie } from "@/lib/jwt";
import { sendTelegram, esc } from "@/lib/telegram";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEEK = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const ip = getIp(await headers());
  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  let body: { email?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const name = (body.name || "").trim().slice(0, 80) || null;
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  const r = await repo();
  if (await r.findUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await r.createUser({ email, name, password: hash });

  await r.addLog({ type: "user_register", ip, message: `New user registered: ${email}` });
  void sendTelegram(`🧑‍💼 *New user registered*\n📧 ${esc(email)}${name ? `\n👤 ${esc(name)}` : ""}`);

  const token = await signSession({ id: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ user });
  res.cookies.set(sessionCookie(token, WEEK));
  return res;
}
