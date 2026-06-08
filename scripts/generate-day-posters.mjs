/**
 * Day-celebration poster generator for Zenithia Global School.
 *
 * For each special day in DAYS it:
 *   1. Generates a themed, iconic/symbolic BACKGROUND image with Google Gemini
 *      (cached to scripts/posters/bg/<slug>.png — re-used unless --force).
 *   2. Renders TWO branded poster "models" for that day, each using a DIFFERENT
 *      layout style from a rotating pool, so no two days look the same while a
 *      consistent Zenithia brand (logo, maroon #6E1E3C + gold #C6A875, serif
 *      title, website URL) is always kept.
 *   3. Builds one combined reference PDF of every poster, in order.
 *
 * Output (HD, 2160x2700):
 *   public/posters/NN-<slug>-model1.png
 *   public/posters/NN-<slug>-model2.png
 *   public/posters/zenithia-day-celebrations.pdf
 *
 * Usage:
 *   node --env-file=.env scripts/generate-day-posters.mjs            # all days + PDF
 *   node --env-file=.env scripts/generate-day-posters.mjs --only=republic-day
 *   node --env-file=.env scripts/generate-day-posters.mjs --pdf     # rebuild PDF only
 *   add --force to regenerate the background images too.
 */
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { mkdir, writeFile, access } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileP = promisify(execFile);
const FORCE = process.argv.includes("--force");
const PDF_ONLY = process.argv.includes("--pdf");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];

const ROOT = process.cwd();
const HTML_DIR = path.join(ROOT, "scripts", "posters");
const BG_DIR = path.join(HTML_DIR, "bg");
const OUT_DIR = path.join(ROOT, "public", "posters");
const LOGO = path.join(ROOT, "public", "brand", "logo-full-white.png");
const SITE = "zenithiaglobalschool.com";

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

// Shared art-direction: a clean, full-bleed iconic/symbolic image with NO text.
const STYLE = [
  "A single full-frame, edge-to-edge image that completely fills a tall vertical 4:5 portrait frame.",
  "Clean, modern, iconic and symbolic visual representation of the theme — elegant nature/object symbols and icons, NO people, not busy.",
  "Cinematic warm lighting, rich colors, shallow depth of field, aspirational and premium, with generous calm negative space.",
  "Keep the composition balanced with darker / softly shadowed areas top and bottom so a caption stays legible.",
  "Absolutely no text, no letters, no numbers, no logos, no watermarks, no borders, no frames and no colored bands anywhere.",
  "Not a template or collage — one cohesive image filling the whole frame to all four edges.",
].join(" ");

