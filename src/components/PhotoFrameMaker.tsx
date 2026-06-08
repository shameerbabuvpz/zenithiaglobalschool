"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

/**
 * Program "Photo Frame" maker (admin only).
 * Frame a landscape program photo with the school logo and the program name.
 * Pick one of several frame styles, upload a (landscape) photo — it is
 * auto-fitted (object-fit:cover) into the frame — then download a high-res PNG.
 */

type FrameId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const FRAMES: { id: FrameId; name: string; hint: string }[] = [
  { id: 1, name: "Classic Border", hint: "Maroon frame + logo bar" },
  { id: 2, name: "Gold Corners", hint: "Full photo, gold corners" },
  { id: 3, name: "Bottom Banner", hint: "Photo with gradient banner" },
  { id: 4, name: "Top Ribbon", hint: "Maroon header bar" },
  { id: 5, name: "Side Panel", hint: "Left brand panel" },
  { id: 6, name: "Cinematic", hint: "Black letterbox bars" },
  { id: 7, name: "Ivory Card", hint: "Light double frame" },
  { id: 8, name: "Festive Gold", hint: "Ornate gold + ribbon" },
];

const FRAME_CSS = `
.zframe, .zframe *{ margin:0; padding:0; box-sizing:border-box; }
.zframe{
  --maroon:#7A1F35; --maroon-deep:#3f0f1d; --maroon-glow:#9c3550;
  --gold:#E7CFA1; --gold-deep:#B9924E; --gold-lite:#FBEFD2;
  --ink:#181819; --white:#F7F5F2; --cream:#F4EEE3;
  width:1200px; height:800px; position:relative; overflow:hidden;
  font-family:var(--font-inter),'Inter','Helvetica Neue',Arial,sans-serif; color:var(--white);
}
.zframe .cover{ width:100%; height:100%; object-fit:cover; display:block; }
.zframe .ph{ width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
  background:linear-gradient(150deg,#6d1a2e,#470f1f); }
.zframe .ph .ic{ font-size:64px; color:rgba(231,207,161,.5); }
.zframe .ph .tx{ font-size:15px; letter-spacing:.3em; color:rgba(231,207,161,.65); text-transform:uppercase; }
.zframe .ghost{ opacity:.45; }
.zframe .cz{ font-family:var(--font-cinzel),'Cinzel',serif; }
/* Long program names must wrap to (max) two lines and never overflow,
   in both landscape and portrait, across every frame. */
.zframe .pname{
  overflow-wrap:anywhere; word-break:break-word; hyphens:auto;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;
}

/* ===== Frame 1 — Classic Border ===== */
.zf1{ background:var(--maroon); }
.zf1 .edge{ position:absolute; inset:22px; border:2px solid var(--gold-deep); }
.zf1 .edge2{ position:absolute; inset:27px; border:1px solid rgba(231,207,161,.4); }
.zf1 .photo{ position:absolute; left:36px; right:36px; top:36px; height:548px; overflow:hidden; background:#3f0f1d;
  box-shadow:0 6px 22px rgba(24,8,14,.45); }
.zf1 .bar{ position:absolute; left:36px; right:36px; bottom:36px; height:152px; display:flex; align-items:center;
  justify-content:space-between; padding:0 30px; }
.zf1 .bar img{ height:84px; }
.zf1 .bar .txt{ text-align:right; max-width:62%; }
.zf1 .bar .pname{ font-weight:700; font-size:32px; line-height:1.1; color:var(--gold-lite); text-transform:uppercase; letter-spacing:.03em; }
.zf1 .bar .psub{ margin-top:8px; font-size:14px; letter-spacing:.22em; color:rgba(231,207,161,.85); text-transform:uppercase; }

/* ===== Frame 2 — Gold Corners (full bleed) ===== */
.zf2{ background:#3f0f1d; }
.zf2 .photo{ position:absolute; inset:0; }
.zf2 .grad{ position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(24,8,14,.5) 0%, rgba(24,8,14,0) 26%, rgba(24,8,14,0) 50%, rgba(24,8,14,.8) 100%); }
.zf2 .corner{ position:absolute; width:120px; height:120px; }
.zf2 .corner svg{ width:100%; height:100%; }
.zf2 .corner.tl{ top:30px; left:30px; } .zf2 .corner.tr{ top:30px; right:30px; transform:scaleX(-1); }
.zf2 .corner.bl{ bottom:30px; left:30px; transform:scaleY(-1); } .zf2 .corner.br{ bottom:30px; right:30px; transform:scale(-1,-1); }
.zf2 .logo{ position:absolute; top:40px; left:46px; }
.zf2 .logo img{ height:62px; filter:drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
.zf2 .foot{ position:absolute; left:60px; right:60px; bottom:54px; text-align:center; }
.zf2 .pname{ font-weight:700; font-size:40px; line-height:1.08; color:#fff; text-transform:uppercase; letter-spacing:.03em;
  text-shadow:0 2px 12px rgba(0,0,0,.55); }
.zf2 .uline{ width:130px; height:2px; margin:16px auto 0; background:linear-gradient(90deg,transparent,var(--gold),transparent); }
.zf2 .psub{ margin-top:14px; font-size:15px; letter-spacing:.28em; color:var(--gold-lite); text-transform:uppercase; }

/* ===== Frame 3 — Bottom Banner ===== */
.zf3{ background:var(--maroon-deep); }
.zf3 .photo{ position:absolute; inset:0; }
.zf3 .band{ position:absolute; left:0; right:0; bottom:0; height:250px;
  background:linear-gradient(180deg, rgba(63,15,29,0) 0%, rgba(63,15,29,.8) 52%, var(--maroon-deep) 100%); }
.zf3 .row{ position:absolute; left:54px; right:54px; bottom:46px; display:flex; align-items:flex-end; justify-content:space-between; gap:28px; }
.zf3 .row img{ height:72px; }
.zf3 .txt{ text-align:right; max-width:70%; }
.zf3 .kick{ font-size:13px; letter-spacing:.34em; color:var(--gold); text-transform:uppercase; margin-bottom:10px; }
.zf3 .pname{ font-weight:700; font-size:36px; line-height:1.08; color:var(--gold-lite); text-transform:uppercase; letter-spacing:.03em; }
.zf3 .psub{ margin-top:8px; font-size:14px; letter-spacing:.22em; color:rgba(231,207,161,.85); text-transform:uppercase; }

/* ===== Frame 4 — Top Ribbon ===== */
.zf4{ background:var(--maroon); }
.zf4 .top{ position:absolute; top:0; left:0; right:0; height:158px; background:var(--maroon);
  display:flex; align-items:center; padding:0 50px; gap:28px; z-index:2; }
.zf4 .top img{ height:80px; }
.zf4 .top .txt{ border-left:1px solid rgba(231,207,161,.45); padding-left:28px; }
.zf4 .top .pname{ font-weight:700; font-size:30px; line-height:1.1; color:var(--gold-lite); text-transform:uppercase; letter-spacing:.03em; }
.zf4 .top .psub{ margin-top:6px; font-size:13px; letter-spacing:.24em; color:rgba(231,207,161,.8); text-transform:uppercase; }
.zf4 .rule{ position:absolute; top:158px; left:0; right:0; height:4px; z-index:2;
  background:linear-gradient(90deg,var(--gold-deep),var(--gold-lite),var(--gold-deep)); }
.zf4 .photo{ position:absolute; top:162px; left:0; right:0; bottom:0; }

/* ===== Frame 5 — Side Panel ===== */
.zf5{ background:var(--maroon); }
.zf5 .panel{ position:absolute; left:0; top:0; bottom:0; width:392px; padding:56px 40px; display:flex; flex-direction:column; overflow:hidden; z-index:2; }
.zf5 .panel img{ height:78px; }
.zf5 .panel .mid{ margin-top:auto; margin-bottom:auto; }
.zf5 .panel .kick{ font-size:13px; letter-spacing:.34em; color:var(--gold); text-transform:uppercase; margin-bottom:16px; }
.zf5 .panel .pname{ font-weight:700; font-size:32px; line-height:1.14; color:var(--gold-lite); text-transform:uppercase; letter-spacing:.02em; word-break:break-word; }
.zf5 .panel .psub{ margin-top:14px; font-size:14px; letter-spacing:.2em; color:rgba(231,207,161,.85); text-transform:uppercase; }
.zf5 .panel .tag{ font-size:12px; letter-spacing:.26em; color:rgba(231,207,161,.6); text-transform:uppercase; }
.zf5 .rule{ position:absolute; left:392px; top:0; bottom:0; width:3px; z-index:2;
  background:linear-gradient(180deg,var(--gold-deep),var(--gold-lite),var(--gold-deep)); }
.zf5 .photo{ position:absolute; left:395px; right:0; top:0; bottom:0; }

/* ===== Frame 6 — Cinematic ===== */
.zf6{ background:#000; }
.zf6 .photo{ position:absolute; left:0; right:0; top:118px; bottom:118px; }
.zf6 .top{ position:absolute; top:0; left:0; right:0; height:118px; display:flex; align-items:center; justify-content:center; gap:20px; }
.zf6 .top img{ height:60px; }
.zf6 .top .nm{ font-size:14px; letter-spacing:.4em; color:var(--gold-lite); text-transform:uppercase; }
.zf6 .bot{ position:absolute; bottom:0; left:0; right:0; height:118px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:0 60px; }
.zf6 .bot .pname{ font-weight:700; font-size:32px; line-height:1.05; color:var(--gold-lite); text-transform:uppercase; letter-spacing:.06em; text-align:center; }
.zf6 .bot .psub{ font-size:13px; letter-spacing:.3em; color:rgba(231,207,161,.7); text-transform:uppercase; }

/* ===== Frame 7 — Ivory Card ===== */
.zf7{ background:var(--cream); color:var(--ink); }
.zf7 .f1{ position:absolute; inset:24px; border:3px solid var(--maroon); }
.zf7 .f2{ position:absolute; inset:32px; border:1px solid var(--gold-deep); }
.zf7 .photo{ position:absolute; left:48px; right:48px; top:48px; height:512px; overflow:hidden; background:#e3d4bd;
  box-shadow:0 8px 22px rgba(122,31,53,.18); }
.zf7 .cap{ position:absolute; left:48px; right:48px; bottom:52px; display:flex; align-items:center; justify-content:center; gap:26px; }
.zf7 .cap img{ height:62px; }
.zf7 .cap .bar{ width:1px; height:64px; background:var(--gold-deep); }
.zf7 .cap .txt{ text-align:left; max-width:60%; }
.zf7 .cap .pname{ font-weight:700; font-size:32px; line-height:1.1; color:var(--maroon); text-transform:uppercase; letter-spacing:.03em; }
.zf7 .cap .psub{ margin-top:8px; font-size:13px; letter-spacing:.22em; color:var(--gold-deep); text-transform:uppercase; }

/* ===== Frame 8 — Festive Gold ===== */
.zf8{ background:var(--maroon-deep); }
.zf8 .bgpat{ position:absolute; inset:0; opacity:.1; mix-blend-mode:screen;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%23E7CFA1' stroke-width='1'><circle cx='60' cy='60' r='30'/><path d='M60 12 C44 32 44 88 60 108 C76 88 76 32 60 12 Z'/></g></svg>");
  background-size:150px 150px; }
.zf8 .logo{ position:absolute; top:34px; left:0; right:0; display:flex; justify-content:center; }
.zf8 .logo img{ height:70px; }
.zf8 .corner{ position:absolute; width:108px; height:108px; }
.zf8 .corner svg{ width:100%; height:100%; }
.zf8 .corner.tl{ top:24px; left:24px; } .zf8 .corner.tr{ top:24px; right:24px; transform:scaleX(-1); }
.zf8 .corner.bl{ bottom:24px; left:24px; transform:scaleY(-1); } .zf8 .corner.br{ bottom:24px; right:24px; transform:scale(-1,-1); }
.zf8 .photo{ position:absolute; left:46px; right:46px; top:128px; height:506px; overflow:hidden;
  border:3px solid var(--gold-deep); background:#470f1f; }
.zf8 .ribbon{ position:absolute; left:50%; bottom:58px; transform:translateX(-50%); text-align:center;
  background:linear-gradient(180deg,var(--gold-lite),var(--gold)); color:var(--maroon-deep);
  padding:14px 56px; border-radius:6px; box-shadow:0 6px 16px rgba(0,0,0,.4); max-width:80%; }
.zf8 .ribbon .pname{ font-weight:700; font-size:30px; line-height:1.08; text-transform:uppercase; letter-spacing:.04em; }
.zf8 .ribbon .psub{ margin-top:6px; font-size:13px; letter-spacing:.2em; color:var(--maroon); text-transform:uppercase; }

/* ===== Portrait (800×1200) overrides ===== */
/* Frames 2, 3, 4, 6 already use full-bleed / spanning bands and adapt automatically. */
.zframe.portrait{ width:800px; height:1200px; }

/* Frame 1 — taller photo, banner stays at the bottom */
.portrait.zf1 .photo{ height:auto; bottom:204px; }

/* Frame 5 — side panel becomes a top brand band */
.portrait.zf5 .panel{ left:0; right:0; top:0; bottom:auto; width:auto; height:288px;
  flex-direction:row; align-items:center; gap:34px; padding:44px 54px; }
.portrait.zf5 .panel img{ height:88px; }
.portrait.zf5 .panel .mid{ margin:0; flex:1; }
.portrait.zf5 .panel .pname{ font-size:40px; }
.portrait.zf5 .panel .tag{ display:none; }
.portrait.zf5 .rule{ left:0; right:0; top:288px; bottom:auto; width:auto; height:3px;
  background:linear-gradient(90deg,var(--gold-deep),var(--gold-lite),var(--gold-deep)); }
.portrait.zf5 .photo{ left:0; right:0; top:291px; bottom:0; }

/* Frame 7 — taller portrait photo */
.portrait.zf7 .photo{ height:auto; bottom:176px; }

/* Frame 8 — taller portrait photo */
.portrait.zf8 .photo{ height:auto; bottom:160px; }
`;

