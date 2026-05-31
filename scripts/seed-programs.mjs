/**
 * Seeds the 2026-27 calendar programs/events into the database and generates a
 * branded image for each one with Google Gemini.
 *
 * The images are intentionally exported as SMALL, low-quality WebP files
 * (720x405, quality ~52) because they are loaded on the public website and we
 * want fast page loads with no heavy assets. The image path is stored on the
 * Program row, so everything stays fully admin-editable.
 *
 * Usage:
 *   node --env-file=.env scripts/seed-programs.mjs          (skips ones already imaged)
 *   node --env-file=.env scripts/seed-programs.mjs --force  (regenerate every image)
 */
import { GoogleGenAI } from "@google/genai";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const FORCE = process.argv.includes("--force");
const OUT_DIR = path.join(process.cwd(), "public", "programs");
const PUBLIC_BASE = "/programs";

// Candidate image-capable models, tried in order.
const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

// Shared brand art-direction so every image matches the school style.
const STYLE = [
  "A single, full-frame, edge-to-edge photorealistic photograph that completely fills the entire image.",
  "Cinematic editorial photography for a premium Indian international school brand.",
  "Warm natural lighting with a tasteful deep maroon (#6E1E3C) and soft gold (#C6A875) color accent.",
  "When students appear, they are happy, confident Indian school children wearing a plain solid maroon polo shirt with khaki trousers — identical uniform, no ties, scarves, sashes or extra accessories.",
  "Modern, clean, aspirational and high-end. Shallow depth of field.",
  "Absolutely no text, no letters, no numbers, no logos and no watermarks anywhere in the image.",
  "This is a real photograph, NOT a social-media template or poster:",
  "no borders, no frames, no colored bands or strips, no header or footer bar, no margins, no collage and no split panels.",
  "The photographic scene must reach all four edges of the image and fill it from corner to corner.",
  "Wide horizontal 16:9 composition.",
].join(" ");

