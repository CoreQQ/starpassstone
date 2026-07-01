import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readAnalytics, computeStats } from "@/lib/analytics";
import { telegramEnabled } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await readAnalytics();
  return NextResponse.json({ stats: computeStats(data), telegramEnabled });
}
