import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUploadedImage, isUploadedFile } from "@/lib/upload";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!isUploadedFile(file)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const saved = await saveUploadedImage(file);
    return NextResponse.json(saved);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
