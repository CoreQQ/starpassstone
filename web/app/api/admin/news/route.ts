import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ news: await (await repo()).listNews() });
}

/** Create or update a news post. */
export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { id?: string; title?: string; body?: string; img?: string; published?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 422 });
  }
  const r = await repo();
  const saved = await r.saveNews({
    id: typeof body.id === "string" ? body.id : undefined,
    title,
    body: String(body.body ?? "").slice(0, 8000),
    img: String(body.img ?? "").slice(0, 1000),
    published: body.published !== false,
  });
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `News saved: “${saved.title}”`,
  });
  return NextResponse.json({ post: saved });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const r = await repo();
  await r.deleteNews(id);
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `News deleted (${id})`,
  });
  return NextResponse.json({ ok: true });
}
