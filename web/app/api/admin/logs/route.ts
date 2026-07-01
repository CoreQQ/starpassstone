import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const logs = await (await repo()).getLogs(200);
  return NextResponse.json({ logs });
}
