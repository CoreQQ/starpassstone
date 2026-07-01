// JWT helpers for the public user accounts system (separate from the
// password-based admin dashboard session). Uses `jose` (Web Crypto), so it runs
// on both the Node and Edge runtimes.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const USER_COOKIE = "sps_user";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "starpass-dev-jwt-secret-change-me"
);
const EXPIRY = "7d";

export type SessionUser = { id: string; email: string; role: "USER" | "ADMIN" };

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: String(payload.email || ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return null;
  }
}

/** Reads and verifies the current user session from the request cookie. */
export async function currentSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

/** Cookie options shared by login/register (set) and logout (clear). */
export function sessionCookie(value: string, maxAge: number) {
  return {
    name: USER_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
