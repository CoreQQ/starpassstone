import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (body.role !== "USER" && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Invalid role" }, { status: 422 });
  }
  const r = await repo();
  await r.setUserRole(id, body.role);
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `User role changed to ${body.role}`,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const r = await repo();
  await r.deleteUser(id);
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: `User deleted (${id})`,
  });
  return NextResponse.json({ ok: true });
}
