/**
 * Generates branded facility images with Google Gemini and stores their URLs
 * in the database, so the "World-class facilities" section stays fully
 * admin-editable (the image path lives in the Facility row, not in code).
 *
 * Usage:
 *   1. Add GEMINI_API_KEY=... to your .env  (https://aistudio.google.com/apikey)
 *   2. node --env-file=.env scripts/generate-facility-images.mjs
 *
 * Re-running only (re)generates facilities that don't yet have a generated
 * image, unless you pass --force to regenerate every facility.
 */
import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const FORCE = process.argv.includes("--force");
const OUT_DIR = path.join(process.cwd(), "public", "facilities");
const PUBLIC_BASE = "/facilities";

// Candidate image-capable models, tried in order.
const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

// Shared brand art-direction so every image matches the reference style.
const STYLE = [
  "A single, full-frame, edge-to-edge photorealistic photograph that completely fills the entire image.",
  "Cinematic editorial photography for a premium international school brand.",
  "Warm golden-hour lighting with a deep maroon (#6E1E3C) and soft gold (#C6A875) color grade.",
  "Happy, confident Indian school students all wearing the SAME uniform: a plain solid maroon polo shirt with khaki trousers.",
  "Every student wears the identical maroon polo and khaki trousers — no scarves, no stoles, no sashes, no ties, no jackets, no extra accessories.",
  "Modern, clean, aspirational and high-end. Shallow depth of field.",
  "Absolutely no text, no letters, no logos and no watermarks anywhere in the image.",
  "This is a real photograph, NOT a social-media template or poster:",
  "no borders, no frames, no colored bands or strips, no maroon header or footer bar, no margins, no padding, no solid color blocks, no collage and no split panels.",
  "The photographic scene must reach all four edges of the image and fill it from corner to corner.",
  "Wide horizontal 16:10 composition.",
].join(" ");

// Scene per facility (matched loosely by title keywords).
function sceneFor(title = "", description = "") {
  const t = title.toLowerCase();
  if (t.includes("classroom"))
    return "A bright, modern classroom with students attentively learning, an interactive smart board glowing softly in the background, neat wooden desks.";
  if (t.includes("science") || t.includes("computer") || t.includes("lab"))
    return "Students in a modern science and computer laboratory, carefully doing a hands-on experiment with lab equipment and computers, focused and curious.";
  if (t.includes("library") || t.includes("resource"))
    return "Students reading books in a warm, elegant library with tall wooden bookshelves and soft reading light.";
  if (t.includes("sport") || t.includes("playground") || t.includes("ground"))
    return "Students playing sports on a lush green school playground at sunset, dynamic and joyful, running with a ball.";
  if (t.includes("art") || t.includes("activity") || t.includes("music"))
    return "Students in a creative arts and activity room, painting on canvases and playing musical instruments, colorful and expressive.";
  if (t.includes("transport") || t.includes("bus"))
    return "A clean modern yellow-and-maroon school bus parked at a campus, smiling students boarding safely with a friendly attendant.";
  // Fallback built from the facility's own text.
  return `A premium school facility representing "${title}". ${description}`.trim();
}

async function generateImage(ai, prompt) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const parts = res?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
      lastErr = new Error(`No image returned by ${model}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("Image generation failed");
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "✖ GEMINI_API_KEY is not set. Add it to .env, then run:\n  node --env-file=.env scripts/generate-facility-images.mjs"
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const facilities = await prisma.facility.findMany({ orderBy: { order: "asc" } });
  if (facilities.length === 0) {
    console.log("No facilities found. Run the seed first (npm run db:seed).");
    return;
  }

  for (const f of facilities) {
    const alreadyGenerated =
      f.imageUrl && f.imageUrl.startsWith(`${PUBLIC_BASE}/`);
    if (alreadyGenerated && !FORCE) {
      console.log(`• Skipping "${f.title}" (already has an image)`);
      continue;
    }

    const prompt = `${STYLE}\n\nScene: ${sceneFor(f.title, f.description)}`;
    process.stdout.write(`→ Generating "${f.title}" ... `);
    try {
      const raw = await generateImage(ai, prompt);
      const slug = slugify(f.title) || `facility-${f.id}`;
      const file = `${slug}.png`;
      const optimized = await sharp(raw)
        // The model sometimes bakes a flat colored band/strip along an edge
        // (imitating a poster template). Trim those uniform borders away so we
        // keep only the real photograph, then crop to the brand aspect ratio.
        .trim({ threshold: 25 })
        .resize(1280, 800, { fit: "cover", position: "centre" })
        .png({ quality: 84, compressionLevel: 9 })
        .toBuffer();
      await writeFile(path.join(OUT_DIR, file), optimized);
      await prisma.facility.update({
        where: { id: f.id },
        data: { imageUrl: `${PUBLIC_BASE}/${file}` },
      });
      console.log(`done → ${PUBLIC_BASE}/${file}`);
    } catch (err) {
      console.log("FAILED");
      console.error(`   ${err?.message ?? err}`);
    }
  }

  console.log("\n✔ Facility images updated in the database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
