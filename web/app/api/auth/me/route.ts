import { NextResponse } from "next/server";
import { currentSession } from "@/lib/jwt";
import { repo } from "@/lib/repo";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await currentSession();
  if (!session) return NextResponse.json({ user: null });
  // Return fresh data from the store (role/name may have changed since sign-in).
  const user = await (await repo()).findUserById(session.id);
  return NextResponse.json({ user });
}
