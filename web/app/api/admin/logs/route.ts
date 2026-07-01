import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await readAnalytics();
  return NextResponse.json({ logs: data.logs.slice(-200).reverse() });
}
