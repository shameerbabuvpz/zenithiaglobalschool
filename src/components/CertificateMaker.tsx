"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import StudentPicker from "@/components/admin/StudentPicker";
import SignatoryPicker from "@/components/admin/SignatoryPicker";
import type { StudentDTO, StaffDTO } from "@/lib/actions";

/**
 * Certificate maker / downloader (admin only).
 *
 * Generate award and participation certificates for Arts, Sports, Day
 * Celebrations, Quiz competitions and any other event. Pick the award
 * (First / Second / Third / Participation), fill the event details, add an
 * optional student photo, choose a design, then download a high-res PNG.
 *
 * Bulk mode: upload an Excel sheet (Name, Class, Award) and one certificate
 * is generated and downloaded for every row using the current event details.
 *
 * Nothing is stored — every certificate is generated on the fly.
 */

/* ------------------------------- Awards -------------------------------- */

type AwardId = "first" | "second" | "third" | "participant";

const AWARDS: {
  id: AwardId;
  label: string;
  prize: string;
  badge: string;
  color: string;
  participation: boolean;
}[] = [
  { id: "first", label: "First Prize", prize: "First", badge: "1ST", color: "#D4AF37", participation: false },
  { id: "second", label: "Second Prize", prize: "Second", badge: "2ND", color: "#9AA0A6", participation: false },
  { id: "third", label: "Third Prize", prize: "Third", badge: "3RD", color: "#C77B30", participation: false },
  { id: "participant", label: "Participation", prize: "", badge: "★", color: "#6E1E3C", participation: true },
];

function awardInfo(id: AwardId) {
  return AWARDS.find((a) => a.id === id) ?? AWARDS[0];
}

function normalizeAward(raw: string): AwardId {
  const s = raw.trim().toLowerCase();
  if (/(^1\b)|first|1st/.test(s)) return "first";
  if (/(^2\b)|second|2nd/.test(s)) return "second";
  if (/(^3\b)|third|3rd/.test(s)) return "third";
  return "participant";
}

/* ------------------------------ Designs -------------------------------- */

type DesignId = 1 | 2 | 3 | 4 | 5 | 6;

const DESIGNS: { id: DesignId; name: string; hint: string }[] = [
  { id: 1, name: "Royal Maroon", hint: "Classic maroon & gold — all purpose" },
  { id: 2, name: "Elegant Gold", hint: "Ornate cream double frame — formal" },
  { id: 3, name: "Islamic Heritage", hint: "Girih pattern & arch — Arts" },
  { id: 4, name: "Sports Champion", hint: "Laurel & medal banner — Sports" },
  { id: 5, name: "Festive Celebration", hint: "Bunting & confetti — Day events" },
  { id: 6, name: "Modern Minimal", hint: "Clean side band — Quiz & academic" },
];

const CERT_BG: Record<DesignId, string> = {
  1: "#FFFFFF",
  2: "#F4EEE3",
  3: "#F6F1E7",
  4: "#FFFFFF",
  5: "#FBF7EF",
  6: "#FFFFFF",
};

const LOGO = "/brand/logo-full.png";
const WHITE_LOGO = "/brand/logo-full-white.png";
const SEAL = "/brand/logo-mark.png";

const CATEGORY_SUGGESTIONS = [
  "Arts",
  "Sports",
  "Day Celebration",
  "Quiz Competition",
  "Cultural Programme",
  "Academic",
  "Literary",
  "Co-curricular",
];

/* ------------------------------ Data types ----------------------------- */

type CertData = {
  design: DesignId;
  award: AwardId;
  subtitle: string; // optional override for "OF ACHIEVEMENT" line
  event: string;
  category: string;
  place: string;
  date: string;
  studentName: string;
  klass: string;
  includePhoto: boolean;
  photo: string | null;
  citation: string; // optional custom citation override
  sig1Name: string;
  sig1Role: string;
  sig1Img: string | null;
  sig2Name: string;
  sig2Role: string;
  sig2Img: string | null;
};

function subtitleFor(d: CertData): string {
  if (d.subtitle.trim()) return d.subtitle.trim().toUpperCase();
  return awardInfo(d.award).participation ? "OF PARTICIPATION" : "OF ACHIEVEMENT";
}

