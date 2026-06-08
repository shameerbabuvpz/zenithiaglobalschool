"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

/**
 * "Student of the Month" poster maker (admin only).
 * Pick one of four premium designs, type the month / student name / class and
 * upload a photo (auto-cropped to fit the frame), then download a high-res PNG.
 */

type DesignId = 1 | 2 | 3 | 4;

const DESIGNS: { id: DesignId; name: string; hint: string }[] = [
  { id: 1, name: "Royal Medallion", hint: "Maroon & gold, round medal" },
  { id: 2, name: "Ivory Certificate", hint: "Light, formal certificate" },
  { id: 3, name: "Modern Editorial", hint: "Big photo, bold layout" },
  { id: 4, name: "Midnight Gold", hint: "Black & gold, arched photo" },
];

const POSTER_CSS = `
.zposter, .zposter *{ margin:0; padding:0; box-sizing:border-box; }
.zposter{
  --maroon:#7A1F35; --maroon-deep:#3f0f1d; --maroon-glow:#9c3550;
  --gold:#E7CFA1; --gold-deep:#B9924E; --gold-lite:#FBEFD2;
  --ink:#181819; --white:#F7F5F2; --sand:#D8C3A5; --cream:#F4EEE3;
  width:210mm; height:297mm; position:relative; overflow:hidden;
  font-family:var(--font-inter),'Inter','Helvetica Neue',Arial,sans-serif; color:var(--white);
}
.zposter .foil{ background:linear-gradient(180deg, var(--gold-lite) 0%, var(--gold) 36%, var(--gold-deep) 70%, var(--gold-lite) 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent; -webkit-text-fill-color:transparent; }
.zposter .ghost{ opacity:.4; }
.zposter .cover{ width:100%; height:100%; object-fit:cover; display:block; }

/* ============ Design 1 — Royal Medallion ============ */
.zd1{ background:#2c0c17; }
.zd1 .bg-base{ position:absolute; inset:0;
  background:radial-gradient(120% 80% at 50% 22%, var(--maroon-glow) 0%, var(--maroon) 36%, var(--maroon-deep) 100%); }
.zd1 .bg-pattern{ position:absolute; inset:0; opacity:.10; mix-blend-mode:screen;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23E7CFA1' stroke-width='1'><circle cx='60' cy='60' r='34'/><circle cx='60' cy='60' r='20'/><path d='M60 8 C40 30 40 90 60 112 C80 90 80 30 60 8 Z'/><path d='M8 60 C30 40 90 40 112 60 C90 80 30 80 8 60 Z'/><circle cx='0' cy='0' r='10'/><circle cx='120' cy='0' r='10'/><circle cx='0' cy='120' r='10'/><circle cx='120' cy='120' r='10'/></g></svg>");
  background-size:46mm 46mm; }
.zd1 .bg-spot{ position:absolute; left:50%; top:46%; transform:translate(-50%,-50%);
  width:150mm; height:150mm; border-radius:50%;
  background:radial-gradient(circle, rgba(251,239,210,.16) 0%, rgba(251,239,210,0) 62%); }
.zd1 .vignette{ position:absolute; inset:0; pointer-events:none;
  background:radial-gradient(125% 85% at 50% 40%, rgba(24,8,14,0) 48%, rgba(24,8,14,.7) 100%); }
.zd1 .frame-outer{ position:absolute; inset:7mm; border:2.6pt solid var(--gold-deep); border-radius:2mm;
  box-shadow:0 0 0 0.6pt rgba(231,207,161,.35), inset 0 0 26mm rgba(24,8,14,.45); }
.zd1 .frame-inner{ position:absolute; inset:10mm; border:1pt solid rgba(231,207,161,.55); border-radius:1.5mm; }
.zd1 .frame-hair{ position:absolute; inset:11.4mm; border:0.5pt solid rgba(231,207,161,.3); border-radius:1mm; }
.zd1 .deco{ position:absolute; width:40mm; height:40mm; } .zd1 .deco svg{ width:100%; height:100%; }
.zd1 .deco.tl{ top:9mm; left:9mm; } .zd1 .deco.tr{ top:9mm; right:9mm; transform:scaleX(-1); }
.zd1 .deco.bl{ bottom:9mm; left:9mm; transform:scaleY(-1); } .zd1 .deco.br{ bottom:9mm; right:9mm; transform:scale(-1,-1); }
.zd1 .page{ position:absolute; inset:7mm; padding:13mm 18mm 11mm; display:flex; flex-direction:column;
  align-items:center; text-align:center; z-index:3; }
.zd1 .head img{ height:23mm; filter:drop-shadow(0 2mm 4mm rgba(24,8,14,.5)); }
.zd1 .rosette{ margin-top:4mm; width:21mm; height:21mm; }
.zd1 .eyebrow{ margin-top:3mm; font-family:var(--font-cinzel),'Cinzel',serif; font-size:10.5pt; letter-spacing:.42em; font-weight:600;
  color:var(--gold-lite); text-transform:uppercase; }
.zd1 .month{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:800; font-size:40pt; line-height:1;
  letter-spacing:.03em; text-transform:uppercase; display:flex; align-items:center; gap:9mm; justify-content:center; }
.zd1 .month .orn{ width:14mm; height:1.6pt; background:linear-gradient(90deg,transparent,var(--gold)); }
.zd1 .month .orn.r{ background:linear-gradient(90deg,var(--gold),transparent); }
.zd1 .title{ margin-top:5mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:600; font-size:16pt; letter-spacing:.42em;
  color:var(--gold-lite); text-transform:uppercase; }
.zd1 .title-rule{ margin:5mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--gold); font-size:11pt; }
.zd1 .title-rule .seg{ width:30mm; height:1pt; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.zd1 .medal{ margin-top:7mm; position:relative; width:100mm; height:100mm; display:flex; align-items:center; justify-content:center; }
.zd1 .burst{ position:absolute; inset:0; } .zd1 .burst svg{ width:100%; height:100%; }
.zd1 .ring{ position:relative; width:78mm; height:78mm; border-radius:50%; z-index:2;
  padding:2.4mm; background:linear-gradient(145deg, var(--gold-lite), var(--gold-deep) 60%, var(--gold-lite));
  box-shadow:0 10mm 26mm rgba(24,8,14,.55), 0 0 0 0.6mm rgba(231,207,161,.5); }
.zd1 .photo{ width:100%; height:100%; border-radius:50%; overflow:hidden; position:relative;
  background:radial-gradient(circle at 50% 38%, #6d1a2e, #470f1f);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm;
  border:1pt solid rgba(24,8,14,.4); }
.zd1 .photo .ph-icon{ font-size:30pt; color:rgba(231,207,161,.55); }
.zd1 .photo .ph-text{ font-size:8.5pt; letter-spacing:.34em; color:rgba(231,207,161,.65); text-transform:uppercase; }
.zd1 .ribbon{ position:absolute; bottom:-3mm; left:50%; transform:translateX(-50%); z-index:3;
  font-family:var(--font-cinzel),'Cinzel',serif; font-size:9pt; letter-spacing:.3em; color:var(--maroon-deep); font-weight:700;
  background:linear-gradient(180deg,var(--gold-lite),var(--gold)); padding:2.4mm 9mm; border-radius:2mm;
  box-shadow:0 3mm 8mm rgba(24,8,14,.5); text-transform:uppercase; }
.zd1 .stars{ margin-top:11mm; font-size:13pt; letter-spacing:.45em; }
.zd1 .name{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:700; font-size:25pt; letter-spacing:.06em;
  color:var(--white); text-transform:uppercase; text-shadow:0 2mm 6mm rgba(24,8,14,.4); word-break:break-word; }
.zd1 .name-orn{ margin:3.5mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--gold); font-size:11pt; }
.zd1 .name-orn .seg{ width:24mm; height:1pt; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.zd1 .klass{ margin-top:5mm; display:inline-block; padding:3.2mm 12mm; border-radius:30mm;
  border:1pt solid var(--gold-deep); background:rgba(231,207,161,.06);
  font-family:var(--font-cinzel),'Cinzel',serif; font-size:11.5pt; letter-spacing:.2em; font-weight:600; color:var(--gold-lite); text-transform:uppercase; }
.zd1 .foot{ margin-top:auto; padding-top:7mm; }
.zd1 .foot .line{ display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--gold); font-size:9pt; margin-bottom:3.5mm; }
.zd1 .foot .line .seg{ width:22mm; height:1pt; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.zd1 .foot .url{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:11pt; letter-spacing:.18em; font-weight:600; }
.zd1 .foot .tag{ margin-top:2.5mm; font-size:8pt; letter-spacing:.34em; color:rgba(231,207,161,.65); text-transform:uppercase; }

/* ============ Design 2 — Ivory Certificate ============ */
.zd2{ background:#F4EEE3; color:var(--ink); }
.zd2 .bg{ position:absolute; inset:0; background:linear-gradient(180deg,#fbf8f2 0%, #f1e9da 100%); }
.zd2 .bg-tex{ position:absolute; inset:0; opacity:.18;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g fill='none' stroke='%237A1F35' stroke-width='1'><circle cx='45' cy='45' r='26'/><path d='M45 6 C30 24 30 66 45 84 C60 66 60 24 45 6 Z'/></g></svg>");
  background-size:34mm 34mm; }
.zd2 .frame1{ position:absolute; inset:8mm; border:3pt solid var(--maroon); border-radius:2mm; }
.zd2 .frame2{ position:absolute; inset:11mm; border:1pt solid var(--gold-deep); border-radius:1.5mm; }
.zd2 .deco{ position:absolute; width:30mm; height:30mm; z-index:2; } .zd2 .deco svg{ width:100%; height:100%; }
.zd2 .deco.tl{ top:10mm; left:10mm; } .zd2 .deco.tr{ top:10mm; right:10mm; transform:scaleX(-1); }
.zd2 .deco.bl{ bottom:10mm; left:10mm; transform:scaleY(-1); } .zd2 .deco.br{ bottom:10mm; right:10mm; transform:scale(-1,-1); }
.zd2 .page{ position:absolute; inset:8mm; padding:18mm 20mm 14mm; display:flex; flex-direction:column;
  align-items:center; text-align:center; z-index:3; }
.zd2 .head img{ height:20mm; }
.zd2 .eyebrow{ margin-top:5mm; font-family:var(--font-cinzel),'Cinzel',serif; font-size:9.5pt; letter-spacing:.4em; font-weight:600;
  color:var(--gold-deep); text-transform:uppercase; }
.zd2 .title{ margin-top:3mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:800; font-size:30pt; letter-spacing:.06em;
  color:var(--maroon); text-transform:uppercase; line-height:1.05; }
.zd2 .rule{ margin:4mm auto 0; display:flex; align-items:center; justify-content:center; gap:4mm; color:var(--gold-deep); font-size:11pt; }
.zd2 .rule .seg{ width:34mm; height:1pt; background:linear-gradient(90deg,transparent,var(--gold-deep),transparent); }
.zd2 .month{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:700; font-size:17pt; letter-spacing:.22em;
  color:var(--gold-deep); text-transform:uppercase; }
.zd2 .pframe{ margin-top:8mm; padding:2.4mm; border-radius:3mm;
  background:linear-gradient(145deg, var(--gold-lite), var(--gold-deep) 60%, var(--gold-lite));
  box-shadow:0 6mm 18mm rgba(122,31,53,.22); }
.zd2 .photo{ width:74mm; height:84mm; border-radius:2mm; overflow:hidden; position:relative;
  background:linear-gradient(160deg,#efe6d6,#e3d4bd); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; }
.zd2 .photo .ph-icon{ font-size:28pt; color:rgba(122,31,53,.4); }
.zd2 .photo .ph-text{ font-size:8pt; letter-spacing:.32em; color:rgba(122,31,53,.5); text-transform:uppercase; }
.zd2 .awarded{ margin-top:8mm; font-size:9pt; letter-spacing:.4em; color:var(--ink); opacity:.55; text-transform:uppercase; }
.zd2 .name{ margin-top:3mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:700; font-size:24pt; letter-spacing:.04em;
  color:var(--maroon); text-transform:uppercase; word-break:break-word; }
.zd2 .klass{ margin-top:5mm; display:inline-block; padding:3mm 12mm; border-radius:30mm; border:1pt solid var(--gold-deep);
  background:rgba(122,31,53,.04); font-family:var(--font-cinzel),'Cinzel',serif; font-size:11pt; letter-spacing:.2em; font-weight:600;
  color:var(--maroon); text-transform:uppercase; }
.zd2 .foot{ margin-top:auto; padding-top:8mm; }
.zd2 .foot .url{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:10.5pt; letter-spacing:.18em; font-weight:600; color:var(--maroon); }
.zd2 .foot .tag{ margin-top:2.5mm; font-size:7.5pt; letter-spacing:.32em; color:var(--ink); opacity:.5; text-transform:uppercase; }

/* ============ Design 3 — Modern Editorial ============ */
.zd3{ background:var(--maroon-deep); }
.zd3 .photo-band{ position:absolute; top:0; left:0; right:0; height:62%; overflow:hidden; background:linear-gradient(160deg,#6d1a2e,#470f1f); }
.zd3 .photo-band .ph-mid{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; }
.zd3 .photo-band .ph-icon{ font-size:34pt; color:rgba(231,207,161,.45); }
.zd3 .photo-band .ph-text{ font-size:9pt; letter-spacing:.34em; color:rgba(231,207,161,.6); text-transform:uppercase; }
.zd3 .overlay{ position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(63,15,29,.25) 0%, rgba(63,15,29,0) 32%, rgba(63,15,29,.55) 78%, var(--maroon-deep) 100%); }
.zd3 .head{ position:absolute; top:14mm; left:16mm; right:16mm; display:flex; align-items:center; justify-content:space-between; z-index:4; }
.zd3 .head img{ height:17mm; filter:drop-shadow(0 1mm 4mm rgba(0,0,0,.5)); }
.zd3 .head .badge{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:8.5pt; letter-spacing:.34em; font-weight:600;
  color:var(--gold-lite); text-transform:uppercase; padding:2mm 6mm; border:1pt solid rgba(231,207,161,.55); border-radius:30mm; }
.zd3 .bigmonth{ position:absolute; top:46%; left:16mm; right:16mm; z-index:5; text-align:left;
  font-family:var(--font-cinzel),'Cinzel',serif; font-weight:800; font-size:46pt; line-height:.92; letter-spacing:.01em; text-transform:uppercase; }
.zd3 .lower{ position:absolute; left:0; right:0; bottom:0; height:42%; padding:0 16mm 16mm; z-index:5;
  display:flex; flex-direction:column; align-items:flex-start; text-align:left; }
.zd3 .lower .hair{ width:38mm; height:2pt; background:linear-gradient(90deg,var(--gold),transparent); margin-bottom:7mm; }
.zd3 .label{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:11pt; letter-spacing:.4em; font-weight:600; color:var(--gold-lite); text-transform:uppercase; }
.zd3 .name{ margin-top:5mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:700; font-size:30pt; letter-spacing:.02em;
  color:var(--white); text-transform:uppercase; word-break:break-word; line-height:1.05; }
.zd3 .klass{ margin-top:5mm; font-family:var(--font-cinzel),'Cinzel',serif; font-size:12pt; letter-spacing:.22em; font-weight:600;
  color:var(--gold-lite); text-transform:uppercase; padding-bottom:2mm; border-bottom:1pt solid rgba(231,207,161,.5); }
.zd3 .foot{ margin-top:auto; display:flex; align-items:center; gap:5mm; width:100%; }
.zd3 .foot .seg{ flex:1; height:1pt; background:linear-gradient(90deg,var(--gold),transparent); }
.zd3 .foot .url{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:10.5pt; letter-spacing:.18em; font-weight:600; color:var(--gold-lite); }

/* ============ Design 4 — Midnight Gold ============ */
.zd4{ background:#111012; }
.zd4 .bg{ position:absolute; inset:0;
  background:radial-gradient(115% 75% at 50% 30%, #2a2630 0%, #1a181c 45%, #0c0b0d 100%); }
.zd4 .glow{ position:absolute; left:50%; top:40%; transform:translate(-50%,-50%); width:150mm; height:150mm; border-radius:50%;
  background:radial-gradient(circle, rgba(231,207,161,.16) 0%, rgba(231,207,161,0) 62%); }
.zd4 .border{ position:absolute; inset:9mm; border:1pt solid rgba(231,207,161,.55); border-radius:1.5mm;
  box-shadow:inset 0 0 30mm rgba(0,0,0,.5); }
.zd4 .border2{ position:absolute; inset:11mm; border:0.5pt solid rgba(231,207,161,.3); border-radius:1mm; }
.zd4 .page{ position:absolute; inset:9mm; padding:16mm 18mm 13mm; display:flex; flex-direction:column;
  align-items:center; text-align:center; z-index:3; }
.zd4 .head img{ height:20mm; }
.zd4 .eyebrow{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-size:10pt; letter-spacing:.42em; font-weight:600;
  color:var(--gold-lite); text-transform:uppercase; }
.zd4 .title{ margin-top:3mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:600; font-size:15pt; letter-spacing:.4em;
  color:var(--gold-lite); text-transform:uppercase; }
.zd4 .month{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:800; font-size:34pt; letter-spacing:.04em; text-transform:uppercase; }
.zd4 .arch{ margin-top:8mm; padding:2.2mm; border-radius:38mm 38mm 4mm 4mm;
  background:linear-gradient(145deg, var(--gold-lite), var(--gold-deep) 60%, var(--gold-lite));
  box-shadow:0 8mm 22mm rgba(0,0,0,.55); }
.zd4 .photo{ width:72mm; height:90mm; border-radius:36mm 36mm 3mm 3mm; overflow:hidden; position:relative;
  background:linear-gradient(160deg,#2a2630,#161418); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3mm; }
.zd4 .photo .ph-icon{ font-size:28pt; color:rgba(231,207,161,.45); }
.zd4 .photo .ph-text{ font-size:8pt; letter-spacing:.32em; color:rgba(231,207,161,.6); text-transform:uppercase; }
.zd4 .stars{ margin-top:8mm; font-size:12pt; letter-spacing:.45em; }
.zd4 .name{ margin-top:4mm; font-family:var(--font-cinzel),'Cinzel',serif; font-weight:700; font-size:25pt; letter-spacing:.05em;
  text-transform:uppercase; word-break:break-word; }
.zd4 .klass{ margin-top:5mm; display:inline-block; padding:3mm 12mm; border-radius:30mm; border:1pt solid var(--gold-deep);
  background:rgba(231,207,161,.05); font-family:var(--font-cinzel),'Cinzel',serif; font-size:11pt; letter-spacing:.2em; font-weight:600;
  color:var(--gold-lite); text-transform:uppercase; }
.zd4 .foot{ margin-top:auto; padding-top:8mm; }
.zd4 .foot .url{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:10.5pt; letter-spacing:.18em; font-weight:600; color:var(--gold-lite); }
.zd4 .foot .tag{ margin-top:2.5mm; font-size:7.5pt; letter-spacing:.32em; color:rgba(231,207,161,.6); text-transform:uppercase; }
`;

