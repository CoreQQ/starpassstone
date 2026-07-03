import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { repo, type Banner } from "@/lib/repo";
import { getIp } from "@/lib/request-info";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ banners: await (await repo()).listBanners() });
}

/** Replace the full banner list (create/edit/reorder/delete in one save). */
export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { banners?: Banner[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (!Array.isArray(body.banners)) {
    return NextResponse.json({ error: "banners must be an array" }, { status: 422 });
  }
  const r = await repo();
  const saved = await r.saveBanners(body.banners.filter((b) => String(b.text ?? "").trim()));
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `Banners saved (${saved.length})`,
  });
  return NextResponse.json({ banners: saved });
}
