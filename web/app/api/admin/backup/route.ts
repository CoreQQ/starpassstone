import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import { repo } from "@/lib/repo";
import { getIp } from "@/lib/request-info";

export const dynamic = "force-dynamic";

/** Full data export (content, news, banners, settings, users, visits, logs)
 *  as a downloadable JSON file — works on both storage drivers. */
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const r = await repo();
  const backup = await r.exportBackup();
  await r.addLog({
    type: "content_update",
    ip: getIp(await headers()),
    message: "Database backup exported",
  });
  const stamp = backup.exportedAt.slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="starpass-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