const cornerSvg = (
  <svg viewBox="0 0 120 120" fill="none" stroke="#E7CFA1" strokeWidth="1.6" strokeLinecap="round">
    <path d="M6 54 Q6 6 54 6" />
    <path d="M14 60 Q14 14 60 14" opacity=".55" />
    <path d="M6 54 q22 -2 30 -28" opacity=".8" />
    <path d="M54 6 q-2 22 -28 30" opacity=".8" />
    <circle cx="6" cy="54" r="2.6" fill="#E7CFA1" stroke="none" />
    <circle cx="54" cy="6" r="2.6" fill="#E7CFA1" stroke="none" />
    <path d="M30 30 l10 0 M30 30 l0 10" />
    <circle cx="30" cy="30" r="3.2" />
  </svg>
);

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "program";
}

type FrameProps = { name: string; sub: string; photo: string | null };

const WHITE_LOGO = "/brand/logo-full-white.png";
const DARK_LOGO = "/brand/logo-full.png";

function Photo({ photo }: { photo: string | null }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="cover" src={photo} alt="Program" />;
  }
  return (
    <div className="ph">
      <div className="ic">&#128247;</div>
      <div className="tx">Upload Photo</div>
    </div>
  );
}

/* ---- Frame 1 ---- */
function Frame1({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="edge" />
      <div className="edge2" />
      <div className="photo"><Photo photo={photo} /></div>
      <div className="bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
        <div className="txt">
          <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
          {sub ? <div className="psub">{sub}</div> : null}
        </div>
      </div>
    </>
  );
}