const cornerSvg = (
  <svg viewBox="0 0 120 120" fill="none" stroke="#E7CFA1" strokeWidth="1.5" strokeLinecap="round">
    <path d="M6 54 Q6 6 54 6" />
    <path d="M14 60 Q14 14 60 14" opacity=".55" />
    <path d="M6 54 q22 -2 30 -28" opacity=".8" />
    <path d="M54 6 q-2 22 -28 30" opacity=".8" />
    <circle cx="6" cy="54" r="2.4" fill="#E7CFA1" stroke="none" />
    <circle cx="54" cy="6" r="2.4" fill="#E7CFA1" stroke="none" />
    <path d="M30 30 l9 0 M30 30 l0 9" />
    <circle cx="30" cy="30" r="3" />
  </svg>
);

const cornerGoldDeep = (
  <svg viewBox="0 0 120 120" fill="none" stroke="#B9924E" strokeWidth="1.6" strokeLinecap="round">
    <path d="M6 54 Q6 6 54 6" />
    <path d="M14 60 Q14 14 60 14" opacity=".6" />
    <path d="M6 54 q22 -2 30 -28" opacity=".85" />
    <path d="M54 6 q-2 22 -28 30" opacity=".85" />
    <circle cx="6" cy="54" r="2.4" fill="#B9924E" stroke="none" />
    <circle cx="54" cy="6" r="2.4" fill="#B9924E" stroke="none" />
    <path d="M30 30 l9 0 M30 30 l0 9" />
    <circle cx="30" cy="30" r="3" />
  </svg>
);

