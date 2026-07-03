import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isAuthed } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/paths";
import { getIp } from "@/lib/request-info";
import { repo } from "@/lib/repo";
import { sendTelegram, esc } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 8 MB)" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${ext}`;
  const ip = getIp(await headers());
  const sizeKb = Math.round(file.size / 1024);

  async function notifyUpload() {
    await (await repo()).addLog({ type: "upload", ip, message: `Uploaded ${name} (${sizeKb} KB)` });
    void sendTelegram(`🖼️ *File uploaded*\nName: ${esc(name)}\nSize: ${sizeKb} KB`);
  }

  // Production (Vercel): store in Vercel Blob — the filesystem is read-only.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`uploads/${name}`, buffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    await notifyUpload();
    return NextResponse.json({ url });
  }

  // Local dev: write to disk, served by the /api/media/[name] route handler.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  await notifyUpload();
  return NextResponse.json({ url: `/api/media/${name}` });
}
