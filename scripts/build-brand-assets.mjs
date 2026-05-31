// One-off helper: turns the supplied logo/banner files into clean,
// URL-safe, optimised brand assets in /public/brand and app icons.
// Run with: node scripts/build-brand-assets.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const uploads = path.join(root, "public", "uploads");
const brand = path.join(root, "public", "brand");
const appDir = path.join(root, "src", "app");

const SRC = {
  banner1: path.join(uploads, "Banner 01.png"),
  banner2: path.join(uploads, "Banner 02.png"),
  logoFull: path.join(uploads, "logowith text.jpg"),
  logoMark: path.join(uploads, "logo .jpg"),
};

// Make near-white pixels transparent so the logo sits on any background.
async function makeTransparent(src, { threshold = 238 } = {}) {
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0; // fully transparent
    }
  }
  return sharp(data, { raw: { width, height, channels } })
    .png()
    .trim();
}

async function main() {
  await mkdir(brand, { recursive: true });

  // Banners – optimise the 4K PNGs down to web-friendly size.
  await sharp(SRC.banner1)
    .resize({ width: 2400, withoutEnlargement: true })
    .png({ quality: 82, compressionLevel: 9 })
    .toFile(path.join(brand, "banner-1.png"));
  await sharp(SRC.banner2)
    .resize({ width: 2400, withoutEnlargement: true })
    .png({ quality: 82, compressionLevel: 9 })
    .toFile(path.join(brand, "banner-2.png"));
  console.log("✔ banners");

  // Full logo (mark + text) – transparent, for the navbar.
  const full = await makeTransparent(SRC.logoFull);
  await full
    .clone()
    .resize({ height: 200, withoutEnlargement: true })
    .toFile(path.join(brand, "logo-full.png"));
  console.log("✔ logo-full.png");

  // White (reversed) full logo – same lockup recolored solid white so it reads
  // on the dark maroon footer. Keeps the original alpha for clean edges.
  {
    const { data, info } = await full
      .clone()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      data[i] = 255; // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B (alpha at i+3 is preserved)
    }
    await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .resize({ height: 200, withoutEnlargement: true })
      .png()
      .toFile(path.join(brand, "logo-full-white.png"));
    console.log("✔ logo-full-white.png");
  }

  // Mark only – transparent, used for icons / scroll cue / favicon.
  const mark = await makeTransparent(SRC.logoMark);
  await mark
    .clone()
    .resize({ height: 256, withoutEnlargement: true })
    .toFile(path.join(brand, "logo-mark.png"));
  console.log("✔ logo-mark.png");

  // App icons (favicon + apple touch icon) from the mark, padded square.
  const square = await mark
    .clone()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp(square).resize(64, 64).png().toFile(path.join(appDir, "icon.png"));
  await sharp(square)
    .resize(180, 180)
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));
  console.log("✔ app icons");

  console.log("\n🎉 Brand assets ready in public/brand");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
