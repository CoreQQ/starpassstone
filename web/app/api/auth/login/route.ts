import { NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";
import { rateLimit } from "@/lib/rate-limit";
import { signSession, sessionCookie } from "@/lib/jwt";

const WEEK = 60 * 60 * 24 * 7;

export async function POST(req: Request) {
  const ip = getIp(await headers());
  if (!rateLimit(`userlogin:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const r = await repo();
  const found = await r.findUserByEmail(email);
  // Compare against a dummy hash when the user is unknown so response timing
  // doesn't reveal whether the email exists.
  const ok = found
    ? await bcrypt.compare(password, found.password)
    : await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinva");

  if (!found || !ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await r.touchLastLogin(found.id);
  const token = await signSession({ id: found.id, email: found.email, role: found.role });
  const res = NextResponse.json({
    user: {
      id: found.id,
      email: found.email,
      name: found.name,
      role: found.role,
      createdAt: found.createdAt,
      lastLogin: found.lastLogin,
    },
  });
  res.cookies.set(sessionCookie(token, WEEK));
  return res;
}