const RAY_ANGLES = Array.from({ length: 24 }, (_, i) => i * 15);

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
}

type PosterProps = { month: string; name: string; klass: string; photo: string | null };

function PhotoOrPlaceholder({ photo }: { photo: string | null }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cover" src={photo} alt="Student" />;
  }
  return (
    <>
      <div className="ph-icon">&#128247;</div>
      <div className="ph-text">Add Photo</div>
    </>
  );
}

/* ---------------- Design 1 — Royal Medallion ---------------- */
function Design1({ month, name, klass, photo }: PosterProps) {
  return (
    <>
      <div className="bg-base" />
      <div className="bg-pattern" />
      <div className="bg-spot" />
      <div className="vignette" />
      <div className="frame-outer" />
      <div className="frame-inner" />
      <div className="frame-hair" />
      <div className="deco tl">{cornerSvg}</div>
      <div className="deco tr">{cornerSvg}</div>
      <div className="deco bl">{cornerSvg}</div>
      <div className="deco br">{cornerSvg}</div>
      <div className="page">
        <div className="head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full-white.png" alt="Zenithia Global School" />
        </div>
        <div className="rosette">
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FBEFD2" />
                <stop offset=".6" stopColor="#E7CFA1" />
                <stop offset="1" stopColor="#B9924E" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#rg)" strokeWidth="2.4">
              <circle cx="50" cy="42" r="24" />
              <circle cx="50" cy="42" r="18" strokeWidth="1" opacity=".6" />
            </g>
            <path d="M50 28 l4.6 9.4 10.3 1.5 -7.5 7.3 1.8 10.3 -9.2-4.9 -9.2 4.9 1.8-10.3 -7.5-7.3 10.3-1.5z" fill="url(#rg)" />
            <path d="M38 64 l-7 24 12-6.5 8 9.5 4-22z" fill="#7A1F35" stroke="url(#rg)" strokeWidth="1.8" />
            <path d="M62 64 l7 24 -12-6.5 -8 9.5 -4-22z" fill="#7A1F35" stroke="url(#rg)" strokeWidth="1.8" />
          </svg>
        </div>
        <div className="eyebrow">Celebrating Excellence</div>
        <div className="month">
          <span className="orn" />
          <span className={`foil${month ? "" : " ghost"}`}>{month || "Month Year"}</span>
          <span className="orn r" />
        </div>
        <div className="title">Student of the Month</div>
        <div className="title-rule">
          <span className="seg" />
          <span className="foil">&#10038;</span>
          <span className="seg" />
        </div>
        <div className="medal">
          <div className="burst">
            <svg viewBox="0 0 200 200">
              <g fill="none" stroke="#E7CFA1" strokeWidth="1" opacity=".45">
                <circle cx="100" cy="100" r="96" />
              </g>
              <g fill="#E7CFA1" opacity=".55" transform="translate(100 100)">
                {RAY_ANGLES.map((a) => (
                  <polygon key={a} points="-3,-98 3,-98 0,-72" transform={`rotate(${a})`} />
                ))}
              </g>
            </svg>
          </div>
          <div className="ring">
            <div className="photo">
              <PhotoOrPlaceholder photo={photo} />
            </div>
          </div>
          <div className="ribbon">Awarded</div>
        </div>
        <div className="stars">
          <span className="foil">&#9733; &#9733; &#9733; &#9733; &#9733;</span>
        </div>
        <div className={`name${name ? "" : " ghost"}`}>{name || "[ Student Name ]"}</div>
        <div className="name-orn">
          <span className="seg" />
          <span className="foil">&#10022;</span>
          <span className="seg" />
        </div>
        <div className={`klass${klass ? "" : " ghost"}`}>{klass || "Class / Division"}</div>
        <div className="foot">
          <div className="line">
            <span className="seg" />
            <span className="foil">&#10038;</span>
            <span className="seg" />
          </div>
          <div className="url foil">zenithiaglobalschool.com</div>
          <div className="tag">Knowledge &bull; Character &bull; Excellence</div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Design 2 — Ivory Certificate ---------------- */
function Design2({ month, name, klass, photo }: PosterProps) {
  return (
    <>
      <div className="bg" />
      <div className="bg-tex" />
      <div className="frame1" />
      <div className="frame2" />
      <div className="deco tl">{cornerGoldDeep}</div>
      <div className="deco tr">{cornerGoldDeep}</div>
      <div className="deco bl">{cornerGoldDeep}</div>
      <div className="deco br">{cornerGoldDeep}</div>
      <div className="page">
        <div className="head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full.png" alt="Zenithia Global School" />
        </div>
        <div className="eyebrow">Certificate of Recognition</div>
        <div className="title">Student of the Month</div>
        <div className="rule">
          <span className="seg" />
          <span>&#10070;</span>
          <span className="seg" />
        </div>
        <div className={`month${month ? "" : " ghost"}`}>{month || "Month Year"}</div>
        <div className="pframe">
          <div className="photo">
            <PhotoOrPlaceholder photo={photo} />
          </div>
        </div>
        <div className="awarded">Awarded To</div>
        <div className={`name${name ? "" : " ghost"}`}>{name || "[ Student Name ]"}</div>
        <div className={`klass${klass ? "" : " ghost"}`}>{klass || "Class / Division"}</div>
        <div className="foot">
          <div className="url">zenithiaglobalschool.com</div>
          <div className="tag">Knowledge &bull; Character &bull; Excellence</div>
        </div>
      </div>
    </>
  );
}

/* ---------------- Design 3 — Modern Editorial ---------------- */
function Design3({ month, name, klass, photo }: PosterProps) {
  return (
    <>
      <div className="photo-band">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cover" src={photo} alt="Student" />
        ) : (
          <div className="ph-mid">
            <div className="ph-icon">&#128247;</div>
            <div className="ph-text">Add Photo</div>
          </div>
        )}
        <div className="overlay" />
      </div>
      <div className="head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-full-white.png" alt="Zenithia Global School" />
        <span className="badge">Celebrating Excellence</span>
      </div>
      <div className={`bigmonth foil${month ? "" : " ghost"}`}>{month || "Month Year"}</div>
      <div className="lower">
        <div className="hair" />
        <div className="label">Student of the Month</div>
        <div className={`name${name ? "" : " ghost"}`}>{name || "[ Student Name ]"}</div>
        <div className={`klass${klass ? "" : " ghost"}`}>{klass || "Class / Division"}</div>
        <div className="foot">
          <div className="url">zenithiaglobalschool.com</div>
          <span className="seg" />
        </div>
      </div>
    </>
  );
}

