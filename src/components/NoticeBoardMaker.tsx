"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { addImageToGalleryAction } from "@/lib/actions";

/**
 * School "Notice Board" maker (admin only).
 * Compose a portrait announcement (Malayalam + English) with a title, date and
 * point-wise body. Pick one of several designs, optionally start from a ready
 * template, then download a high-res PNG or publish straight to the gallery.
 */

type DesignId = 1 | 2 | 3 | 4;

const DESIGNS: { id: DesignId; name: string; hint: string }[] = [
  { id: 1, name: "Royal Maroon", hint: "Maroon header + cream body" },
  { id: 2, name: "Ivory Elegant", hint: "Framed cream, gold accents" },
  { id: 3, name: "Modern Accent", hint: "White, maroon side bar" },
  { id: 4, name: "Formal Letter", hint: "Official letterhead style" },
];

const NOTICE_BG: Record<DesignId, string> = {
  1: "#F4EEE3",
  2: "#F4EEE3",
  3: "#FFFFFF",
  4: "#FFFFFF",
};

const WHITE_LOGO = "/brand/logo-full-white.png";
const DARK_LOGO = "/brand/logo-full.png";

const SCHOOL = "Zenithia Global School";
const TAGLINE = "Knowledge · Character · Excellence";

/* ----------------------------- Templates ------------------------------ */

type Template = { id: string; name: string; title: string; date: string; body: string };

const BUILTIN_TEMPLATES: Template[] = [
  {
    id: "b1",
    name: "Parent-Teacher Meeting / രക്ഷിതാക്കളുടെ യോഗം",
    title: "രക്ഷിതാക്ക-അധ്യാപക യോഗം",
    date: "2026 ജൂൺ 21, ശനിയാഴ്ച · രാവിലെ 10:00",
    body:
      "- എല്ലാ രക്ഷിതാക്കളും നിർബന്ധമായും പങ്കെടുക്കണം.\n" +
      "- വിദ്യാർത്ഥികളുടെ പഠന പുരോഗതി ചർച്ച ചെയ്യും.\n" +
      "- സ്ഥലം: സ്കൂൾ ഓഡിറ്റോറിയം.\n" +
      "- കൃത്യസമയത്ത് എത്തിച്ചേരുവാൻ അഭ്യർത്ഥിക്കുന്നു.",
  },
  {
    id: "b2",
    name: "Holiday Notice / അവധി അറിയിപ്പ്",
    title: "അവധി അറിയിപ്പ്",
    date: "2026 ജൂൺ 25, വ്യാഴാഴ്ച",
    body:
      "- പ്രത്യേക കാരണത്താൽ സ്കൂളിന് അവധി ആയിരിക്കും.\n" +
      "- അവധി ദിവസം: _____.\n" +
      "- പതിവ് ക്ലാസുകൾ അടുത്ത പ്രവൃത്തി ദിവസം പുനരാരംഭിക്കും.",
  },
  {
    id: "b3",
    name: "Exam Schedule / പരീക്ഷാ ടൈംടേബിൾ",
    title: "ഒന്നാം ടേം പരീക്ഷ",
    date: "ആരംഭം: 2026 ജൂലൈ 10",
    body:
      "- എല്ലാ വിദ്യാർത്ഥികളും ഹാൾ ടിക്കറ്റ് കൊണ്ടുവരണം.\n" +
      "- പരീക്ഷ രാവിലെ 9:30 ന് ആരംഭിക്കും.\n" +
      "- സിലബസ് വിശദാംശങ്ങൾ ക്ലാസ് ടീച്ചറിൽ നിന്ന് അറിയുക.\n" +
      "- യൂണിഫോമിൽ കൃത്യസമയത്ത് എത്തുക.",
  },
  {
    id: "b4",
    name: "Admission Open / പ്രവേശനം ആരംഭിച്ചു",
    title: "പ്രവേശനം ആരംഭിച്ചു — 2026-27",
    date: "അവസാന തീയതി: _____",
    body:
      "- LKG മുതൽ ഹയർ സെക്കൻഡറി വരെ പ്രവേശനം.\n" +
      "- അപേക്ഷാ ഫോറം സ്കൂൾ ഓഫീസിൽ ലഭ്യമാണ്.\n" +
      "- പരിമിതമായ സീറ്റുകൾ മാത്രം.\n" +
      "- കൂടുതൽ വിവരങ്ങൾക്ക്: _____.",
  },
  {
    id: "b5",
    name: "School Reopening / സ്കൂൾ പുനരാരംഭം",
    title: "സ്കൂൾ പുനരാരംഭിക്കുന്നു",
    date: "2026 ജൂൺ 1, തിങ്കളാഴ്ച",
    body:
      "- അവധിക്ക് ശേഷം സ്കൂൾ പുനരാരംഭിക്കുന്നു.\n" +
      "- എല്ലാ വിദ്യാർത്ഥികളും യൂണിഫോമിൽ എത്തണം.\n" +
      "- പുസ്തകങ്ങളും ഡയറിയും കൊണ്ടുവരിക.",
  },
  {
    id: "b6",
    name: "Annual Day / വാർഷിക ദിനാഘോഷം",
    title: "വാർഷിക ദിനാഘോഷം",
    date: "2026 ഡിസംബർ 20, ശനിയാഴ്ച · വൈകീട്ട് 5:00",
    body:
      "- സാംസ്കാരിക പരിപാടികളും സമ്മാനദാനവും.\n" +
      "- രക്ഷിതാക്കളെ സ്നേഹപൂർവ്വം ക്ഷണിക്കുന്നു.\n" +
      "- സ്ഥലം: സ്കൂൾ ഗ്രൗണ്ട്.",
  },
  {
    id: "b7",
    name: "Fee Reminder / ഫീസ് അറിയിപ്പ്",
    title: "ഫീസ് അടയ്ക്കാനുള്ള അറിയിപ്പ്",
    date: "അവസാന തീയതി: _____",
    body:
      "- ഈ മാസത്തെ ഫീസ് അടയ്ക്കാനുണ്ട്.\n" +
      "- ഓഫീസ് സമയം: രാവിലെ 9 മുതൽ വൈകീട്ട് 4 വരെ.\n" +
      "- സമയത്ത് ഫീസ് അടച്ച് സഹകരിക്കുക.",
  },
  {
    id: "b8",
    name: "General Announcement / പൊതു അറിയിപ്പ്",
    title: "അറിയിപ്പ്",
    date: "",
    body: "- _____\n- _____\n- _____",
  },
];