function citationFor(d: CertData): string {
  if (d.citation.trim()) return d.citation.trim();
  const a = awardInfo(d.award);
  const event = d.event.trim();
  const cat = d.category.trim();
  const place = d.place.trim();
  let s = a.participation
    ? "for actively participating"
    : `for securing the ${a.label}`;
  if (event) s += ` in ${event}`;
  if (cat) s += ` (${cat})`;
  if (place) s += `, held at ${place}`;
  return s + ".";
}

/* ------------------------------ Card view ------------------------------ */

// Curved laurel branch (Sports design). Drawn entirely inline so it embeds
// cleanly in the exported PNG (no external resources / url(#id) filters).
function Laurel({ flip }: { flip?: boolean }) {
  const leaves = Array.from({ length: 7 });
  return (
    <svg
      className="laurel"
      viewBox="0 0 70 96"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="M52,90 C24,74 18,44 30,8" fill="none" stroke="#C6A875" strokeWidth="2.4" strokeLinecap="round" />
      {leaves.map((_, i) => {
        const t = i / (leaves.length - 1);
        const cx = 52 - t * 24 - Math.sin(t * 3) * 4;
        const cy = 90 - t * 80;
        const rot = -52 + t * 22;
        return (
          <g key={i}>
            <ellipse cx={cx - 7} cy={cy} rx="9" ry="4" transform={`rotate(${rot - 18} ${cx - 7} ${cy})`} fill="#C6A875" />
            <ellipse cx={cx + 6} cy={cy} rx="9" ry="4" transform={`rotate(${rot + 18} ${cx + 6} ${cy})`} fill="#b3935a" />
          </g>
        );
      })}
    </svg>
  );
}

// Triangular bunting flags across the top (Festive design).
function Bunting() {
  const n = 13;
  const w = 1056 / n;
  return (
    <svg className="bunting" viewBox="0 0 1056 56" preserveAspectRatio="none" aria-hidden>
      <path d="M0,7 Q528,22 1056,7" fill="none" stroke="#C6A875" strokeWidth="2.5" />
      {Array.from({ length: n }).map((_, i) => {
        const x = i * w;
        const dip = 7 + Math.sin((i / (n - 1)) * Math.PI) * 8;
        const col = i % 2 ? "#C6A875" : "#6E1E3C";
        return <polygon key={i} points={`${x + 5},${dip} ${x + w - 5},${dip} ${x + w / 2},${dip + 36}`} fill={col} opacity="0.92" />;
      })}
    </svg>
  );
}