/* ---- Frame 2 ---- */
function Frame2({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="photo"><Photo photo={photo} /></div>
      <div className="grad" />
      <div className="corner tl">{cornerSvg}</div>
      <div className="corner tr">{cornerSvg}</div>
      <div className="corner bl">{cornerSvg}</div>
      <div className="corner br">{cornerSvg}</div>
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
      </div>
      <div className="foot">
        <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
        <div className="uline" />
        {sub ? <div className="psub">{sub}</div> : null}
      </div>
    </>
  );
}

/* ---- Frame 3 ---- */
function Frame3({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="photo"><Photo photo={photo} /></div>
      <div className="band" />
      <div className="row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
        <div className="txt">
          <div className="kick">Zenithia Global School</div>
          <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
          {sub ? <div className="psub">{sub}</div> : null}
        </div>
      </div>
    </>
  );
}

/* ---- Frame 4 ---- */
function Frame4({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
        <div className="txt">
          <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
          {sub ? <div className="psub">{sub}</div> : null}
        </div>
      </div>
      <div className="rule" />
      <div className="photo"><Photo photo={photo} /></div>
    </>
  );
}

/* ---- Frame 5 ---- */
function Frame5({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
        <div className="mid">
          <div className="kick">Zenithia Global School</div>
          <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
          {sub ? <div className="psub">{sub}</div> : null}
        </div>
        <div className="tag">Knowledge &bull; Character &bull; Excellence</div>
      </div>
      <div className="rule" />
      <div className="photo"><Photo photo={photo} /></div>
    </>
  );
}

