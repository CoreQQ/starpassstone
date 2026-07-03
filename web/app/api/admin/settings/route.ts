import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";
import { SETTING_KEYS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ settings: await (await repo()).getSettings() });
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const settings: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    const v = body[key];
    if (typeof v === "string" && v.trim()) settings[key] = v.trim().slice(0, 500);
  }
  const r = await repo();
  const saved = await r.saveSettings(settings);
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: "Site settings updated",
  });
  return NextResponse.json({ settings: saved });
}