// Each program: title, description, ISO date (2026-27 calendar), location, and
// the image scene used for generation.
const PROGRAMS = [
  {
    title: "School Reopens after Summer Vacation",
    date: "2026-06-01",
    location: "Main Campus",
    description:
      "We warmly welcome all our students back for the new academic year after the summer break. A fresh start full of learning, friendships and new goals.",
    scene:
      "Cheerful Indian school students walking happily through the school gate on the first day back after summer vacation, greeted by smiling teachers, bright morning light.",
  },
  {
    title: "World Environment Day",
    date: "2026-06-05",
    location: "School Campus",
    description:
      "Students celebrate World Environment Day by planting saplings and pledging to protect nature, building awareness about a greener, cleaner future.",
    scene:
      "Indian school students planting green saplings in the school garden, holding small plants and watering cans, lush greenery, joyful and caring.",
  },
  {
    title: "World Blood Donor Day & Malarvadi Programme",
    date: "2026-06-14",
    location: "School Auditorium",
    description:
      "An awareness day on the importance of voluntary blood donation, along with Malarvadi Bala Sangham activities that nurture creativity and social values in children.",
    scene:
      "A warm school health-awareness assembly about voluntary blood donation, students wearing small red ribbons, a friendly doctor and nurse speaking to attentive children.",
  },
  {
    title: "National Reading Day",
    date: "2026-06-19",
    location: "Library & Resource Centre",
    description:
      "Marking Reading Day in honour of P. N. Panicker, we celebrate the joy of reading with library activities that inspire a lifelong love of books.",
    scene:
      "Indian school students reading books happily in a warm elegant library with tall wooden bookshelves and soft reading light, immersed and curious.",
  },
  {
    title: "International Yoga Day",
    date: "2026-06-21",
    location: "School Grounds",
    description:
      "Students and teachers come together for a yoga session promoting physical fitness, mindfulness and inner balance on International Yoga Day.",
    scene:
      "Indian school students doing yoga poses together on green school grounds in the calm morning light, yoga mats, peaceful and focused.",
  },
  {
    title: "Muharram – Holiday",
    date: "2026-06-25",
    location: "Holiday",
    description:
      "The school remains closed in observance of Muharram. We wish peace and reflection to all members of the Zenithia family.",
    scene:
      "A serene minimalist scene of a thin golden crescent moon and softly glowing traditional lanterns against a deep maroon twilight sky, peaceful and respectful, no people.",
  },
  {
    title: "International Anti-Drug Day & Malarvadi Programme",
    date: "2026-06-26",
    location: "School Auditorium",
    description:
      "An awareness programme against drug abuse, empowering students to make healthy choices, combined with Malarvadi activities that build confidence and character.",
    scene:
      "An inspiring school awareness assembly promoting a healthy drug-free life, students standing together raising their hands in a pledge, bright and hopeful atmosphere.",
  },
  {
    title: "National Doctors' Day",
    date: "2026-07-01",
    location: "School Campus",
    description:
      "We honour the dedication of doctors and healthcare workers. Students learn about medicine and gratitude through engaging activities and role-play.",
    scene:
      "Young Indian school children happily dressed up as doctors with white coats and toy stethoscopes, honouring doctors, cheerful classroom celebration.",
  },
  {
    title: "Basheer Day",
    date: "2026-07-05",
    location: "School Auditorium",
    description:
      "A literary tribute to the legendary Malayalam writer Vaikom Muhammad Basheer, celebrating his stories and the timeless beauty of language and literature.",
    scene:
      "A warm literary tribute scene, Indian school students holding open storybooks on a softly lit stage decorated with maroon and gold drapes, celebrating literature.",
  },
  {
    title: "International Moon Day",
    date: "2026-07-20",
    location: "School Grounds",
    description:
      "Celebrating humankind's journey to the Moon, students explore space and astronomy through stargazing, models and interactive science activities.",
    scene:
      "Indian school students gazing up at a glowing full moon through a telescope on the school grounds at night, starry sky, wonder and curiosity.",
  },
  {
    title: "Hiroshima Day",
    date: "2026-08-06",
    location: "School Auditorium",
    description:
      "On Hiroshima Day, students reflect on the value of peace and non-violence, releasing paper cranes and pledging to build a more compassionate world.",
    scene:
      "A gentle school peace observance, Indian school children holding white paper cranes and lit candles, white doves, soft warm light, hopeful and solemn.",
  },
  {
    title: "Quit India Day",
    date: "2026-08-08",
    location: "School Grounds",
    description:
      "Commemorating the Quit India Movement, students remember the freedom struggle with patriotic songs, speeches and a proud tricolour salute.",
    scene:
      "Proud Indian school students saluting the Indian tricolour flag on the school grounds, patriotic celebration, marigold decorations, warm morning sunlight.",
  },
  {
    title: "Nagasaki Day",
    date: "2026-08-09",
    location: "School Auditorium",
    description:
      "Observing Nagasaki Day, our students renew their commitment to peace and harmony through reflection, art and a candle of hope for the world.",
    scene:
      "A quiet candlelight peace observance in school, Indian children gently holding glowing candles and white paper lanterns, doves, soft warm hopeful light.",
  },
];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateImage(ai, prompt) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({ model, contents: prompt });
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

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "✖ GEMINI_API_KEY is not set. Add it to .env, then run:\n  node --env-file=.env scripts/seed-programs.mjs"
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  for (const p of PROGRAMS) {
    const slug = slugify(p.title);
    const file = `${slug}.webp`;
    const imageUrl = `${PUBLIC_BASE}/${file}`;

    const existing = await prisma.program.findFirst({ where: { title: p.title } });
    const hasImage =
      existing?.imageUrl && existing.imageUrl.startsWith(`${PUBLIC_BASE}/`);

    // 1. Generate the image (unless it already exists and not forcing).
    if (hasImage && !FORCE) {
      console.log(`• Image exists for "${p.title}" — skipping generation`);
    } else {
      process.stdout.write(`→ Generating image for "${p.title}" ... `);
      try {
        const raw = await generateImage(ai, `${STYLE}\n\nScene: ${p.scene}`);
        const optimized = await sharp(raw)
          // Drop any flat poster-style border the model may add, then crop to a
          // small 16:9 card and compress hard so the web asset stays tiny.
          .trim({ threshold: 25 })
          .resize(720, 405, { fit: "cover", position: "centre" })
          .webp({ quality: 52, effort: 6 })
          .toBuffer();
        await writeFile(path.join(OUT_DIR, file), optimized);
        console.log(`done → ${imageUrl} (${Math.round(optimized.length / 1024)} KB)`);
      } catch (err) {
        console.log("FAILED");
        console.error(`   ${err?.message ?? err}`);
      }
    }

    // 2. Upsert the program row (by title) with the image path.
    const data = {
      title: p.title,
      description: p.description,
      location: p.location,
      date: new Date(`${p.date}T00:00:00.000Z`),
      published: true,
      imageUrl,
    };
    if (existing) {
      await prisma.program.update({ where: { id: existing.id }, data });
    } else {
      await prisma.program.create({ data });
    }
  }

  console.log(`\n✔ ${PROGRAMS.length} programs seeded with optimized images.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
