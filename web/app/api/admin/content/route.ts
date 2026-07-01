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
  return NextResponse.json(await (await repo()).getContent());
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const r = await repo();
  const saved = await r.saveContent(body);
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `Content saved · ${saved.products.length} products, ${saved.hamamGallery.length} hamam, ${saved.saunaGallery.length} sauna photos`,
  });
  return NextResponse.json(saved);
}