/* ---- Frame 6 ---- */
function Frame6({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
        <span className="nm">Zenithia Global School</span>
      </div>
      <div className="photo"><Photo photo={photo} /></div>
      <div className="bot">
        <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
        {sub ? <div className="psub">{sub}</div> : null}
      </div>
    </>
  );
}

/* ---- Frame 7 ---- */
function Frame7({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="f1" />
      <div className="f2" />
      <div className="photo"><Photo photo={photo} /></div>
      <div className="cap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DARK_LOGO} alt="Zenithia Global School" />
        <div className="bar" />
        <div className="txt">
          <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
          {sub ? <div className="psub">{sub}</div> : null}
        </div>
      </div>
    </>
  );
}

/* ---- Frame 8 ---- */
function Frame8({ name, sub, photo }: FrameProps) {
  return (
    <>
      <div className="bgpat" />
      <div className="corner tl">{cornerSvg}</div>
      <div className="corner tr">{cornerSvg}</div>
      <div className="corner bl">{cornerSvg}</div>
      <div className="corner br">{cornerSvg}</div>
      <div className="logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt="Zenithia Global School" />
      </div>
      <div className="photo"><Photo photo={photo} /></div>
      <div className="ribbon">
        <div className={`cz pname${name ? "" : " ghost"}`}>{name || "Program Name"}</div>
        {sub ? <div className="psub">{sub}</div> : null}
      </div>
    </>
  );
}