const CUSTOM_KEY = "zenithia-notice-templates-v1";

/* ------------------------------ Body parse ----------------------------- */

type Block =
  | { type: "para"; text: string }
  | { type: "bullet"; text: string }
  | { type: "number"; text: string; n: number }
  | { type: "space" };

function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      blocks.push({ type: "space" });
      continue;
    }
    const num = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (/^[-•*]\s+/.test(line)) {
      blocks.push({ type: "bullet", text: line.replace(/^[-•*]\s+/, "") });
    } else if (num) {
      blocks.push({ type: "number", text: num[2], n: Number(num[1]) });
    } else {
      blocks.push({ type: "para", text: line });
    }
  }
  return blocks;
}

function NoticeBody({ body }: { body: string }) {
  const blocks = parseBody(body);
  if (!body.trim()) {
    return (
      <div className="nbody">
        <div className="nli">
          <span className="ndot" />
          <span className="ntx ghost">ഇവിടെ അറിയിപ്പിന്റെ വിശദാംശങ്ങൾ വരും.</span>
        </div>
        <div className="nli">
          <span className="ndot" />
          <span className="ntx ghost">Each line becomes a point.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="nbody">
      {blocks.map((b, i) => {
        if (b.type === "space") return <div key={i} className="nsp" />;
        if (b.type === "para")
          return (
            <p key={i} className="npara">
              {b.text}
            </p>
          );
        if (b.type === "number")
          return (
            <div key={i} className="nli">
              <span className="nnum">{b.n}.</span>
              <span className="ntx">{b.text}</span>
            </div>
          );
        return (
          <div key={i} className="nli">
            <span className="ndot" />
            <span className="ntx">{b.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Designs ------------------------------- */

type DesignProps = { title: string; date: string; body: string; footer: string };

function Design1({ title, date, body, footer }: DesignProps) {
  return (
    <>
      <div className="head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WHITE_LOGO} alt={SCHOOL} />
        <div className="sname">{SCHOOL}</div>
      </div>
      <div className="body">
        <div className="kick">അറിയിപ്പ് · NOTICE</div>
        {title ? <div className="ntitle">{title}</div> : null}
        {date ? <div className="ndate">{date}</div> : null}
        <NoticeBody body={body} />
      </div>
      {footer ? <div className="foot">{footer}</div> : null}
    </>
  );
}

function Design2({ title, date, body, footer }: DesignProps) {
  return (
    <>
      <div className="border1" />
      <div className="border2" />
      <div className="inner">
        <div className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DARK_LOGO} alt={SCHOOL} />
        </div>
        <div className="kick">അറിയിപ്പ് · NOTICE</div>
        {title ? <div className="ntitle">{title}</div> : null}
        <div className="divide" />
        {date ? <div className="ndate">{date}</div> : null}
        <NoticeBody body={body} />
        {footer ? <div className="foot">{footer}</div> : null}
      </div>
    </>
  );
}

function Design3({ title, date, body, footer }: DesignProps) {
  return (
    <>
      <div className="sidebar" />
      <div className="inner">
        <div className="top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DARK_LOGO} alt={SCHOOL} />
          <div className="sname">{SCHOOL}</div>
        </div>
        <div className="kick">അറിയിപ്പ് · NOTICE</div>
        {title ? <div className="ntitle">{title}</div> : null}
        {date ? <div className="ndate">{date}</div> : null}
        <NoticeBody body={body} />
        {footer ? <div className="foot">{footer}</div> : null}
      </div>
    </>
  );
}

function Design4({ title, date, body, footer }: DesignProps) {
  return (
    <div className="inner">
      <div className="lhead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={DARK_LOGO} alt={SCHOOL} />
        <div className="meta">
          <div className="sname">{SCHOOL}</div>
          <div className="addr">{TAGLINE}</div>
        </div>
      </div>
      <div className="noticehd">
        <span>അറിയിപ്പ് · NOTICE</span>
      </div>
      {date ? <div className="ndate">തീയതി / Date: {date}</div> : null}
      {title ? <div className="ntitle">{title}</div> : null}
      <NoticeBody body={body} />
      {footer ? (
        <div className="foot">
          {footer}
          <div className="sub">{SCHOOL}</div>
        </div>
      ) : null}
    </div>
  );
}

/* --------------------------------- CSS --------------------------------- */

const NOTICE_CSS = `
.znotice, .znotice *{ margin:0; padding:0; box-sizing:border-box; }
.znotice{
  --maroon:#7A1F35; --maroon-deep:#3f0f1d; --maroon-glow:#9c3550;
  --gold:#E7CFA1; --gold-deep:#B9924E; --gold-lite:#FBEFD2;
  --ink:#181819; --white:#F7F5F2; --cream:#F4EEE3;
  width:800px; height:1120px; position:relative; overflow:hidden;
  font-family:var(--font-noto-sans-ml),'Noto Sans Malayalam',var(--font-inter),'Inter',sans-serif;
  color:var(--ink);
}
.znotice img{ display:block; }

/* shared body */
.znotice .nbody{ display:flex; flex-direction:column; gap:14px; flex:1; overflow:hidden; }
.znotice .npara{ font-size:24px; line-height:1.5; }
.znotice .nli{ display:flex; gap:14px; align-items:flex-start; }
.znotice .ndot{ width:11px; height:11px; border-radius:50%; margin-top:9px; flex:0 0 auto; background:var(--maroon); }
.znotice .nnum{ font-weight:700; color:var(--maroon); min-width:30px; font-size:24px; line-height:1.5; }
.znotice .ntx{ font-size:24px; line-height:1.5; flex:1; }
.znotice .nsp{ height:8px; }
.znotice .ghost{ opacity:.4; }
/* Long titles wrap to at most two lines and never overflow. */
.znotice .ntitle{
  overflow-wrap:anywhere; word-break:break-word; hyphens:auto;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden;
}

/* ===== Design 1 — Royal Maroon ===== */
.nd1{ background:var(--cream); }
.nd1 .head{ position:absolute; top:0; left:0; right:0; height:200px;
  background:linear-gradient(135deg,var(--maroon),var(--maroon-deep));
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
.nd1 .head img{ height:76px; }
.nd1 .head .sname{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:17px; letter-spacing:.28em; color:var(--gold-lite); text-transform:uppercase; }
.nd1 .head::after{ content:''; position:absolute; left:0; right:0; bottom:0; height:5px;
  background:linear-gradient(90deg,var(--gold-deep),var(--gold-lite),var(--gold-deep)); }
.nd1 .body{ position:absolute; top:200px; left:0; right:0; bottom:58px; padding:40px 60px; display:flex; flex-direction:column; }
.nd1 .kick{ text-align:center; font-size:15px; letter-spacing:.34em; color:var(--gold-deep); text-transform:uppercase; font-weight:600; }
.nd1 .ntitle{ margin-top:14px; text-align:center; font-family:var(--font-noto-serif-ml),'Noto Serif Malayalam',serif; font-weight:700; font-size:40px; line-height:1.18; color:var(--maroon); }
.nd1 .ndate{ margin:18px auto 0; background:var(--maroon); color:var(--gold-lite); font-size:18px; padding:9px 24px; border-radius:999px; font-weight:600; }
.nd1 .nbody{ margin-top:30px; }
.nd1 .foot{ position:absolute; left:0; right:0; bottom:0; height:58px; background:var(--maroon-deep); color:var(--gold-lite);
  display:flex; align-items:center; justify-content:center; font-size:16px; letter-spacing:.03em; }

/* ===== Design 2 — Ivory Elegant ===== */
.nd2{ background:var(--cream); }
.nd2 .border1{ position:absolute; inset:24px; border:3px solid var(--maroon); }
.nd2 .border2{ position:absolute; inset:32px; border:1px solid var(--gold-deep); }
.nd2 .inner{ position:absolute; inset:60px; display:flex; flex-direction:column; align-items:stretch; }
.nd2 .logo{ text-align:center; }
.nd2 .logo img{ height:80px; margin:0 auto; }
.nd2 .kick{ margin-top:20px; text-align:center; font-size:14px; letter-spacing:.4em; color:var(--gold-deep); text-transform:uppercase; font-weight:600; }
.nd2 .ntitle{ margin-top:10px; text-align:center; font-family:var(--font-noto-serif-ml),'Noto Serif Malayalam',serif; font-weight:700; font-size:38px; color:var(--maroon); line-height:1.2; }
.nd2 .divide{ position:relative; margin:20px auto; width:220px; height:2px; background:linear-gradient(90deg,transparent,var(--gold-deep),transparent); }
.nd2 .divide::after{ content:'\\2666'; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:var(--gold-deep); background:var(--cream); padding:0 10px; font-size:14px; }
.nd2 .ndate{ text-align:center; font-size:18px; color:var(--maroon); font-weight:600; }
.nd2 .nbody{ margin-top:26px; }
.nd2 .foot{ text-align:center; font-size:16px; color:var(--maroon); font-weight:600; padding-top:12px; }

/* ===== Design 3 — Modern Accent ===== */
.nd3{ background:#fff; }
.nd3 .sidebar{ position:absolute; left:0; top:0; bottom:0; width:22px; background:linear-gradient(180deg,var(--maroon),var(--maroon-deep)); }
.nd3 .inner{ position:absolute; left:22px; right:0; top:0; bottom:0; padding:54px 56px; display:flex; flex-direction:column; }
.nd3 .top{ display:flex; align-items:center; gap:18px; }
.nd3 .top img{ height:58px; }
.nd3 .top .sname{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:15px; letter-spacing:.16em; color:var(--maroon); text-transform:uppercase; font-weight:700; }
.nd3 .kick{ margin-top:34px; font-size:14px; letter-spacing:.32em; color:var(--gold-deep); text-transform:uppercase; font-weight:700; }
.nd3 .ntitle{ margin-top:10px; font-weight:800; font-size:44px; line-height:1.14; color:var(--maroon); }
.nd3 .ndate{ margin-top:18px; align-self:flex-start; background:var(--maroon); color:#fff; font-size:17px; padding:8px 18px; border-radius:8px; font-weight:600; }
.nd3 .nbody{ margin-top:28px; }
.nd3 .foot{ border-top:2px solid var(--maroon); padding-top:16px; font-size:15px; color:var(--maroon); font-weight:600; }

/* ===== Design 4 — Formal Letterhead ===== */
.nd4{ background:#fff; }
.nd4 .inner{ position:absolute; inset:0; padding:50px 60px; display:flex; flex-direction:column; }
.nd4 .lhead{ display:flex; align-items:center; gap:20px; padding-bottom:18px; border-bottom:3px solid var(--maroon); }
.nd4 .lhead img{ height:72px; }
.nd4 .lhead .meta{ flex:1; }
.nd4 .lhead .sname{ font-family:var(--font-cinzel),'Cinzel',serif; font-size:24px; color:var(--maroon); font-weight:800; letter-spacing:.03em; }
.nd4 .lhead .addr{ margin-top:5px; font-size:13px; color:var(--ink); opacity:.65; letter-spacing:.04em; }
.nd4 .noticehd{ text-align:center; margin-top:30px; font-family:var(--font-noto-serif-ml),'Noto Serif Malayalam',serif; font-size:24px; font-weight:700; color:var(--maroon); letter-spacing:.08em; }
.nd4 .noticehd span{ border-bottom:2px solid var(--gold-deep); padding-bottom:5px; }
.nd4 .ndate{ margin-top:24px; text-align:right; font-size:16px; color:var(--ink); font-weight:600; }
.nd4 .ntitle{ margin-top:8px; text-align:center; font-family:var(--font-noto-serif-ml),'Noto Serif Malayalam',serif; font-size:30px; font-weight:700; color:var(--maroon); line-height:1.2; }
.nd4 .nbody{ margin-top:22px; }
.nd4 .foot{ text-align:right; font-size:17px; color:var(--maroon); font-weight:700; }
.nd4 .foot .sub{ font-weight:400; opacity:.65; font-size:13px; margin-top:3px; }
`;

/* ------------------------------ Component ------------------------------ */

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "notice"
  );
}

export default function NoticeBoardMaker() {
  const [design, setDesign] = useState<DesignId>(1);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("— Principal");

  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState("");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const noticeRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const W = 800;
  const H = 1120;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_KEY);
      if (raw) setCustomTemplates(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

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
  }, []);

  const applyTemplate = useCallback(
    (id: string) => {
      setSelected(id);
      if (!id) return;
      const all = [...BUILTIN_TEMPLATES, ...customTemplates];
      const t = all.find((x) => x.id === id);
      if (!t) return;
      setTitle(t.title);
      setDate(t.date);
      setBody(t.body);
    },
    [customTemplates],
  );

  const saveTemplate = useCallback(() => {
    const name = window.prompt("Template name (ടെംപ്ലേറ്റിന്റെ പേര്):", title || "My notice");
    if (!name) return;
    const t: Template = { id: `c${Date.now()}`, name: name.trim(), title, date, body };
    const next = [...customTemplates, t];
    setCustomTemplates(next);
    setSelected(t.id);
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [title, date, body, customTemplates]);

  const deleteTemplate = useCallback(() => {
    if (!selected.startsWith("c")) return;
    const next = customTemplates.filter((t) => t.id !== selected);
    setCustomTemplates(next);
    setSelected("");
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [selected, customTemplates]);

  const onDownload = useCallback(async () => {
    const node = noticeRef.current;
    if (!node) return;
    setBusy(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: NOTICE_BG[design],
      });
      const a = document.createElement("a");
      a.download = `zenithia-notice-d${design}-${slugify(title)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the notice could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [title, design]);

  const onAddToGallery = useCallback(async () => {
    const node = noticeRef.current;
    if (!node) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const blob = await toBlob(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: NOTICE_BG[design],
      });
      if (!blob) throw new Error("Could not render the notice.");
      const fileName = `zenithia-notice-d${design}-${slugify(title)}.png`;
      const fd = new FormData();
      fd.append("file", blob, fileName);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) {
        const e = await up.json().catch(() => null);
        throw new Error(e?.error || "Upload failed.");
      }
      const { url } = await up.json();
      const res = await addImageToGalleryAction(url, title.trim() || "Notice", "Notices");
      if (!res.ok) throw new Error(res.error || "Could not add to gallery.");
      setSavedMsg("Added to the gallery. Manage it from the Gallery page.");
    } catch (err) {
      console.error(err);
      setSavedMsg(err instanceof Error ? err.message : "Could not add to gallery.");
    } finally {
      setSaving(false);
    }
  }, [title, design]);

  const props: DesignProps = { title, date, body, footer };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: NOTICE_CSS }} />

      {/* Controls */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-brand">Notice details</h2>
        <p className="mt-1 text-sm text-ink/55">
          Pick a design, optionally start from a template, then type the notice in
          Malayalam or English.
        </p>

        {/* Template dropdown */}
        <div className="mt-5">
          <span className="mb-2 block text-sm font-medium text-ink/70">Start from a template</span>
          <select
            value={selected}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">— Blank notice —</option>
            <optgroup label="Common school notices">
              {BUILTIN_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            {customTemplates.length > 0 && (
              <optgroup label="My templates">
                {customTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={saveTemplate}
              className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5"
            >
              Save current as template
            </button>
            {selected.startsWith("c") && (
              <button
                type="button"
                onClick={deleteTemplate}
                className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Delete template
              </button>
            )}
          </div>
        </div>

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
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Title <span className="text-ink/40">(optional)</span>
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. രക്ഷിതാക്ക-അധ്യാപക യോഗം"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Date <span className="text-ink/40">(optional)</span>
            </span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. 2026 ജൂൺ 21, ശനിയാഴ്ച · 10:00 AM"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Notice content</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder={"ഓരോ വരിയും ഒരു പോയിന്റാകും.\n- ആദ്യത്തെ പോയിന്റ്\n- രണ്ടാമത്തെ പോയിന്റ്"}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <p className="mt-1 text-xs text-ink/45">
              ഓരോ വരിയും ഒരു പോയിന്റായി വരും. ബുള്ളറ്റിന് വരി{" "}
              <code className="rounded bg-black/5 px-1">- </code> കൊണ്ടോ, നമ്പറിന്{" "}
              <code className="rounded bg-black/5 px-1">1. </code> കൊണ്ടോ തുടങ്ങുക.
            </p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Signature / Footer <span className="text-ink/40">(optional)</span>
            </span>
            <input
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="e.g. — Principal"
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <button
            type="button"
            onClick={onAddToGallery}
            disabled={saving || busy}
            className="w-full rounded-full border border-brand px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/5 disabled:opacity-60"
          >
            {saving ? "Adding to Gallery…" : "Add to Gallery"}
          </button>
          {savedMsg ? (
            <p className="text-center text-xs text-ink/60">{savedMsg}</p>
          ) : (
            <p className="text-center text-xs text-ink/45">
              “Add to Gallery” generates the notice and publishes it to the public gallery automatically.
            </p>
          )}

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
            <div ref={noticeRef} className={`znotice nd${design}`}>
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
