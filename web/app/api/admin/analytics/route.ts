import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { repo, usingDatabase } from "@/lib/repo";
import { telegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await (await repo()).getStats();
  return NextResponse.json({ stats, telegramEnabled, usingDatabase });
}
