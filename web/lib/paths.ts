import path from "path";

/** Writable directory for user-uploaded images (served via /api/media). */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