const FRAME_BG: Record<FrameId, string> = {
  1: "#7A1F35",
  2: "#3f0f1d",
  3: "#3f0f1d",
  4: "#7A1F35",
  5: "#7A1F35",
  6: "#000000",
  7: "#F4EEE3",
  8: "#3f0f1d",
};

type Orient = "landscape" | "portrait";

export default function PhotoFrameMaker() {
  const [frame, setFrame] = useState<FrameId>(1);
  const [orient, setOrient] = useState<Orient>("landscape");
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const W = orient === "portrait" ? 800 : 1200;
  const H = orient === "portrait" ? 1200 : 800;

  // Fit the fixed frame (landscape 1200×800 or portrait 800×1200) to the container width.
  useEffect(() => {
    const el = scalerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const s = Math.min(w / W, 1);
      setScale(s);
      el.style.height = `${H * s}px`;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  const onPhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }, []);

  const onDownload = useCallback(async () => {
    const node = frameRef.current;
    if (!node) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: FRAME_BG[frame],
      });
      const a = document.createElement("a");
      a.download = `zenithia-frame-f${frame}-${orient === "portrait" ? "portrait" : "landscape"}-${slugify(name)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the frame could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [name, frame, orient]);

  const props: FrameProps = { name, sub, photo };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: FRAME_CSS }} />

      {/* Controls */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-brand">Frame details</h2>
        <p className="mt-1 text-sm text-ink/55">Choose an orientation and frame, add the program name and upload a photo.</p>

        {/* Orientation switcher */}
        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium text-ink/70">Orientation</span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "landscape", label: "Landscape", hint: "Wide photo (1200×800)" },
              { id: "portrait", label: "Portrait", hint: "Tall photo (800×1200)" },
            ] as { id: Orient; label: string; hint: string }[]).map((o) => {
              const active = o.id === orient;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOrient(o.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-black/15 hover:border-brand/40 hover:bg-black/[0.02]"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? "text-brand" : "text-ink"}`}>
                    {o.label}
                  </span>
                  <span className="block text-xs text-ink/50">{o.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frame switcher */}
        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium text-ink/70">Frame</span>
          <div className="grid grid-cols-2 gap-2">
            {FRAMES.map((f) => {
              const active = f.id === frame;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrame(f.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                      : "border-black/15 hover:border-brand/40 hover:bg-black/[0.02]"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? "text-brand" : "text-ink"}`}>
                    {f.id}. {f.name}
                  </span>
                  <span className="block text-xs text-ink/50">{f.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Program Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. International Yoga Day"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Date / Venue <span className="text-ink/40">(optional)</span></span>
            <input
              type="text"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="e.g. 21 June 2026 · School Grounds"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Program Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={onPhoto}
              className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
            />
            <p className="mt-1 text-xs text-ink/45">
              The photo is auto-fitted into the frame for the selected orientation.
            </p>
          </label>

          <button
            type="button"
            onClick={onDownload}
            disabled={busy}
            className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "Generating…" : `Download Frame ${frame} (PNG)`}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-ink/5 p-4">
        <div ref={scalerRef} className="relative mx-auto w-full" style={{ maxWidth: W }}>
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
            <div ref={frameRef} className={`zframe zf${frame}${orient === "portrait" ? " portrait" : ""}`}>
              {frame === 1 && <Frame1 {...props} />}
              {frame === 2 && <Frame2 {...props} />}
              {frame === 3 && <Frame3 {...props} />}
              {frame === 4 && <Frame4 {...props} />}
              {frame === 5 && <Frame5 {...props} />}
              {frame === 6 && <Frame6 {...props} />}
              {frame === 7 && <Frame7 {...props} />}
              {frame === 8 && <Frame8 {...props} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