// n = order number, label = date pill text, day = headline, slug, scene.
const DAYS = [
  { n: 1,  label: "JUNE 5",        day: "World Environment Day",        slug: "world-environment-day",   scene: "A single fresh green sapling with a few leaves growing from rich dark soil, dew drops, blurred lush foliage and gentle sunbeams." },
  { n: 2,  label: "JUNE 14",       day: "World Blood Donor Day",        slug: "world-blood-donor-day",   scene: "A glossy red blood drop shaped subtly like a heart, a soft red awareness ribbon, clean warm red gradient." },
  { n: 3,  label: "JUNE 19",       day: "National Reading Day",         slug: "national-reading-day",    scene: "An open book with pages gently turning into flying birds and soft light, warm library glow." },
  { n: 4,  label: "JUNE 21",       day: "International Yoga Day",        slug: "international-yoga-day",   scene: "A serene pink lotus flower floating on calm misty water at sunrise with smooth zen stones, tranquil." },
  { n: 5,  label: "JUNE 26",       day: "International Anti-Drug Day",   slug: "international-anti-drug-day", scene: "A bright green awareness ribbon beside a crossed-out pill symbol, hopeful clean composition." },
  { n: 6,  label: "JULY 1",        day: "National Doctors' Day",        slug: "national-doctors-day",    scene: "A silver stethoscope curved into a heart shape on a soft teal medical background, caring and clean." },
  { n: 7,  label: "JULY 20",       day: "International Moon Day",        slug: "international-moon-day",   scene: "A detailed luminous full moon with subtle craters over a deep starry night sky." },
  { n: 8,  label: "JULY 26",       day: "National Parents' Day",        slug: "national-parents-day",    scene: "Two gentle cupped hands sheltering a small glowing heart, warm tender light." },
  { n: 9,  label: "JULY 30",       day: "International Friendship Day",  slug: "international-friendship-day", scene: "Colorful woven friendship bands tied in a knot, warm joyful bokeh." },
  { n: 10, label: "AUGUST 6",      day: "Hiroshima Day",                slug: "hiroshima-day",           scene: "A single white origami paper crane beside a soft glowing candle, muted peaceful tones." },
  { n: 11, label: "AUGUST 12",     day: "International Youth Day",       slug: "international-youth-day",  scene: "A radiant sunrise cresting over a mountain peak with an energetic spark of light, hopeful." },
  { n: 12, label: "AUGUST 15",     day: "Independence Day",             slug: "independence-day",        scene: "The Indian tricolour flag waving proudly with the Ashoka Chakra, bright open sky." },
  { n: 13, label: "AUGUST 19",     day: "World Photography Day",        slug: "world-photography-day",   scene: "A vintage camera with a glowing aperture and soft lens flare, bokeh lights." },
  { n: 14, label: "AUGUST 29",     day: "National Sports Day",          slug: "national-sports-day",     scene: "A golden trophy framed by a laurel wreath under dramatic stadium light." },
  { n: 15, label: "SEPTEMBER 5",   day: "Teachers' Day",                slug: "teachers-day",            scene: "An open book with a glowing oil lamp and a graduation cap, warm scholarly light." },
  { n: 16, label: "SEPTEMBER 8",   day: "International Literacy Day",    slug: "international-literacy-day", scene: "A neat stack of books forming steps with a glowing letter rising above, warm." },
  { n: 17, label: "SEPTEMBER 12",  day: "World First Aid Day",          slug: "world-first-aid-day",     scene: "A red medical cross held in a protective hand, clean white and red." },
  { n: 18, label: "SEPTEMBER 14",  day: "Hindi Diwas",                  slug: "hindi-diwas",             scene: "Elegant Devanagari calligraphy letter in flowing ink with a quill, warm saffron tones." },
  { n: 19, label: "SEPTEMBER 16",  day: "World Ozone Day",              slug: "world-ozone-day",         scene: "Planet Earth wrapped in a soft protective glowing blue atmospheric halo, space backdrop." },
  { n: 20, label: "SEPTEMBER 21",  day: "International Day of Peace",    slug: "international-day-of-peace", scene: "A white dove carrying a green olive branch against a calm blue sky." },
  { n: 21, label: "OCTOBER 2",     day: "Gandhi Jayanti",               slug: "gandhi-jayanti",          scene: "Iconic round Gandhi spectacles resting beside a charkha spinning wheel silhouette, khadi texture." },
  { n: 22, label: "OCTOBER 10",    day: "National Postal Day",          slug: "national-postal-day",     scene: "A vintage envelope with a postage stamp and red wax seal, nostalgic warm light." },
  { n: 23, label: "OCTOBER 16",    day: "World Food Day",               slug: "world-food-day",          scene: "A rustic bowl of grains beside a golden wheat sheaf, warm harvest tones." },
  { n: 24, label: "OCTOBER 17",    day: "Eradication of Poverty",       slug: "eradication-of-poverty",  scene: "Open giving hands offering grains of wheat, warm hopeful light." },
  { n: 25, label: "OCTOBER 24",    day: "United Nations Day",           slug: "united-nations-day",      scene: "A stylised globe encircled by olive branches, calm UN blue tones." },
  { n: 26, label: "OCTOBER 29",    day: "International Internet Day",    slug: "international-internet-day", scene: "A glowing network of connected nodes wrapping around the earth, blue digital glow." },
  { n: 27, label: "OCTOBER 31",    day: "National Unity Day",           slug: "national-unity-day",      scene: "A tall statue silhouette against a golden sunset sky, dignified." },
  { n: 28, label: "NOVEMBER 1",    day: "Kerala Piravi Day",            slug: "kerala-piravi-day",       scene: "Kerala backwaters with coconut palms and a traditional snake boat at golden hour." },
  { n: 29, label: "NOVEMBER 8",    day: "Happy Diwali",                 slug: "happy-diwali",            scene: "Rows of glowing clay diya oil lamps with colorful rangoli and festive bokeh." },
  { n: 30, label: "NOVEMBER 10",   day: "World Science Day",            slug: "world-science-day",       scene: "An atom with orbiting electrons beside a glowing beaker, blue laboratory glow." },
  { n: 31, label: "NOVEMBER 11",   day: "National Education Day",       slug: "national-education-day",  scene: "A graduation cap resting on books with a glowing light of knowledge, warm." },
  { n: 32, label: "NOVEMBER 14",   day: "Children's Day",               slug: "childrens-day",           scene: "Colorful balloons, a paper boat and a single red rose, playful cheerful bokeh." },
  { n: 33, label: "NOVEMBER 26",   day: "Constitution Day",             slug: "constitution-day",        scene: "A bound constitution book with the Ashoka emblem and balanced scales of justice." },
  { n: 34, label: "NOVEMBER 30",   day: "Computer Science Day",         slug: "computer-science-day",    scene: "A glowing circuit board with subtle binary code, cool blue tech glow." },
  { n: 35, label: "DECEMBER 1",    day: "World AIDS Day",               slug: "world-aids-day",          scene: "A single red awareness ribbon with soft compassionate lighting." },
  { n: 36, label: "DECEMBER 3",    day: "Persons with Disabilities",    slug: "persons-with-disabilities", scene: "A blue accessibility symbol encircled by supportive hands, inclusive warm light." },
  { n: 37, label: "DECEMBER 10",   day: "Human Rights Day",             slug: "human-rights-day",        scene: "Open hands releasing a white dove toward warm light, hopeful." },
  { n: 38, label: "DECEMBER 14",   day: "Energy Conservation Day",      slug: "energy-conservation-day", scene: "A glowing light bulb with a fresh green leaf inside it, eco green glow." },
  { n: 39, label: "DECEMBER 18",   day: "World Arabic Language Day",    slug: "world-arabic-language-day", scene: "Ornate flowing golden Arabic calligraphy on a deep elegant background." },
  { n: 40, label: "DECEMBER 22",   day: "National Mathematics Day",     slug: "national-mathematics-day", scene: "A chalkboard with elegant formulas, the pi symbol and geometric shapes, scholarly." },
  { n: 41, label: "DECEMBER 24",   day: "National Consumers Day",       slug: "national-consumers-day",  scene: "A shopping bag beside a protective shield with a check mark, clean modern." },
  { n: 42, label: "DECEMBER 25",   day: "Merry Christmas",              slug: "merry-christmas",         scene: "A decorated Christmas tree topped with a glowing golden star, soft snow bokeh." },
  { n: 43, label: "JANUARY 6",     day: "Day of War Orphans",           slug: "day-of-war-orphans",      scene: "A single delicate white flower beside a small candle, somber tender light." },
  { n: 44, label: "JANUARY 25",    day: "National Tourism Day",         slug: "national-tourism-day",    scene: "A silhouette of iconic Indian landmarks at sunset with a vintage compass." },
  { n: 45, label: "JANUARY 26",    day: "Republic Day",                 slug: "republic-day",            scene: "India Gate with the tricolour flag and parade flags against a bright sky." },
  { n: 46, label: "JANUARY 30",    day: "Martyrs' Day",                 slug: "martyrs-day",             scene: "An eternal flame with a marigold garland, respectful solemn tones." },
  { n: 47, label: "FEBRUARY 4",    day: "World Cancer Day",             slug: "world-cancer-day",        scene: "A hopeful awareness ribbon with soft uplifting light, gentle." },
  { n: 48, label: "FEBRUARY 5",    day: "Cyber Security Day",           slug: "cyber-security-day",      scene: "A glowing padlock on a digital shield with subtle circuitry, cool blue tech." },
  { n: 49, label: "FEBRUARY 28",   day: "National Science Day",         slug: "national-science-day",    scene: "A glass prism splitting a beam of light into a vivid spectrum on a dark background." },
  { n: 50, label: "MARCH 8",       day: "International Women's Day",     slug: "international-womens-day", scene: "The Venus symbol entwined with delicate flowers, soft purple gradient." },
  { n: 51, label: "EID UL-FITR",   day: "Eid Mubarak",                  slug: "eid-ul-fitr",             scene: "A glowing crescent moon with an ornate hanging lantern and a mosque silhouette, festive night." },
  { n: 52, label: "ONAM",          day: "Happy Onam",                   slug: "happy-onam",              scene: "An intricate circular Pookalam flower carpet with a banana leaf and traditional Kerala motifs, golden festive." },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function generateBg(ai, scene, bgPath) {
  let lastErr;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: `${STYLE}\n\nScene: ${scene}`,
      });
      const parts = res?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const raw = Buffer.from(part.inlineData.data, "base64");
          await sharp(raw)
            .resize(2160, 2700, { fit: "cover", position: "attention", kernel: "lanczos3" })
            .png()
            .toFile(bgPath);
          return;
        }
      }
      lastErr = new Error(`No image returned by ${model}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("Image generation failed");
}

// ---------------------------------------------------------------------------
// Layout styles. Each keeps the SAME branding (logo, maroon #6E1E3C + gold
// #C6A875, Georgia serif title, website URL) but places the logo / date / day
// title in DIFFERENT positions, so consecutive days never look identical.
// Minimal text only: date label + day name + website. Logo carries the name.
// ---------------------------------------------------------------------------
const BASE = `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1350px}
  body{position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff}
  .bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat}
  .serif{font-family:Georgia,'Times New Roman',serif}
  .url{font-weight:600;letter-spacing:.15em;color:#C6A875;text-shadow:0 2px 10px rgba(0,0,0,.6)}
`;
const wrap = (css, body, bg) =>
  `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE}.bg{background-image:url('file://${bg}')}${css}</style></head><body><div class="bg"></div>${body}</body></html>`;

// 1 — Editorial corner: logo top-left, content bottom-left, gold left bar.
function style1({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:
       linear-gradient(115deg, rgba(110,30,60,.78) 0%, rgba(110,30,60,.10) 42%, rgba(20,6,12,0) 60%),
       linear-gradient(0deg, rgba(20,6,12,.92) 0%, rgba(20,6,12,.10) 38%, rgba(20,6,12,0) 55%)}
    .corner{position:absolute;top:0;left:0;width:340px;height:340px;
       background:radial-gradient(circle at 0 0, rgba(198,168,117,.55), rgba(198,168,117,0) 70%)}
    .logo{position:absolute;top:74px;left:84px;width:230px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .block{position:absolute;left:84px;bottom:118px;max-width:780px;padding-left:34px;border-left:6px solid #C6A875}
    .date{display:inline-block;background:#C6A875;color:#3a0f1f;font-weight:800;letter-spacing:.22em;font-size:24px;padding:9px 24px;border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,.45)}
    h1{margin-top:24px;font-weight:700;font-size:94px;line-height:.98;letter-spacing:-1px;text-shadow:0 6px 30px rgba(0,0,0,.6)}
    .url{margin-top:22px;font-size:21px}
  `, `
    <div class="scrim"></div><div class="corner"></div>
    <img class="logo" src="file://${logo}">
    <div class="block"><span class="date">${label}</span><h1 class="serif">${day}</h1><div class="url">${SITE}</div></div>
  `, bg);
}

