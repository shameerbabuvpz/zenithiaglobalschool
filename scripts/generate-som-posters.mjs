// Generates 4 different "Student of the Month" poster styles, all on the Zenithia
// new brand kit (Zenith Maroon / Sand Beige, Archivo + Inter, cinematic look).
// Each poster keeps BLANK placeholders to fill later: month, photo, name, class.
//
// Usage:
//   node scripts/generate-som-posters.mjs            -> render all 4 (PDF + PNG)
//   node scripts/generate-som-posters.mjs --only=1   -> render one style
//   node scripts/generate-som-posters.mjs --preview  -> also write small JPEG previews to /tmp
//
// Output: public/posters/zenithia-student-of-month-style{1..4}.{pdf,png}

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const OUT = join(ROOT, "public", "posters");
const TMP = tmpdir();
mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const LOGO = "file://" + join(ROOT, "public", "brand", "logo-full-white.png");
const SITE = "zenithiaglobalschool.com";

// ---- shared head / brand tokens -------------------------------------------
const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`;

const VARS = `
  :root{
    --maroon:#7A1F35; --maroon-deep:#4d1322; --maroon-glow:#94304a;
    --beige:#D8C3A5; --ink:#181819; --white:#F7F5F2;
  }`;

const BASE = `
  @page { size: A4 portrait; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  ${VARS}
  html,body{ width:210mm; height:297mm; }
  body{ font-family:'Inter','Helvetica Neue',Arial,sans-serif; color:var(--white);
        position:relative; overflow:hidden; background:var(--maroon); }
  .display{ font-family:'Archivo','Helvetica Neue',Arial,sans-serif; }
  .scene{ position:absolute; inset:0;
    background:radial-gradient(82% 52% at 50% 30%, var(--maroon-glow) 0%, var(--maroon) 44%, var(--maroon-deep) 100%); }
  .floor{ position:absolute; left:0; right:0; bottom:0; height:70mm;
    background:linear-gradient(180deg, rgba(24,24,25,0) 0%, rgba(216,195,165,.10) 32%, rgba(216,195,165,.22) 100%);
    border-top:0.4pt solid rgba(216,195,165,.18); }
  .vignette{ position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(120% 80% at 50% 36%, rgba(24,24,25,0) 50%, rgba(24,24,25,.55) 100%); }
  .ph{ color:rgba(216,195,165,.85); }`;

// ---- reusable graphics -----------------------------------------------------
const laurel = `<svg viewBox="0 0 60 170" fill="none" stroke="#D8C3A5" stroke-width="2" stroke-linecap="round">
  <path d="M52 8 Q22 50 26 162"/>
  <g fill="#D8C3A5" stroke="none">
    <ellipse cx="44" cy="30" rx="9" ry="4" transform="rotate(-40 44 30)"/>
    <ellipse cx="38" cy="50" rx="10" ry="4.4" transform="rotate(-30 38 50)"/>
    <ellipse cx="33" cy="72" rx="11" ry="4.6" transform="rotate(-22 33 72)"/>
    <ellipse cx="30" cy="95" rx="11" ry="4.6" transform="rotate(-14 30 95)"/>
    <ellipse cx="28" cy="118" rx="10" ry="4.4" transform="rotate(-8 28 118)"/>
    <ellipse cx="27" cy="140" rx="8.5" ry="4" transform="rotate(-4 27 140)"/>
  </g></svg>`;

const medal = `<svg viewBox="0 0 100 100">
  <g fill="none" stroke="#D8C3A5" stroke-width="2.2">
    <circle cx="50" cy="44" r="24"/><circle cx="50" cy="44" r="19" stroke-width="1" opacity=".55"/></g>
  <path d="M50 30 l4.5 9.2 10.1 1.5 -7.3 7.1 1.7 10.1 -9-4.8 -9 4.8 1.7-10.1 -7.3-7.1 10.1-1.5z" fill="#D8C3A5"/>
  <path d="M38 64 l-7 22 12-6 8 9 4-20z" fill="#7A1F35" stroke="#D8C3A5" stroke-width="1.6"/>
  <path d="M62 64 l7 22 -12-6 -8 9 -4-20z" fill="#7A1F35" stroke="#D8C3A5" stroke-width="1.6"/></svg>`;

const cornerSvg = `<svg viewBox="0 0 100 100" fill="none" stroke="#D8C3A5" stroke-width="1.4" stroke-linecap="round">
  <path d="M4 40 Q4 4 40 4"/><path d="M12 46 Q12 12 46 12" opacity=".6"/>
  <circle cx="4" cy="40" r="2.2" fill="#D8C3A5" stroke="none"/><circle cx="40" cy="4" r="2.2" fill="#D8C3A5" stroke="none"/>
  <path d="M22 22 l8 0 M22 22 l0 8" opacity=".8"/></svg>`;

const sparks = `
  <div class="spark" style="top:60mm; left:22mm;">&#10038;</div>
  <div class="spark" style="top:96mm; right:20mm; font-size:18pt;">&#10038;</div>
  <div class="spark" style="top:150mm; left:18mm; font-size:11pt;">&#10038;</div>
  <div class="spark" style="top:188mm; right:24mm; font-size:16pt;">&#10038;</div>
  <div class="spark" style="top:120mm; left:30mm; font-size:9pt;">&#10038;</div>`;

const photoInner = `<div class="ph-icon">&#128247;</div><div class="ph-text">Add Photo</div>`;
const stars = `&#9733; &#9733; &#9733; &#9733; &#9733;`;

// ============================================================================
// STYLE 1 — Medallion Classic (laurels + circular photo, centered)
// ============================================================================
function style1() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${FONTS}<style>${BASE}
  .frame{ position:absolute; inset:6mm; border:0.8pt solid rgba(216,195,165,.45); border-radius:2mm; }
  .frame-inner{ position:absolute; inset:8mm; border:0.5pt solid rgba(216,195,165,.22); border-radius:1.5mm; }
  .corner{ position:absolute; width:34mm; height:34mm; opacity:.85; } .corner svg{ width:100%; height:100%; }
  .corner.tl{ top:9mm; left:9mm; } .corner.tr{ top:9mm; right:9mm; transform:scaleX(-1); }
  .corner.bl{ bottom:9mm; left:9mm; transform:scaleY(-1); } .corner.br{ bottom:9mm; right:9mm; transform:scale(-1,-1); }
  .spark{ position:absolute; color:var(--beige); opacity:.18; font-size:14pt; line-height:1; }
  .page{ position:absolute; inset:6mm; padding:11mm 14mm 10mm; display:flex; flex-direction:column; align-items:center; text-align:center; z-index:2; }
  .head img{ height:26mm; }
  .emblem{ margin-top:5mm; width:23mm; height:23mm; }
  .eyebrow{ margin-top:4mm; font-size:10.5pt; letter-spacing:.5em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .month{ margin-top:4mm; display:inline-flex; align-items:center; gap:7mm; min-width:120mm; justify-content:center;
    font-size:40pt; letter-spacing:.04em; color:var(--white); font-weight:900; text-transform:uppercase; }
  .month::before,.month::after{ content:"\\2756"; font-size:14pt; color:var(--beige); font-weight:400; }
  .title{ margin-top:5mm; font-size:20pt; letter-spacing:.32em; color:var(--beige); font-weight:800; text-transform:uppercase; }
  .photo-wrap{ margin-top:8mm; position:relative; display:flex; align-items:center; justify-content:center; }
  .laurel{ width:28mm; height:80mm; } .laurel svg{ width:100%; height:100%; } .laurel.right{ transform:scaleX(-1); }
  .photo{ width:84mm; height:84mm; border-radius:50%; margin:0 4mm; border:2.4pt solid var(--beige); background:rgba(247,245,242,.06);
    box-shadow:0 0 0 1.4mm rgba(122,31,53,.55), 0 6mm 18mm rgba(24,24,25,.45);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; overflow:hidden; }
  .ph-icon{ font-size:30pt; color:rgba(216,195,165,.65); } .ph-text{ font-size:8.5pt; letter-spacing:.34em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  .stars{ margin-top:9mm; font-size:14pt; letter-spacing:.5em; color:var(--beige); }
  .name{ margin-top:5mm; font-size:27pt; letter-spacing:.05em; color:var(--white); font-weight:800; text-transform:uppercase; }
  .name-rule{ margin:4mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--beige); font-size:11pt; }
  .name-rule .seg{ width:26mm; height:1.2pt; background:linear-gradient(90deg,transparent,var(--beige),transparent); opacity:.85; }
  .klass{ margin-top:6mm; display:inline-block; padding:3.2mm 11mm; border:0.9pt solid rgba(216,195,165,.5); border-radius:30mm;
    font-size:12.5pt; letter-spacing:.22em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .foot{ margin-top:auto; padding-top:8mm; }
  .foot .line{ display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--beige); font-size:9pt; margin-bottom:3.5mm; }
  .foot .line .seg{ width:24mm; height:1pt; background:var(--beige); opacity:.7; }
  .foot .url{ font-size:11.5pt; letter-spacing:.2em; color:var(--beige); font-weight:600; font-family:'Archivo',sans-serif; }
  .foot .tag{ margin-top:2.5mm; font-size:8pt; letter-spacing:.36em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  </style></head><body>
  <div class="scene"></div><div class="floor"></div><div class="vignette"></div>
  <div class="frame"></div><div class="frame-inner"></div>
  <div class="corner tl">${cornerSvg}</div><div class="corner tr">${cornerSvg}</div>
  <div class="corner bl">${cornerSvg}</div><div class="corner br">${cornerSvg}</div>
  ${sparks}
  <div class="page">
    <div class="head"><img src="${LOGO}" alt="Zenithia Global School"/></div>
    <div class="emblem">${medal}</div>
    <div class="eyebrow">Celebrating Excellence</div>
    <div class="month display"><span class="ph">MONTH YEAR</span></div>
    <div class="title display">Student of the Month</div>
    <div class="photo-wrap">
      <div class="laurel left">${laurel}</div>
      <div class="photo">${photoInner}</div>
      <div class="laurel right">${laurel}</div>
    </div>
    <div class="stars">${stars}</div>
    <div class="name display"><span class="ph">[ Student Name ]</span></div>
    <div class="name-rule"><span class="seg"></span>&#10022;<span class="seg"></span></div>
    <div class="klass"><span class="ph">Class / Division</span></div>
    <div class="foot">
      <div class="line"><span class="seg"></span>&#10038;<span class="seg"></span></div>
      <div class="url">${SITE}</div>
      <div class="tag">Knowledge &bull; Character &bull; Excellence</div>
    </div>
  </div></body></html>`;
}

// ============================================================================
// STYLE 2 — Modern Editorial (big top photo band, bold month overlay, details below)
// ============================================================================
function style2() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${FONTS}<style>${BASE}
  .page{ position:absolute; inset:0; display:flex; flex-direction:column; z-index:2; }
  .hero{ position:relative; height:150mm; overflow:hidden;
    background:linear-gradient(160deg, var(--maroon-glow), var(--maroon-deep)); border-bottom:2pt solid var(--beige); }
  .hero .photo{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4mm;
    background:rgba(24,24,25,.18); }
  .hero .ph-icon{ font-size:44pt; color:rgba(216,195,165,.6); } .hero .ph-text{ font-size:10pt; letter-spacing:.4em; color:rgba(247,245,242,.75); text-transform:uppercase; }
  .hero .scrim{ position:absolute; inset:0; background:linear-gradient(180deg, rgba(24,24,25,.45) 0%, rgba(24,24,25,0) 30%, rgba(24,24,25,0) 55%, rgba(122,31,53,.85) 100%); }
  .hero .logo{ position:absolute; top:11mm; left:14mm; height:22mm; z-index:3; }
  .hero .corner-badge{ position:absolute; top:10mm; right:13mm; width:24mm; height:24mm; z-index:3; }
  .hero .headline{ position:absolute; left:14mm; right:14mm; bottom:10mm; z-index:3; }
  .hero .eyebrow{ font-size:10pt; letter-spacing:.46em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .hero .month{ margin-top:3mm; font-size:52pt; line-height:.95; letter-spacing:.01em; color:var(--white); font-weight:900; text-transform:uppercase; }
  .hero .title{ margin-top:3mm; font-size:18pt; letter-spacing:.3em; color:var(--beige); font-weight:800; text-transform:uppercase; }
  .body{ flex:1; padding:14mm 16mm 12mm; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .stars{ font-size:16pt; letter-spacing:.5em; color:var(--beige); }
  .name{ margin-top:7mm; font-size:32pt; letter-spacing:.05em; color:var(--white); font-weight:800; text-transform:uppercase; }
  .name-rule{ margin:5mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--beige); font-size:12pt; }
  .name-rule .seg{ width:30mm; height:1.2pt; background:linear-gradient(90deg,transparent,var(--beige),transparent); opacity:.85; }
  .klass{ margin-top:8mm; display:inline-block; padding:4mm 13mm; border:0.9pt solid rgba(216,195,165,.5); border-radius:30mm;
    font-size:13pt; letter-spacing:.22em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .foot{ margin-top:auto; padding-top:10mm; text-align:center; }
  .foot .url{ font-size:12pt; letter-spacing:.2em; color:var(--beige); font-weight:600; font-family:'Archivo',sans-serif; }
  .foot .tag{ margin-top:2.5mm; font-size:8pt; letter-spacing:.36em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  </style></head><body>
  <div class="scene"></div><div class="floor"></div>
  <div class="page">
    <div class="hero">
      <div class="photo"><div class="ph-icon">&#128247;</div><div class="ph-text">Add Photo</div></div>
      <div class="scrim"></div>
      <img class="logo" src="${LOGO}" alt="Zenithia Global School"/>
      <div class="corner-badge">${medal}</div>
      <div class="headline">
        <div class="eyebrow">Celebrating Excellence</div>
        <div class="month display"><span class="ph">MONTH YEAR</span></div>
        <div class="title display">Student of the Month</div>
      </div>
    </div>
    <div class="body">
      <div class="stars">${stars}</div>
      <div class="name display"><span class="ph">[ Student Name ]</span></div>
      <div class="name-rule"><span class="seg"></span>&#10022;<span class="seg"></span></div>
      <div class="klass"><span class="ph">Class / Division</span></div>
      <div class="foot">
        <div class="url">${SITE}</div>
        <div class="tag">Knowledge &bull; Character &bull; Excellence</div>
      </div>
    </div>
  </div></body></html>`;
}

// ============================================================================
// STYLE 3 — Certificate Frame (ornate double border, square rounded photo, seal)
// ============================================================================
function style3() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${FONTS}<style>${BASE}
  .frame{ position:absolute; inset:7mm; border:2.4pt solid var(--beige); border-radius:2mm; }
  .frame2{ position:absolute; inset:10mm; border:0.7pt solid rgba(216,195,165,.45); border-radius:1.5mm; }
  .corner{ position:absolute; width:30mm; height:30mm; }
  .corner.tl{ top:11mm; left:11mm; } .corner.tr{ top:11mm; right:11mm; transform:scaleX(-1); }
  .corner.bl{ bottom:11mm; left:11mm; transform:scaleY(-1); } .corner.br{ bottom:11mm; right:11mm; transform:scale(-1,-1); }
  .page{ position:absolute; inset:7mm; padding:14mm 18mm 13mm; display:flex; flex-direction:column; align-items:center; text-align:center; z-index:2; }
  .head img{ height:24mm; }
  .eyebrow{ margin-top:7mm; font-size:10pt; letter-spacing:.5em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .month{ margin-top:4mm; font-size:44pt; letter-spacing:.03em; color:var(--white); font-weight:900; text-transform:uppercase; }
  .rule-orn{ margin:5mm auto 0; display:flex; align-items:center; justify-content:center; gap:5mm; color:var(--beige); font-size:13pt; }
  .rule-orn .seg{ width:34mm; height:1.2pt; background:linear-gradient(90deg,transparent,var(--beige),transparent); }
  .title{ margin-top:5mm; font-size:19pt; letter-spacing:.32em; color:var(--beige); font-weight:800; text-transform:uppercase; }
  .photo{ margin-top:11mm; width:92mm; height:78mm; border-radius:4mm; border:2pt solid var(--beige); background:rgba(247,245,242,.06);
    box-shadow:0 6mm 16mm rgba(24,24,25,.4); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; overflow:hidden; }
  .ph-icon{ font-size:32pt; color:rgba(216,195,165,.65); } .ph-text{ font-size:9pt; letter-spacing:.34em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  .stars{ margin-top:10mm; font-size:14pt; letter-spacing:.5em; color:var(--beige); }
  .name{ margin-top:5mm; font-size:28pt; letter-spacing:.05em; color:var(--white); font-weight:800; text-transform:uppercase; }
  .klass{ margin-top:6mm; display:inline-block; padding:3.2mm 12mm; border:0.9pt solid rgba(216,195,165,.5); border-radius:30mm;
    font-size:12.5pt; letter-spacing:.22em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .seal{ position:absolute; bottom:24mm; right:24mm; width:30mm; height:30mm; opacity:.95; z-index:3; }
  .foot{ margin-top:auto; padding-top:9mm; }
  .foot .url{ font-size:11.5pt; letter-spacing:.2em; color:var(--beige); font-weight:600; font-family:'Archivo',sans-serif; }
  .foot .tag{ margin-top:2.5mm; font-size:8pt; letter-spacing:.36em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  </style></head><body>
  <div class="scene"></div><div class="floor"></div><div class="vignette"></div>
  <div class="frame"></div><div class="frame2"></div>
  <div class="corner tl">${cornerSvg}</div><div class="corner tr">${cornerSvg}</div>
  <div class="corner bl">${cornerSvg}</div><div class="corner br">${cornerSvg}</div>
  <div class="page">
    <div class="head"><img src="${LOGO}" alt="Zenithia Global School"/></div>
    <div class="eyebrow">Celebrating Excellence</div>
    <div class="month display"><span class="ph">MONTH YEAR</span></div>
    <div class="rule-orn"><span class="seg"></span>&#10038;<span class="seg"></span></div>
    <div class="title display">Student of the Month</div>
    <div class="photo">${photoInner}</div>
    <div class="stars">${stars}</div>
    <div class="name display"><span class="ph">[ Student Name ]</span></div>
    <div class="klass"><span class="ph">Class / Division</span></div>
    <div class="seal">${medal}</div>
    <div class="foot">
      <div class="url">${SITE}</div>
      <div class="tag">Knowledge &bull; Character &bull; Excellence</div>
    </div>
  </div></body></html>`;
}

// ============================================================================
// STYLE 4 — Bold Spotlight (giant month banner top, big circular photo on a beige arc)
// ============================================================================
function style4() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>${FONTS}<style>${BASE}
  .topband{ position:absolute; top:0; left:0; right:0; height:78mm;
    background:linear-gradient(135deg, var(--maroon-deep), var(--maroon-glow)); border-bottom:2pt solid var(--beige); z-index:1; }
  .arc{ position:absolute; top:30mm; left:50%; transform:translateX(-50%); width:120mm; height:120mm; border-radius:50%;
    background:radial-gradient(circle at 50% 40%, rgba(216,195,165,.22), rgba(216,195,165,0) 65%); z-index:1; }
  .page{ position:absolute; inset:0; padding:13mm 16mm 12mm; display:flex; flex-direction:column; align-items:center; text-align:center; z-index:2; }
  .head img{ height:23mm; }
  .eyebrow{ margin-top:4mm; font-size:10pt; letter-spacing:.5em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .month{ margin-top:3mm; font-size:56pt; line-height:.95; letter-spacing:.01em; color:var(--white); font-weight:900; text-transform:uppercase;
    text-shadow:0 3mm 10mm rgba(24,24,25,.4); }
  .title{ margin-top:3mm; font-size:18pt; letter-spacing:.3em; color:var(--beige); font-weight:800; text-transform:uppercase; }
  .photo{ margin-top:9mm; width:94mm; height:94mm; border-radius:50%; border:2.6pt solid var(--beige); background:rgba(247,245,242,.06);
    box-shadow:0 0 0 1.6mm rgba(122,31,53,.6), 0 8mm 22mm rgba(24,24,25,.5);
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; overflow:hidden; position:relative; }
  .ph-icon{ font-size:32pt; color:rgba(216,195,165,.65); } .ph-text{ font-size:9pt; letter-spacing:.34em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  .medal-badge{ position:absolute; bottom:-6mm; left:50%; transform:translateX(-50%); width:22mm; height:22mm; }
  .stars{ margin-top:13mm; font-size:15pt; letter-spacing:.5em; color:var(--beige); }
  .name{ margin-top:5mm; font-size:30pt; letter-spacing:.05em; color:var(--white); font-weight:800; text-transform:uppercase; }
  .name-rule{ margin:4mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--beige); font-size:11pt; }
  .name-rule .seg{ width:28mm; height:1.2pt; background:linear-gradient(90deg,transparent,var(--beige),transparent); opacity:.85; }
  .klass{ margin-top:6mm; display:inline-block; padding:3.4mm 12mm; border:0.9pt solid rgba(216,195,165,.5); border-radius:30mm;
    font-size:12.5pt; letter-spacing:.22em; color:var(--beige); font-weight:600; text-transform:uppercase; }
  .foot{ margin-top:auto; padding-top:9mm; }
  .foot .url{ font-size:11.5pt; letter-spacing:.2em; color:var(--beige); font-weight:600; font-family:'Archivo',sans-serif; }
  .foot .tag{ margin-top:2.5mm; font-size:8pt; letter-spacing:.36em; color:rgba(216,195,165,.7); text-transform:uppercase; }
  </style></head><body>
  <div class="scene"></div><div class="topband"></div><div class="arc"></div><div class="floor"></div>
  <div class="page">
    <div class="head"><img src="${LOGO}" alt="Zenithia Global School"/></div>
    <div class="eyebrow">Celebrating Excellence</div>
    <div class="month display"><span class="ph">MONTH YEAR</span></div>
    <div class="title display">Student of the Month</div>
    <div class="photo">${photoInner}<div class="medal-badge">${medal}</div></div>
    <div class="stars">${stars}</div>
    <div class="name display"><span class="ph">[ Student Name ]</span></div>
    <div class="name-rule"><span class="seg"></span>&#10022;<span class="seg"></span></div>
    <div class="klass"><span class="ph">Class / Division</span></div>
    <div class="foot">
      <div class="url">${SITE}</div>
      <div class="tag">Knowledge &bull; Character &bull; Excellence</div>
    </div>
  </div></body></html>`;
}

const STYLES = [style1, style2, style3, style4];

// ---- render ---------------------------------------------------------------
function render(html, name, preview) {
  const htmlPath = join(TMP, `${name}.html`);
  writeFileSync(htmlPath, html);
  const url = "file://" + htmlPath;
  const pdf = join(OUT, `${name}.pdf`);
  const png = join(OUT, `${name}.png`);
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
    "--virtual-time-budget=5000", `--print-to-pdf=${pdf}`, url,
  ], { stdio: "ignore" });
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--virtual-time-budget=5000", "--force-device-scale-factor=2",
    "--window-size=794,1123", `--screenshot=${png}`, url,
  ], { stdio: "ignore" });
  console.log("rendered", name);
}

const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--only="))?.split("=")[1];

for (let i = 0; i < STYLES.length; i++) {
  if (only && String(i + 1) !== only) continue;
  render(STYLES[i](), `zenithia-student-of-month-style${i + 1}`);
}
console.log("done");
