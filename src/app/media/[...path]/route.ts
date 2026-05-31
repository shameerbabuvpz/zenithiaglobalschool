import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  // Guard against path traversal: only a single, simple filename is allowed.
  const segments = params.path || [];
  if (segments.length !== 1) {
    return new NextResponse("Not found", { status: 404 });
  }
  const fileName = segments[0];
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(fileName).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  const filePath = path.join(absDir, fileName);

  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