// 2 — Centered certificate: double gold frame, logo top-center, centered title.
function style2({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:
       radial-gradient(120% 75% at 50% 18%, rgba(20,6,12,0) 30%, rgba(40,9,19,.55) 78%, rgba(40,9,19,.95) 100%),
       linear-gradient(180deg, rgba(20,6,12,.45) 0%, rgba(20,6,12,0) 30%, rgba(20,6,12,0) 55%, rgba(50,13,27,.85) 100%)}
    .frame{position:absolute;inset:46px;border:2px solid rgba(198,168,117,.75);border-radius:20px}
    .frame::after{content:"";position:absolute;inset:9px;border:1px solid rgba(255,255,255,.30);border-radius:13px}
    .logo{position:absolute;top:92px;left:50%;transform:translateX(-50%);width:262px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .center{position:absolute;left:0;right:0;bottom:148px;text-align:center;padding:0 90px}
    .flourish{display:flex;align-items:center;justify-content:center;gap:18px;color:#C6A875;font-size:22px;letter-spacing:.3em}
    .flourish::before,.flourish::after{content:"";width:90px;height:2px;background:linear-gradient(90deg,transparent,#C6A875)}
    .flourish::after{background:linear-gradient(90deg,#C6A875,transparent)}
    .date{margin-top:6px;font-weight:700;letter-spacing:.34em;font-size:24px;color:#f1e7d4}
    h1{margin-top:16px;font-weight:700;font-size:90px;line-height:1.0;letter-spacing:-1px;text-shadow:0 5px 28px rgba(0,0,0,.6)}
    .url{position:absolute;left:0;right:0;bottom:66px;text-align:center;font-size:21px}
  `, `
    <div class="scrim"></div><div class="frame"></div>
    <img class="logo" src="file://${logo}">
    <div class="center"><div class="flourish">CELEBRATING</div><div class="date">${label}</div><h1 class="serif">${day}</h1></div>
    <div class="url">${SITE}</div>
  `, bg);
}

// 3 — Bottom band: maroon band across the lower area, logo bottom-left,
// title to its right, gold date pill at the top-left.
function style3({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:linear-gradient(180deg, rgba(20,6,12,.55) 0%, rgba(20,6,12,0) 22%, rgba(20,6,12,0) 48%, rgba(50,13,27,.0) 60%)}
    .band{position:absolute;left:0;right:0;bottom:0;height:430px;background:
       linear-gradient(180deg, rgba(50,13,27,0) 0%, rgba(50,13,27,.86) 40%, rgba(40,9,19,.97) 100%);
       border-top:3px solid rgba(198,168,117,.7)}
    .date{position:absolute;top:78px;left:78px;background:#C6A875;color:#3a0f1f;font-weight:800;letter-spacing:.22em;font-size:23px;padding:9px 24px;border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,.45)}
    .logo{position:absolute;bottom:150px;left:78px;width:236px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .title{position:absolute;left:78px;right:78px;bottom:150px;text-align:right}
    h1{font-weight:700;font-size:80px;line-height:.98;letter-spacing:-1px;text-shadow:0 5px 24px rgba(0,0,0,.6)}
    .url{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:21px}
  `, `
    <div class="scrim"></div><div class="band"></div>
    <span class="date">${label}</span>
    <img class="logo" src="file://${logo}">
    <div class="title"><h1 class="serif">${day}</h1></div>
    <div class="url">${SITE}</div>
  `, bg);
}

// 4 — Top focus: date + title anchored TOP-left, logo at the bottom-center.
function style4({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:
       linear-gradient(180deg, rgba(20,6,12,.92) 0%, rgba(20,6,12,.20) 34%, rgba(20,6,12,0) 52%, rgba(40,9,19,.9) 100%)}
    .top{position:absolute;top:96px;left:84px;max-width:820px}
    .date{display:inline-block;background:#6E1E3C;border:1px solid rgba(198,168,117,.8);color:#fff;font-weight:800;letter-spacing:.24em;font-size:23px;padding:9px 24px;border-radius:6px}
    h1{margin-top:24px;font-weight:700;font-size:92px;line-height:.98;letter-spacing:-1px;text-shadow:0 6px 30px rgba(0,0,0,.6)}
    .ruler{margin-top:26px;width:140px;height:4px;background:linear-gradient(90deg,#C6A875,transparent)}
    .logo{position:absolute;bottom:118px;left:50%;transform:translateX(-50%);width:250px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .url{position:absolute;left:0;right:0;bottom:74px;text-align:center;font-size:21px}
  `, `
    <div class="scrim"></div>
    <div class="top"><span class="date">${label}</span><h1 class="serif">${day}</h1><div class="ruler"></div></div>
    <img class="logo" src="file://${logo}">
    <div class="url">${SITE}</div>
  `, bg);
}

// 5 — Right aligned: logo top-right, content bottom-right with gold right bar.
function style5({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:
       linear-gradient(245deg, rgba(110,30,60,.78) 0%, rgba(110,30,60,.10) 42%, rgba(20,6,12,0) 60%),
       linear-gradient(0deg, rgba(20,6,12,.92) 0%, rgba(20,6,12,.10) 38%, rgba(20,6,12,0) 55%)}
    .corner{position:absolute;top:0;right:0;width:340px;height:340px;background:radial-gradient(circle at 100% 0, rgba(198,168,117,.55), rgba(198,168,117,0) 70%)}
    .logo{position:absolute;top:74px;right:84px;width:230px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .block{position:absolute;right:84px;bottom:118px;max-width:780px;padding-right:34px;border-right:6px solid #C6A875;text-align:right}
    .date{display:inline-block;background:#C6A875;color:#3a0f1f;font-weight:800;letter-spacing:.22em;font-size:24px;padding:9px 24px;border-radius:6px;box-shadow:0 10px 26px rgba(0,0,0,.45)}
    h1{margin-top:24px;font-weight:700;font-size:94px;line-height:.98;letter-spacing:-1px;text-shadow:0 6px 30px rgba(0,0,0,.6)}
    .url{margin-top:22px;font-size:21px}
  `, `
    <div class="scrim"></div><div class="corner"></div>
    <img class="logo" src="file://${logo}">
    <div class="block"><span class="date">${label}</span><h1 class="serif">${day}</h1><div class="url">${SITE}</div></div>
  `, bg);
}

// 6 — Seal badge: circular gold seal with the date top-right, big title
// bottom-left, logo bottom-right.
function style6({ label, day }, bg, logo) {
  return wrap(`
    .scrim{position:absolute;inset:0;background:
       linear-gradient(160deg, rgba(20,6,12,.55) 0%, rgba(20,6,12,0) 30%),
       linear-gradient(0deg, rgba(40,9,19,.95) 0%, rgba(20,6,12,.20) 36%, rgba(20,6,12,0) 56%)}
    .seal{position:absolute;top:84px;right:84px;width:208px;height:208px;border-radius:50%;
       border:3px solid #C6A875;background:rgba(110,30,60,.55);display:flex;flex-direction:column;
       align-items:center;justify-content:center;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.45)}
    .seal::after{content:"";position:absolute;inset:10px;border:1px solid rgba(198,168,117,.6);border-radius:50%}
    .seal .lbl{font-size:13px;letter-spacing:.32em;color:#e4d0aa;font-weight:600}
    .seal .d{margin-top:6px;font-weight:800;font-size:30px;letter-spacing:.08em;color:#fff;padding:0 14px}
    .title{position:absolute;left:84px;bottom:170px;max-width:820px}
    h1{font-weight:700;font-size:98px;line-height:.96;letter-spacing:-2px;text-shadow:0 6px 30px rgba(0,0,0,.65)}
    .ruler{margin-top:22px;width:150px;height:4px;background:linear-gradient(90deg,#C6A875,transparent)}
    .logo{position:absolute;bottom:104px;right:84px;width:226px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))}
    .url{position:absolute;left:84px;bottom:104px;font-size:21px}
  `, `
    <div class="scrim"></div>
    <div class="seal"><div class="lbl">CELEBRATING</div><div class="d">${label}</div></div>
    <div class="title"><h1 class="serif">${day}</h1><div class="ruler"></div></div>
    <img class="logo" src="file://${logo}">
    <div class="url">${SITE}</div>
  `, bg);
}

const STYLES = [style1, style2, style3, style4, style5, style6];

// Two DIFFERENT styles per day, rotating so days vary. model1/model2.
function stylesFor(idx) {
  const L = STYLES.length;
  return [STYLES[idx % L], STYLES[(idx + 2) % L]];
}

async function render(htmlPath, outPath) {
  await execFileP(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--force-device-scale-factor=2",
    "--window-size=1080,1350",
    `--screenshot=${outPath}`,
    `file://${htmlPath}`,
  ]);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

async function buildPdf() {
  const thumbDir = path.join(HTML_DIR, "_thumbs");
  await mkdir(thumbDir, { recursive: true });
  const rows = [];
  for (const d of DAYS) {
    const nn = pad(d.n);
    const imgs = [];
    for (const m of [1, 2]) {
      const f = path.join(OUT_DIR, `${nn}-${d.slug}-model${m}.png`);
      if (!(await exists(f))) continue;
      // Lightweight JPEG thumbnail keeps the catalog PDF small & stable.
      const t = path.join(thumbDir, `${nn}-${d.slug}-m${m}.jpg`);
      await sharp(f).resize(620).jpeg({ quality: 72 }).toFile(t);
      imgs.push(`<img src="file://${t}">`);
    }
    if (!imgs.length) continue;
    rows.push(
      `<div class="day"><div class="hd"><span class="num">${nn}</span> ${d.day} <span class="dt">${d.label}</span></div><div class="imgs">${imgs.join("")}</div></div>`
    );
  }
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    @page{size:A4;margin:14mm}
    *{box-sizing:border-box}
    body{font-family:Georgia,serif;color:#320d1b}
    .cover{height:255mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always}
    .cover img{width:120mm;margin-bottom:14mm}
    .cover h1{font-size:30pt;color:#6E1E3C;letter-spacing:.04em}
    .cover p{margin-top:6mm;font-size:13pt;color:#917544;letter-spacing:.16em}
    .day{page-break-inside:avoid;margin-bottom:9mm;border:1px solid #e4d0aa;border-radius:6px;padding:6mm}
    .hd{font-size:15pt;color:#6E1E3C;margin-bottom:4mm;border-bottom:2px solid #C6A875;padding-bottom:2mm}
    .num{display:inline-block;background:#6E1E3C;color:#fff;font-size:11pt;padding:1mm 3mm;border-radius:4px;margin-right:3mm}
    .dt{float:right;font-size:11pt;color:#917544;letter-spacing:.12em}
    .imgs{display:flex;gap:5mm}
    .imgs img{width:50%;border-radius:4px;border:1px solid #ddd}
  </style></head><body>
    <div class="cover"><img src="file://${path.join(ROOT, "public", "brand", "logo-full.png")}"><h1>Day Celebrations 2026&ndash;27</h1><p>POSTER REFERENCE CATALOG &bull; ${SITE.toUpperCase()}</p></div>
    ${rows.join("\n")}
  </body></html>`;
  const pdfHtml = path.join(HTML_DIR, "_catalog.html");
  await writeFile(pdfHtml, html, "utf8");
  const pdfOut = path.join(OUT_DIR, "zenithia-day-celebrations.pdf");
  await execFileP(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfOut}`,
    `file://${pdfHtml}`,
  ]);
  console.log(`✓ PDF: public/posters/zenithia-day-celebrations.pdf`);
}

async function main() {
  await mkdir(BG_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  if (PDF_ONLY) {
    await buildPdf();
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("✖ GEMINI_API_KEY is not set. Run: node --env-file=.env scripts/generate-day-posters.mjs");
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const days = ONLY ? DAYS.filter((d) => d.slug === ONLY) : DAYS;
  if (days.length === 0) {
    console.log(`No day matches --only=${ONLY}.`);
    return;
  }

  for (const d of days) {
    const idx = DAYS.indexOf(d);
    const nn = pad(d.n);
    try {
      const bgPath = path.join(BG_DIR, `${d.slug}.png`);
      if (!(await exists(bgPath)) || FORCE) {
        process.stdout.write(`→ [${nn}] background "${d.day}" ... `);
        await generateBg(ai, d.scene, bgPath);
        console.log("done");
      } else {
        console.log(`• [${nn}] reuse background "${d.day}"`);
      }

      const [m1, m2] = stylesFor(idx);
      const htmlPath = path.join(HTML_DIR, `_render.html`);
      for (const [m, fn] of [[1, m1], [2, m2]]) {
        await writeFile(htmlPath, fn(d, bgPath, LOGO), "utf8");
        const outPath = path.join(OUT_DIR, `${nn}-${d.slug}-model${m}.png`);
        await render(htmlPath, outPath);
      }
      console.log(`  ✓ ${nn}-${d.slug}-model1.png + model2.png`);
    } catch (err) {
      console.error(`  ✖ [${nn}] "${d.day}" failed: ${err?.message || err}`);
    }
  }

  await buildPdf();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