/* ---------------- Design 4 — Midnight Gold ---------------- */
function Design4({ month, name, klass, photo }: PosterProps) {
  return (
    <>
      <div className="bg" />
      <div className="glow" />
      <div className="border" />
      <div className="border2" />
      <div className="page">
        <div className="head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-full-white.png" alt="Zenithia Global School" />
        </div>
        <div className="eyebrow">Celebrating Excellence</div>
        <div className="title">Student of the Month</div>
        <div className={`month foil${month ? "" : " ghost"}`}>{month || "Month Year"}</div>
        <div className="arch">
          <div className="photo">
            <PhotoOrPlaceholder photo={photo} />
          </div>
        </div>
        <div className="stars">
          <span className="foil">&#9733; &#9733; &#9733; &#9733; &#9733;</span>
        </div>
        <div className={`name foil${name ? "" : " ghost"}`}>{name || "[ Student Name ]"}</div>
        <div className={`klass${klass ? "" : " ghost"}`}>{klass || "Class / Division"}</div>
        <div className="foot">
          <div className="url">zenithiaglobalschool.com</div>
          <div className="tag">Knowledge &bull; Character &bull; Excellence</div>
        </div>
      </div>
    </>
  );
}

const DESIGN_BG: Record<DesignId, string> = {
  1: "#2c0c17",
  2: "#F4EEE3",
  3: "#3f0f1d",
  4: "#111012",
};