// Pointed mihrab-style arch behind the title (Islamic Heritage design).
function Arch() {
  return (
    <svg className="arch" viewBox="0 0 360 230" aria-hidden>
      <path
        d="M40,228 L40,96 C40,44 120,30 180,12 C240,30 320,44 320,96 L320,228"
        fill="none"
        stroke="#C6A875"
        strokeWidth="2"
      />
      <path
        d="M52,228 L52,98 C52,52 122,40 180,24 C238,40 308,52 308,98 L308,228"
        fill="none"
        stroke="rgba(110,30,60,0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}

// Eight-pointed star medallion (Islamic Heritage corners).
function StarMark() {
  return (
    <svg className="starmark" viewBox="0 0 44 44" aria-hidden>
      <g fill="none" stroke="#C6A875" strokeWidth="1.3">
        <rect x="9" y="9" width="26" height="26" />
        <rect x="9" y="9" width="26" height="26" transform="rotate(45 22 22)" />
        <circle cx="22" cy="22" r="4.5" stroke="#6E1E3C" />
      </g>
    </svg>
  );
}

function CertificateCard({ data }: { data: CertData }) {
  const a = awardInfo(data.award);
  const citation = citationFor(data);
  const subtitle = subtitleFor(data);
  const showPhoto = data.includePhoto && !!data.photo;
  const d = data.design;

  const metaParts: string[] = [];
  if (data.klass.trim()) metaParts.push(`Class ${data.klass.trim()}`);
  if (data.date.trim()) metaParts.push(data.date.trim());

  return (
    <div className={`zcert zc${d}`}>
      <div className="bgpattern" />
      <div className="frameA" />
      <div className="frameB" />

      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />

      {d === 3 && (
        <>
          <Arch />
          <span className="starmark-pos tl"><StarMark /></span>
          <span className="starmark-pos tr"><StarMark /></span>
          <span className="starmark-pos bl"><StarMark /></span>
          <span className="starmark-pos br"><StarMark /></span>
        </>
      )}
      {d === 4 && <div className="sportband" />}
      {d === 5 && <Bunting />}
      {d === 6 && (
        <div className="sideband">
          <span className="sbword">CERTIFICATE</span>
        </div>
      )}

      <div className="cbody">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="clogo" src={d === 4 ? WHITE_LOGO : LOGO} alt="Zenithia Global School" />

        <div className="ctitle">CERTIFICATE</div>
        <div className="csub">{subtitle}</div>

        <div className="cdivider">
          {d === 4 && <Laurel />}
          <span className="dline" />
          <span className="dmedal" style={{ background: a.color }}>
            {a.badge}
          </span>
          <span className="dline" />
          {d === 4 && <Laurel flip />}
        </div>

        <div className="cpresent">This certificate is proudly presented to</div>

        {showPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cphoto" src={data.photo as string} alt={data.studentName} />
        )}

        <div className="cname">{data.studentName || "Student Name"}</div>
        <div className="cnameline" />

        <div className="cbodytext">{citation}</div>
        {metaParts.length > 0 && <div className="cmeta">{metaParts.join("  ·  ")}</div>}

        <div className="cfooter">
          <div className="sig">
            {data.sig1Img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sigimg" src={data.sig1Img} alt="" />
            )}
            <div className="sigline">
              <div className="signame">{data.sig1Name || "\u00A0"}</div>
              <div className="sigrole">{data.sig1Role || "\u00A0"}</div>
            </div>
          </div>

          <div className="seal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SEAL} alt="" />
          </div>

          <div className="sig">
            {data.sig2Img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="sigimg" src={data.sig2Img} alt="" />
            )}
            <div className="sigline">
              <div className="signame">{data.sig2Name || "\u00A0"}</div>
              <div className="sigrole">{data.sig2Role || "\u00A0"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Helpers -------------------------------- */

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "certificate"
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type BulkRow = { name: string; klass: string; award: AwardId };

/* ------------------------------ Component ------------------------------ */

export default function CertificateMaker() {
  const [design, setDesign] = useState<DesignId>(1);
  const [award, setAward] = useState<AwardId>("first");
  const [subtitle, setSubtitle] = useState("");
  const [event, setEvent] = useState("");
  const [category, setCategory] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState("");

  const [studentName, setStudentName] = useState("");
  const [klass, setKlass] = useState("");
  const [includePhoto, setIncludePhoto] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const [citation, setCitation] = useState("");

  const [sig1Name, setSig1Name] = useState("");
  const [sig1Role, setSig1Role] = useState("Coordinator");
  const [sig1Img, setSig1Img] = useState<string | null>(null);
  const [sig2Name, setSig2Name] = useState("");
  const [sig2Role, setSig2Role] = useState("Principal");
  const [sig2Img, setSig2Img] = useState<string | null>(null);

  const [bulk, setBulk] = useState<BulkRow[]>([]);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const certRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const W = 1200;
  const H = 850;

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

  const data: CertData = useMemo(
    () => ({
      design,
      award,
      subtitle,
      event,
      category,
      place,
      date,
      studentName,
      klass,
      includePhoto,
      photo,
      citation,
      sig1Name,
      sig1Role,
      sig1Img,
      sig2Name,
      sig2Role,
      sig2Img,
    }),
    [
      design, award, subtitle, event, category, place, date, studentName, klass,
      includePhoto, photo, citation, sig1Name, sig1Role, sig1Img, sig2Name,
      sig2Role, sig2Img,
    ],
  );

  const onPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(await fileToDataUrl(f));
  }, []);

  const onSig1 = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSig1Img(await fileToDataUrl(f));
  }, []);

  const onSig2 = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSig2Img(await fileToDataUrl(f));
  }, []);

  const fillFromStudent = useCallback((s: StudentDTO) => {
    setStudentName(s.name);
    setKlass(s.klass ? `Class ${s.klass}` : "");
  }, []);

  const fillFromSig1 = useCallback((s: StaffDTO) => {
    setSig1Name(s.name);
    setSig1Role(s.designation || "Coordinator");
    setSig1Img(s.signature);
  }, []);

  const fillFromSig2 = useCallback((s: StaffDTO) => {
    setSig2Name(s.name);
    setSig2Role(s.designation || "Principal");
    setSig2Img(s.signature);
  }, []);

  /* ----------------------------- Capture ----------------------------- */
  const capturePng = useCallback(async () => {
    const node = certRef.current;
    if (!node) throw new Error("Nothing to render.");
    if (document.fonts?.ready) await document.fonts.ready;
    const imgs = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : img.decode().catch(() => undefined),
      ),
    );
    const opts = { pixelRatio: 2.5, backgroundColor: CERT_BG[design] };
    await toPng(node, opts);
    return toPng(node, opts);
  }, [design]);

  const onDownload = useCallback(async () => {
    setBusy(true);
    try {
      const dataUrl = await capturePng();
      const a = document.createElement("a");
      a.download = `zenithia-certificate-${slugify(studentName)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the certificate could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [capturePng, studentName]);

  /* ------------------------------- Bulk ------------------------------- */
  const downloadTemplate = useCallback(() => {
    const headers = ["Name", "Class", "Award"];
    const sample = [
      ["Aaron Thomas", "5 A", "First"],
      ["Fathima Rishana", "5 A", "Second"],
      ["Mohammed Sinan", "5 A", "Third"],
      ["Diya Krishna", "5 A", "Participant"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Certificates");
    XLSX.writeFile(wb, "zenithia-certificates-sample.xlsx");
  }, []);

  const onExcel = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBulkMsg(null);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      if (!rows.length) {
        setBulkMsg("The sheet has no data rows.");
        return;
      }
      const keys = Object.keys(rows[0]);
      const find = (re: RegExp) => keys.find((k) => re.test(k.trim().toLowerCase()));
      const nameKey = find(/^name|student/);
      const classKey = find(/^class|std|division|sec/);
      const awardKey = find(/award|prize|position|rank|place/);

      const parsed: BulkRow[] = rows
        .map((r) => ({
          name: String(nameKey ? r[nameKey] : "").trim(),
          klass: String(classKey ? r[classKey] : "").trim(),
          award: normalizeAward(String(awardKey ? r[awardKey] : "")),
        }))
        .filter((r) => r.name);

      if (!parsed.length) {
        setBulkMsg("Could not find a Name column with data.");
        return;
      }
      setBulk(parsed);
      setBulkMsg(`Loaded ${parsed.length} recipient(s). Pick one to preview, or download all.`);
    } catch (err) {
      console.error(err);
      setBulkMsg("Sorry, that file could not be read. Use the template.");
    }
  }, []);

  const loadRow = useCallback((r: BulkRow) => {
    setStudentName(r.name);
    setKlass(r.klass);
    setAward(r.award);
    setIncludePhoto(false);
    setPhoto(null);
    setCitation("");
  }, []);

  const downloadAll = useCallback(async () => {
    if (!bulk.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < bulk.length; i++) {
        const r = bulk[i];
        setProgress(`Generating ${i + 1} of ${bulk.length}: ${r.name}`);
        flushSync(() => {
          setStudentName(r.name);
          setKlass(r.klass);
          setAward(r.award);
          setIncludePhoto(false);
          setPhoto(null);
          setCitation("");
        });
        await sleep(60);
        const dataUrl = await capturePng();
        const a = document.createElement("a");
        a.download = `zenithia-certificate-${String(i + 1).padStart(2, "0")}-${slugify(r.name)}.png`;
        a.href = dataUrl;
        a.click();
        await sleep(140);
      }
      setProgress("All certificates downloaded.");
    } catch (err) {
      console.error(err);
      setProgress("Sorry, something went wrong while generating.");
    } finally {
      setBusy(false);
    }
  }, [bulk, capturePng]);

  const inputCls =
    "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: CERT_CSS }} />

      {/* Controls */}
      <div className="space-y-6">
        {/* Award & design */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Award & design</h2>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-ink/70">Award</span>
            <div className="grid grid-cols-2 gap-2">
              {AWARDS.map((a) => {
                const active = a.id === award;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAward(a.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: a.color }}
                    >
                      {a.badge}
                    </span>
                    <span className="font-medium">{a.participation ? "Participation" : a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Heading <span className="text-ink/40">(optional)</span>
            </span>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder={awardInfo(award).participation ? "of Participation" : "of Achievement"}
              className={inputCls}
            />
          </label>

          <div className="mt-4">
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
                      active ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{d.name}</span>
                    <span className="block text-xs text-ink/50">{d.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Event</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Event / competition name</span>
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. Annual Arts Fest 2026"
              className={inputCls}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Arts / Sports …"
                list="zc-categories"
                className={inputCls}
              />
              <datalist id="zc-categories">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">
                Venue <span className="text-ink/40">(optional)</span>
              </span>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. School Auditorium"
                className={inputCls}
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Date <span className="text-ink/40">(optional)</span>
            </span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g. 10 January 2026"
              className={inputCls}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Custom citation <span className="text-ink/40">(optional — overrides the auto text)</span>
            </span>
            <textarea
              value={citation}
              onChange={(e) => setCitation(e.target.value)}
              rows={2}
              placeholder="Leave blank to auto-write from the award & event."
              className={inputCls}
            />
          </label>
        </div>

        {/* Recipient */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Recipient</h2>
          <div className="mt-4">
            <StudentPicker onPick={fillFromStudent} />
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Student name</span>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Full name"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">
                Class <span className="text-ink/40">(opt.)</span>
              </span>
              <input
                type="text"
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
                placeholder="5 A"
                className={`${inputCls} w-24`}
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink/70">
            <input
              type="checkbox"
              checked={includePhoto}
              onChange={(e) => setIncludePhoto(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Include student photo
          </label>

          {includePhoto && (
            <div className="mt-3 flex items-center gap-3">
              <label className="cursor-pointer rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
                {photo ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </label>
              {photo && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-black/10" />
                  <button type="button" onClick={() => setPhoto(null)} className="text-xs font-medium text-red-600 hover:underline">
                    Remove
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Signatures</h2>
          <p className="mt-1 text-xs text-ink/45">Two signatories appear at the foot of the certificate.</p>

          {([
            { n: sig1Name, sn: setSig1Name, r: sig1Role, sr: setSig1Role, img: sig1Img, simg: setSig1Img, on: onSig1, pick: fillFromSig1, label: "Left signatory" },
            { n: sig2Name, sn: setSig2Name, r: sig2Role, sr: setSig2Role, img: sig2Img, simg: setSig2Img, on: onSig2, pick: fillFromSig2, label: "Right signatory" },
          ] as const).map((s, i) => (
            <div key={i} className="mt-4 rounded-xl border border-black/10 p-3">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ink/45">{s.label}</span>
              <div className="mt-2">
                <SignatoryPicker onPick={s.pick} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="text" value={s.n} onChange={(e) => s.sn(e.target.value)} placeholder="Name" className={inputCls} />
                <input type="text" value={s.r} onChange={(e) => s.sr(e.target.value)} placeholder="Designation" className={inputCls} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
                  {s.img ? "Change signature" : "Upload signature"}
                  <input type="file" accept="image/*" onChange={s.on} className="hidden" />
                </label>
                {s.img && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt="" className="h-8 object-contain" />
                    <button type="button" onClick={() => s.simg(null)} className="text-xs font-medium text-red-600 hover:underline">
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bulk */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Bulk from Excel</h2>
          <p className="mt-1 text-xs text-ink/45">
            Upload a sheet with <strong>Name, Class, Award</strong> (First / Second / Third / Participant). One
            certificate is generated for every row using the event details above.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5"
            >
              Download sample Excel
            </button>
            <label className="cursor-pointer rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
              Upload Excel (.xlsx)
              <input type="file" accept=".xlsx,.xls,.csv" onChange={onExcel} className="hidden" />
            </label>
          </div>
          {bulkMsg && <p className="mt-3 text-xs text-ink/60">{bulkMsg}</p>}
          {bulk.length > 0 && (
            <>
              <div className="mt-3 max-h-40 space-y-1 overflow-auto rounded-lg border border-black/10 p-2">
                {bulk.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => loadRow(r)}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs transition hover:bg-brand/5 ${
                      r.name === studentName ? "bg-brand/10 font-semibold text-brand" : "text-ink/70"
                    }`}
                  >
                    {i + 1}. {r.name} {r.klass ? `· ${r.klass}` : ""} — {awardInfo(r.award).participation ? "Participant" : awardInfo(r.award).label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={downloadAll}
                disabled={busy}
                className="mt-3 w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? "Generating…" : `Download all ${bulk.length} certificates (PNG)`}
              </button>
            </>
          )}
          {progress && <p className="mt-2 text-center text-xs text-ink/60">{progress}</p>}
        </div>

        {/* Single download */}
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Generating…" : "Download certificate (PNG)"}
        </button>
      </div>

      {/* Live preview */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-ink/5 p-4 lg:sticky lg:top-4">
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
            <div ref={certRef}>
              <CertificateCard data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Styles ------------------------------- */

const CERT_CSS = `
.zcert {
  position: relative;
  width: 1200px;
  height: 850px;
  box-sizing: border-box;
  font-family: var(--font-inter), system-ui, sans-serif;
  color: #1c1117;
  overflow: hidden;
}
.zcert * { box-sizing: border-box; }

/* ---- Design 1: Royal Maroon ---- */
.zc1 { background: #ffffff; }
.zc1 .frameA { position: absolute; inset: 26px; border: 3px solid #6E1E3C; border-radius: 4px; }
.zc1 .frameB { position: absolute; inset: 37px; border: 1px solid #C6A875; border-radius: 2px; }

/* ---- Design 2: Elegant Gold ---- */
.zc2 { background: #F4EEE3; }
.zc2 .frameA { position: absolute; inset: 26px; border: 2px solid #C6A875; border-radius: 4px; }
.zc2 .frameB { position: absolute; inset: 35px; border: 4px double #6E1E3C; border-radius: 2px; }

/* ---- Design 3: Islamic Heritage (Arts) ---- */
.zc3 { background: #F6F1E7; }
.zc3 .frameA { position: absolute; inset: 24px; border: 12px solid #6E1E3C; border-radius: 4px; }
.zc3 .frameB { position: absolute; inset: 40px; border: 1.5px solid #C6A875; border-radius: 2px; box-shadow: inset 0 0 0 6px rgba(198,168,117,0.18); }
.zc3 .bgpattern {
  position: absolute; inset: 48px; z-index: 1; opacity: 0.13;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%236E1E3C' stroke-width='1.4'%3E%3Crect x='15' y='15' width='26' height='26'/%3E%3Crect x='15' y='15' width='26' height='26' transform='rotate(45 28 28)'/%3E%3Ccircle cx='28' cy='28' r='4'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}
.zc3 .arch { position: absolute; top: 96px; left: 50%; transform: translateX(-50%); width: 440px; height: 290px; z-index: 1; }
.zc3 .starmark-pos { position: absolute; width: 42px; height: 42px; z-index: 4; }
.zc3 .starmark-pos.tl { top: 60px; left: 60px; }
.zc3 .starmark-pos.tr { top: 60px; right: 60px; }
.zc3 .starmark-pos.bl { bottom: 60px; left: 60px; }
.zc3 .starmark-pos.br { bottom: 60px; right: 60px; }
.zc3 .corner { display: none; }

/* ---- Design 4: Sports Champion ---- */
.zc4 { background: #ffffff; }
.zc4 .frameA { position: absolute; inset: 24px; border: 2.5px solid #6E1E3C; border-radius: 6px; }
.zc4 .frameB { position: absolute; inset: 33px; border: 1px solid #C6A875; border-radius: 4px; }
.zc4 .sportband {
  position: absolute; top: 33px; left: 33px; right: 33px; height: 150px; z-index: 1;
  background:
    radial-gradient(120% 150% at 50% -40%, rgba(198,168,117,0.35) 0%, rgba(198,168,117,0) 60%),
    linear-gradient(180deg, #6E1E3C 0%, #5a1831 100%);
  border-radius: 4px 4px 60% 60% / 4px 4px 38px 38px;
}
.zc4 .corner.tl, .zc4 .corner.tr { display: none; }

/* ---- Design 5: Festive Celebration (Day events) ---- */
.zc5 { background: #FBF7EF; }
.zc5 .frameA { position: absolute; inset: 26px; border: 2px solid #C6A875; border-radius: 10px; }
.zc5 .frameB { position: absolute; inset: 35px; border: 1px dashed rgba(110,30,60,0.5); border-radius: 8px; }
.zc5 .bunting { position: absolute; top: 40px; left: 40px; right: 40px; height: 54px; z-index: 4; }
.zc5 .bgpattern {
  position: absolute; inset: 36px; z-index: 1; opacity: 0.5;
  background-image:
    radial-gradient(circle, #C6A875 2px, transparent 2.5px),
    radial-gradient(circle, rgba(110,30,60,0.5) 2px, transparent 2.5px);
  background-size: 46px 46px, 46px 46px;
  background-position: 0 0, 23px 23px;
  -webkit-mask-image: radial-gradient(circle at 50% 46%, transparent 58%, #000 80%);
  mask-image: radial-gradient(circle at 50% 46%, transparent 58%, #000 80%);
}
.zc5 .corner { width: 40px; height: 40px; }

/* ---- Design 6: Modern Minimal (Quiz / academic) ---- */
.zc6 { background: #ffffff; }
.zc6 .frameA { position: absolute; top: 28px; right: 28px; bottom: 28px; left: 150px; border: 1.5px solid rgba(110,30,60,0.18); border-radius: 4px; }
.zc6 .frameB { display: none; }
.zc6 .sideband {
  position: absolute; top: 0; bottom: 0; left: 0; width: 118px; z-index: 2;
  background: linear-gradient(180deg, #6E1E3C 0%, #5a1831 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset -6px 0 0 #C6A875;
}
.zc6 .sbword {
  writing-mode: vertical-rl; transform: rotate(180deg);
  font-family: var(--font-cinzel), serif; font-weight: 700;
  letter-spacing: 14px; font-size: 30px; color: rgba(255,255,255,0.92);
  text-indent: 14px;
}
.zc6 .corner { display: none; }

/* Decorative layers (shared) */
.bgpattern { display: none; }
.laurel { height: 92px; width: auto; }
.zcert .arch, .zcert .bunting, .zcert .starmark, .zcert .sportband, .zcert .sideband { pointer-events: none; }

.corner {
  position: absolute;
  width: 44px;
  height: 44px;
  z-index: 2;
}
.corner.tl { top: 48px; left: 48px; border-top: 3px solid #C6A875; border-left: 3px solid #C6A875; }
.corner.tr { top: 48px; right: 48px; border-top: 3px solid #C6A875; border-right: 3px solid #C6A875; }
.corner.bl { bottom: 48px; left: 48px; border-bottom: 3px solid #C6A875; border-left: 3px solid #C6A875; }
.corner.br { bottom: 48px; right: 48px; border-bottom: 3px solid #C6A875; border-right: 3px solid #C6A875; }

.cbody {
  position: absolute;
  inset: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 3;
}
.clogo { height: 72px; width: auto; margin-bottom: 4px; }

.ctitle {
  font-family: var(--font-cinzel), serif;
  font-size: 52px;
  font-weight: 800;
  letter-spacing: 10px;
  line-height: 1;
  color: #6E1E3C;
  text-indent: 10px;
}
.csub {
  font-family: var(--font-cinzel), serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 6px;
  color: #b3935a;
  margin-top: 6px;
  text-indent: 6px;
}

.cdivider { display: flex; align-items: center; gap: 14px; margin: 16px 0 8px; }
.dline {
  width: 96px; height: 2px;
  background: linear-gradient(90deg, rgba(198,168,117,0) 0%, #C6A875 100%);
}
.cdivider .dline:last-child {
  background: linear-gradient(90deg, #C6A875 0%, rgba(198,168,117,0) 100%);
}
.dmedal {
  width: 52px; height: 52px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #ffffff;
  font-family: var(--font-cinzel), serif;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 7px rgba(0,0,0,0.22), inset 0 0 0 3px rgba(255,255,255,0.35);
}

.cpresent { font-size: 15px; letter-spacing: 0.6px; color: #6b5b52; margin-top: 8px; }

.cphoto {
  width: 104px; height: 104px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #C6A875;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin: 10px 0 0;
}

.cname {
  font-family: var(--font-signature), cursive;
  font-size: 60px;
  line-height: 1.1;
  color: #6E1E3C;
  margin-top: 6px;
  padding: 0 20px;
}
.cnameline {
  width: 440px; max-width: 72%;
  height: 1px;
  background: #C6A875;
  margin: 6px 0 16px;
}

.cbodytext {
  font-size: 17px;
  line-height: 1.65;
  max-width: 780px;
  color: #2a2128;
}
.cmeta { font-size: 14px; color: #6b5b52; margin-top: 10px; letter-spacing: 0.4px; }

.cfooter {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.sig { width: 250px; text-align: center; }
.sigimg { height: 40px; object-fit: contain; margin: 0 auto 2px; display: block; }
.sigline { border-top: 1.5px solid #1c1117; margin-top: 4px; padding-top: 6px; }
.signame { font-weight: 700; font-size: 14px; color: #1c1117; min-height: 17px; }
.sigrole { font-size: 12px; color: #6b5b52; min-height: 15px; }

.seal {
  width: 92px; height: 92px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #C6A875;
  box-shadow: inset 0 0 0 4px rgba(198,168,117,0.18);
  flex-shrink: 0;
}
.seal img { width: 60px; height: 60px; object-fit: contain; }

/* -------- Per-design body & decoration tweaks -------- */

/* Design 3: Islamic Heritage */
.zc3 .ctitle { letter-spacing: 12px; }
.zc3 .dmedal { box-shadow: 0 2px 7px rgba(0,0,0,0.22), inset 0 0 0 3px rgba(255,255,255,0.45); }
.zc3 .cname { color: #6E1E3C; }

/* Design 4: Sports Champion — header sits on the maroon banner */
.zc4 .sportband { height: 206px; }
.zc4 .clogo { height: 64px; }
.zc4 .ctitle { color: #ffffff; letter-spacing: 12px; }
.zc4 .csub { color: #E6CF9C; }
.zc4 .cdivider { gap: 6px; margin-top: 22px; }
.zc4 .dline { display: none; }
.zc4 .laurel { height: 88px; }
.zc4 .dmedal {
  width: 64px; height: 64px; font-size: 17px;
  box-shadow: 0 3px 9px rgba(0,0,0,0.28), inset 0 0 0 4px rgba(255,255,255,0.4);
}
.zc4 .cname { color: #5a1831; }

/* Design 5: Festive Celebration */
.zc5 .cbody { top: 112px; }
.zc5 .ctitle { color: #6E1E3C; }
.zc5 .cname { color: #b3935a; }
.zc5 .dmedal { box-shadow: 0 2px 7px rgba(0,0,0,0.2), inset 0 0 0 3px rgba(255,255,255,0.4); }

/* Design 6: Modern Minimal — clear the left band */
.zc6 .cbody { left: 176px; right: 60px; align-items: flex-start; text-align: left; }
.zc6 .clogo { margin-bottom: 8px; }
.zc6 .ctitle { font-size: 46px; letter-spacing: 7px; }
.zc6 .cdivider { margin-left: 0; }
.zc6 .cdivider .dline:first-child { display: none; }
.zc6 .cnameline { margin-left: 0; }
.zc6 .cfooter { justify-content: flex-start; gap: 60px; }
.zc6 .sig:first-child { text-align: left; }
.zc6 .seal { margin-left: auto; }
`;
