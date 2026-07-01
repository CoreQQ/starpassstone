import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { COOKIE, isAuthed } from "@/lib/auth";
import { getIp } from "@/lib/request-info";
import { repo } from "@/lib/repo";

export async function POST() {
  if (await isAuthed()) {
    const ip = getIp(await headers());
    await (await repo()).addLog({ type: "admin_logout", ip, message: "Admin signed out" });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