export default function PosterGenerator() {
  const [design, setDesign] = useState<DesignId>(1);
  const [month, setMonth] = useState("");
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  // Fit the fixed A4 poster (≈794px wide) to the available container width.
  useEffect(() => {
    const el = scalerRef.current;
    if (!el) return;
    const POSTER_W = 794; // 210mm @ 96dpi
    const POSTER_H = 1123; // 297mm @ 96dpi
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const s = Math.min(w / POSTER_W, 1);
      setScale(s);
      el.style.height = `${POSTER_H * s}px`;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }, []);

  const onDownload = useCallback(async () => {
    const node = posterRef.current;
    if (!node) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: DESIGN_BG[design],
      });
      const a = document.createElement("a");
      a.download = `zenithia-student-of-month-d${design}-${slugify(name)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the poster could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [name, design]);

  const props: PosterProps = { month, name, klass, photo };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: POSTER_CSS }} />

      {/* Controls */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-brand">Poster details</h2>
        <p className="mt-1 text-sm text-ink/55">Choose a design, fill in the details and upload a photo.</p>

        {/* Design switcher */}
        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium text-ink/70">Design</span>
          <div className="grid grid-cols-2 gap-2">
            {DESIGNS.map((d) => {
              const active = d.id === design;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDesign(d.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-black/15 hover:border-brand/40 hover:bg-black/[0.02]"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? "text-brand" : "text-ink"}`}>
                    {d.id}. {d.name}
                  </span>
                  <span className="block text-xs text-ink/50">{d.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Month &amp; Year</span>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="e.g. June 2026"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Student Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Menon"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Class / Division</span>
            <input
              type="text"
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              placeholder="e.g. Grade 3 — B"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Student Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onPhoto}
              className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
            />
            <p className="mt-1 text-xs text-ink/45">
              The photo is auto-cropped to fit the frame. Use a clear, front-facing portrait.
            </p>
          </label>

          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Generating…" : `Download Design ${design} (PNG)`}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-ink/5 p-4">
        <div ref={scalerRef} className="relative mx-auto w-full" style={{ maxWidth: 794 }}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            {/* Captured node */}
            <div ref={posterRef} className={`zposter zd${design}`}>
              {design === 1 && <Design1 {...props} />}
              {design === 2 && <Design2 {...props} />}
              {design === 3 && <Design3 {...props} />}
              {design === 4 && <Design4 {...props} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
