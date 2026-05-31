import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
const PUBLIC_BASE = process.env.UPLOAD_PUBLIC_BASE || "/uploads";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export type SavedFile = { url: string; fileName: string };

/**
 * Persist an uploaded image to the configured upload directory and return a
 * public URL. On Railway, UPLOAD_DIR should point to a mounted Volume so the
 * files survive deploys.
 */
export async function saveUploadedImage(file: File): Promise<SavedFile> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF or AVIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Maximum size is 8MB.");
  }

  const ext = ALLOWED.get(file.type)!;
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await fs.mkdir(absDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(path.join(absDir, fileName), buffer);

  const url = `${PUBLIC_BASE.replace(/\/$/, "")}/${fileName}`;
  return { url, fileName };
}

export function isManagedUpload(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith(PUBLIC_BASE.replace(/\/$/, ""));
}

export async function deleteUploadedImage(url: string | null | undefined) {
  if (!isManagedUpload(url)) return;
  const fileName = url!.split("/").pop();
  if (!fileName) return;
  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  try {
    await fs.unlink(path.join(absDir, fileName));
  } catch {
    // ignore missing files
  }
}
