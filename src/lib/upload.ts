import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
const PUBLIC_BASE = process.env.UPLOAD_PUBLIC_BASE || "/uploads";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

const MAX_BYTES = 12 * 1024 * 1024; // 12MB raw upload limit (compressed afterwards)

/** Longest edge (px) we keep. Anything larger is scaled down before saving. */
const MAX_DIMENSION = 2000;
/** Quality used when re-encoding to JPEG/WebP. High enough to be visually lossless. */
const ENCODE_QUALITY = 86;

export type SavedFile = { url: string; fileName: string };

/**
 * Minimal shape of an uploaded file. We intentionally avoid relying on the
 * global `File` constructor because it is only available as a Node.js global
 * from Node 20+. On older runtimes `instanceof File` throws
 * `ReferenceError: File is not defined`, so we duck-type instead.
 */
export type UploadedFile = {
  type: string;
  size: number;
  name?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

/** Runtime-safe check for a file-like upload from FormData (no `File` global). */
export function isUploadedFile(value: unknown): value is UploadedFile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UploadedFile).arrayBuffer === "function" &&
    typeof (value as UploadedFile).size === "number" &&
    typeof (value as UploadedFile).type === "string"
  );
}

/**
 * Persist an uploaded image to the configured upload directory and return a
 * public URL. Images are compressed (resized + re-encoded) so they stay small
 * without a visible drop in quality. On Railway, UPLOAD_DIR should point to a
 * mounted Volume so the files survive deploys.
 */
export async function saveUploadedImage(file: UploadedFile): Promise<SavedFile> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, GIF or AVIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Maximum size is 12MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const { buffer, ext } = await compressImage(inputBuffer, file.type);

  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await fs.mkdir(absDir, { recursive: true });
  await fs.writeFile(path.join(absDir, fileName), buffer);

  const url = `${PUBLIC_BASE.replace(/\/$/, "")}/${fileName}`;
  return { url, fileName };
}

/**
 * Compress an image: downscale to MAX_DIMENSION on the longest edge and
 * re-encode. Photos (no transparency) become high-quality JPEGs; images with
 * an alpha channel become high-quality WebP to keep transparency while staying
 * small. Animated GIFs are kept as-is to preserve animation. If anything goes
 * wrong, the original bytes are saved unchanged.
 */
async function compressImage(
  input: Buffer,
  type: string,
): Promise<{ buffer: Buffer; ext: string }> {
  // Preserve animated GIFs untouched.
  if (type === "image/gif") {
    return { buffer: input, ext: ".gif" };
  }

  try {
    const image = sharp(input, { failOn: "none" });
    const meta = await image.metadata();

    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
    if (longest > MAX_DIMENSION) {
      image.resize({
        width: meta.width && meta.width >= (meta.height ?? 0) ? MAX_DIMENSION : undefined,
        height: meta.height && (meta.height ?? 0) > (meta.width ?? 0) ? MAX_DIMENSION : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    image.rotate(); // respect EXIF orientation

    if (meta.hasAlpha) {
      const buffer = await image
        .webp({ quality: ENCODE_QUALITY, effort: 4 })
        .toBuffer();
      return { buffer, ext: ".webp" };
    }

    const buffer = await image
      .jpeg({ quality: ENCODE_QUALITY, mozjpeg: true, progressive: true })
      .toBuffer();
    return { buffer, ext: ".jpg" };
  } catch {
    // Fall back to the original bytes if sharp cannot process the image.
    return { buffer: input, ext: ALLOWED.get(type) ?? ".bin" };
  }
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
