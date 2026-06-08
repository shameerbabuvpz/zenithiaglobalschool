"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";

/**
 * ID card maker / downloader (admin only).
 *
 * Generate student and staff identity cards. Fill the details, add a photo,
 * choose a design, then download a high-res PNG. Bulk mode: upload an Excel
 * sheet and one card is generated for every row.
 *
 * Nothing is stored — every card is generated on the fly.
 */

const LOGO = "/brand/logo-full.png";
const WHITE_LOGO = "/brand/logo-full-white.png";
const SEAL = "/brand/logo-mark.png";

type CardType = "student" | "staff";
type DesignId = 1 | 2 | 3;

const DESIGNS: { id: DesignId; name: string; hint: string }[] = [
  { id: 1, name: "Maroon Classic", hint: "Maroon header & footer band" },
  { id: 2, name: "Gold Elegant", hint: "Cream with gold double frame" },
  { id: 3, name: "Modern Band", hint: "Maroon side accent — minimal" },
];

const CARD_BG: Record<DesignId, string> = {
  1: "#FFFFFF",
  2: "#F6F1E7",
  3: "#FFFFFF",
};

type IdData = {
  design: DesignId;
  cardType: CardType;
  schoolName: string;
  address: string;
  phone: string;
  name: string;
  role: string; // Class (student) or Designation (staff)
  idNo: string; // Admission No / Staff ID
  dob: string;
  blood: string;
  contact: string; // student: guardian/parent phone, staff: phone
  guardian: string; // student only: parent/guardian name
  address2: string; // residential address
  validTill: string;
  photo: string | null;
  signName: string;
  signImg: string | null;
};

/* ------------------------------ Card view ------------------------------ */

function IdCard({ data }: { data: IdData }) {
  const d = data.design;
  const isStudent = data.cardType === "student";
  const roleLabel = isStudent ? "Class" : "Designation";
  const idLabel = isStudent ? "Admission No" : "Staff ID";

  const rows: { label: string; value: string }[] = [];
  if (data.role.trim()) rows.push({ label: roleLabel, value: data.role.trim() });
  if (data.idNo.trim()) rows.push({ label: idLabel, value: data.idNo.trim() });
  if (data.dob.trim()) rows.push({ label: "Date of Birth", value: data.dob.trim() });
  if (data.blood.trim()) rows.push({ label: "Blood Group", value: data.blood.trim() });
  if (isStudent && data.guardian.trim()) rows.push({ label: "Guardian", value: data.guardian.trim() });
  if (data.contact.trim()) rows.push({ label: "Contact", value: data.contact.trim() });
  if (data.address2.trim()) rows.push({ label: "Address", value: data.address2.trim() });

  const logoSrc = d === 1 ? WHITE_LOGO : LOGO;

  return (
    <div className={`zid zid${d}`}>
      <div className="frameA" />

      <div className="idhead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="idlogo" src={logoSrc} alt={data.schoolName} />
        <div className="idhtext">
          <div className="idschool">{data.schoolName}</div>
          {data.address.trim() && <div className="idaddr">{data.address.trim()}</div>}
        </div>
      </div>

      <div className="idtypebar">{isStudent ? "STUDENT IDENTITY CARD" : "STAFF IDENTITY CARD"}</div>

      <div className="idphoto">
        {data.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photo} alt={data.name} />
        ) : (
          <span className="idphotoph">PHOTO</span>
        )}
      </div>

      <div className="idname">{data.name || "Full Name"}</div>

      <div className="idrows">
        {rows.map((r, i) => (
          <div className="idrow" key={i}>
            <span className="idlabel">{r.label}</span>
            <span className="idcolon">:</span>
            <span className="idvalue">{r.value}</span>
          </div>
        ))}
      </div>

      <div className="idfoot">
        <div className="idvalid">{data.validTill.trim() ? `Valid till ${data.validTill.trim()}` : "\u00A0"}</div>
        <div className="idsign">
          {data.signImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="idsignimg" src={data.signImg} alt="" />
          )}
          <div className="idsignline" />
          <div className="idsignrole">{data.signName.trim() || "Principal"}</div>
        </div>
      </div>

      <div className="idseal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SEAL} alt="" />
      </div>
    </div>
  );
}

/* ------------------------------ Helpers -------------------------------- */

function slugify(s: string) {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "id-card"
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

type BulkRow = {
  name: string;
  role: string;
  idNo: string;
  dob: string;
  blood: string;
  contact: string;
  guardian: string;
  address2: string;
};

/* ------------------------------ Component ------------------------------ */

export default function IdCardMaker({
  schoolName: schoolNameDefault = "Zenithia Global School",
  address: addressDefault = "",
  phone: phoneDefault = "",
}: {
  schoolName?: string;
  address?: string;
  phone?: string;
}) {
  const [design, setDesign] = useState<DesignId>(1);
  const [cardType, setCardType] = useState<CardType>("student");

  const [schoolName, setSchoolName] = useState(schoolNameDefault);
  const [address, setAddress] = useState(addressDefault);
  const [phone] = useState(phoneDefault);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [idNo, setIdNo] = useState("");
  const [dob, setDob] = useState("");
  const [blood, setBlood] = useState("");
  const [contact, setContact] = useState("");
  const [guardian, setGuardian] = useState("");
  const [address2, setAddress2] = useState("");
  const [validTill, setValidTill] = useState("2026-27");
  const [photo, setPhoto] = useState<string | null>(null);

  const [signName, setSignName] = useState("Principal");
  const [signImg, setSignImg] = useState<string | null>(null);

  const [bulk, setBulk] = useState<BulkRow[]>([]);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  const W = 640;
  const H = 1010;

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

  const data: IdData = useMemo(
    () => ({
      design,
      cardType,
      schoolName,
      address,
      phone,
      name,
      role,
      idNo,
      dob,
      blood,
      contact,
      guardian,
      address2,
      validTill,
      photo,
      signName,
      signImg,
    }),
    [
      design, cardType, schoolName, address, phone, name, role, idNo, dob, blood,
      contact, guardian, address2, validTill, photo, signName, signImg,
    ],
  );

  const onPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(await fileToDataUrl(f));
  }, []);

  const onSign = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSignImg(await fileToDataUrl(f));
  }, []);

  /* ----------------------------- Capture ----------------------------- */
  const capturePng = useCallback(async () => {
    const node = cardRef.current;
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
    const opts = { pixelRatio: 3, backgroundColor: CARD_BG[design] };
    await toPng(node, opts);
    return toPng(node, opts);
  }, [design]);

  const onDownload = useCallback(async () => {
    setBusy(true);
    try {
      const dataUrl = await capturePng();
      const a = document.createElement("a");
      a.download = `zenithia-id-${slugify(name)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the card could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [capturePng, name]);

  /* ------------------------------- Bulk ------------------------------- */
  const downloadTemplate = useCallback(() => {
    const student = [
      ["Name", "Class", "Admission No", "Date of Birth", "Blood Group", "Guardian", "Contact", "Address"],
      ["Aaron Thomas", "5 A", "ZGS-2026-101", "12-03-2015", "B+", "Mr. Thomas John", "98470 11111", "Kozhikode"],
      ["Fathima Rishana", "6 B", "ZGS-2026-118", "07-08-2014", "O+", "Mr. Abdul Rahman", "98470 22222", "Malappuram"],
      ["Mohammed Sinan", "4 A", "ZGS-2026-094", "21-11-2016", "A+", "Mr. Salim K", "98470 33333", "Wayanad"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(student);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ID Cards");
    XLSX.writeFile(wb, "zenithia-id-cards-sample.xlsx");
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
      const nameKey = find(/^name|student|staff/);
      const roleKey = find(/^class|designation|std|division|sec|post|role/);
      const idKey = find(/admission|staff\s*id|id\s*no|^id|adm|reg/);
      const dobKey = find(/birth|dob/);
      const bloodKey = find(/blood/);
      const guardianKey = find(/guardian|parent|father|mother/);
      const contactKey = find(/contact|phone|mobile|number/);
      const addrKey = find(/address|place|town|city|residence/);

      const parsed: BulkRow[] = rows
        .map((r) => ({
          name: String(nameKey ? r[nameKey] : "").trim(),
          role: String(roleKey ? r[roleKey] : "").trim(),
          idNo: String(idKey ? r[idKey] : "").trim(),
          dob: String(dobKey ? r[dobKey] : "").trim(),
          blood: String(bloodKey ? r[bloodKey] : "").trim(),
          guardian: String(guardianKey ? r[guardianKey] : "").trim(),
          contact: String(contactKey ? r[contactKey] : "").trim(),
          address2: String(addrKey ? r[addrKey] : "").trim(),
        }))
        .filter((r) => r.name);

      if (!parsed.length) {
        setBulkMsg("Could not find a Name column with data.");
        return;
      }
      setBulk(parsed);
      setBulkMsg(`Loaded ${parsed.length} card(s). Pick one to preview, or download all.`);
    } catch (err) {
      console.error(err);
      setBulkMsg("Sorry, that file could not be read. Use the sample.");
    }
  }, []);

  const applyRow = useCallback((r: BulkRow) => {
    setName(r.name);
    setRole(r.role);
    setIdNo(r.idNo);
    setDob(r.dob);
    setBlood(r.blood);
    setGuardian(r.guardian);
    setContact(r.contact);
    setAddress2(r.address2);
    setPhoto(null);
  }, []);

  const downloadAll = useCallback(async () => {
    if (!bulk.length) return;
    setBusy(true);
    try {
      for (let i = 0; i < bulk.length; i++) {
        const r = bulk[i];
        setProgress(`Generating ${i + 1} of ${bulk.length}: ${r.name}`);
        flushSync(() => {
          setName(r.name);
          setRole(r.role);
          setIdNo(r.idNo);
          setDob(r.dob);
          setBlood(r.blood);
          setGuardian(r.guardian);
          setContact(r.contact);
          setAddress2(r.address2);
          setPhoto(null);
        });
        await sleep(60);
        const dataUrl = await capturePng();
        const a = document.createElement("a");
        a.download = `zenithia-id-${String(i + 1).padStart(2, "0")}-${slugify(r.name)}.png`;
        a.href = dataUrl;
        a.click();
        await sleep(140);
      }
      setProgress("All cards downloaded.");
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
      <style dangerouslySetInnerHTML={{ __html: ID_CSS }} />

      {/* Controls */}
      <div className="space-y-6">
        {/* Type & design */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Card type & design</h2>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-ink/70">Card type</span>
            <div className="grid grid-cols-2 gap-2">
              {(["student", "staff"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardType(t)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${
                    cardType === t ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-ink/70">Design</span>
            <div className="grid grid-cols-1 gap-2">
              {DESIGNS.map((dz) => {
                const active = dz.id === design;
                return (
                  <button
                    key={dz.id}
                    type="button"
                    onClick={() => setDesign(dz.id)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${
                      active ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">{dz.name}</span>
                    <span className="block text-xs text-ink/50">{dz.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* School */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">School header</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">School name</span>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={inputCls} />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Address line <span className="text-ink/40">(optional)</span>
            </span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, District" className={inputCls} />
          </label>
        </div>

        {/* Holder */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Card holder</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Full name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">{cardType === "student" ? "Class" : "Designation"}</span>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder={cardType === "student" ? "5 A" : "Teacher"} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">{cardType === "student" ? "Admission No" : "Staff ID"}</span>
              <input type="text" value={idNo} onChange={(e) => setIdNo(e.target.value)} placeholder="ZGS-2026-101" className={inputCls} />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Date of Birth</span>
              <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="12-03-2015" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Blood Group</span>
              <input type="text" value={blood} onChange={(e) => setBlood(e.target.value)} placeholder="B+" className={inputCls} />
            </label>
          </div>
          {cardType === "student" && (
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Guardian / Parent</span>
              <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="Parent name" className={inputCls} />
            </label>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Contact</span>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="98470 00000" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Valid till</span>
              <input type="text" value={validTill} onChange={(e) => setValidTill(e.target.value)} placeholder="2026-27" className={inputCls} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">
              Address <span className="text-ink/40">(optional)</span>
            </span>
            <input type="text" value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Town / Village" className={inputCls} />
          </label>

          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
              {photo ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
            {photo && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-12 w-12 rounded object-cover ring-1 ring-black/10" />
                <button type="button" onClick={() => setPhoto(null)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Signature */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Signatory</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Name / role under the line</span>
            <input type="text" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="Principal" className={inputCls} />
          </label>
          <div className="mt-3 flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
              {signImg ? "Change signature" : "Upload signature"}
              <input type="file" accept="image/*" onChange={onSign} className="hidden" />
            </label>
            {signImg && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signImg} alt="" className="h-8 object-contain" />
                <button type="button" onClick={() => setSignImg(null)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bulk */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Bulk from Excel</h2>
          <p className="mt-1 text-xs text-ink/45">
            Upload a sheet with <strong>Name, Class, Admission No, DOB, Blood Group, Guardian, Contact, Address</strong>.
            One card is generated for every row. Photos are added individually.
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
                    onClick={() => applyRow(r)}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs transition hover:bg-brand/5 ${
                      r.name === name ? "bg-brand/10 font-semibold text-brand" : "text-ink/70"
                    }`}
                  >
                    {i + 1}. {r.name} {r.role ? `· ${r.role}` : ""} {r.idNo ? `· ${r.idNo}` : ""}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={downloadAll}
                disabled={busy}
                className="mt-3 w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? "Generating…" : `Download all ${bulk.length} cards (PNG)`}
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
          {busy ? "Generating…" : "Download ID card (PNG)"}
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
            <div ref={cardRef}>
              <IdCard data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Styles ------------------------------- */

const ID_CSS = `
.zid {
  position: relative;
  width: 640px;
  height: 1010px;
  box-sizing: border-box;
  font-family: var(--font-inter), system-ui, sans-serif;
  color: #1c1117;
  overflow: hidden;
}
.zid * { box-sizing: border-box; }

.idhead { position: relative; z-index: 2; display: flex; align-items: center; gap: 16px; }
.idlogo { height: 60px; width: auto; object-fit: contain; }
.idhtext { line-height: 1.15; }
.idschool { font-family: var(--font-cinzel), serif; font-weight: 700; font-size: 24px; letter-spacing: 0.5px; }
.idaddr { font-size: 13px; opacity: 0.8; margin-top: 3px; }

.idtypebar {
  position: relative; z-index: 2; text-align: center; font-weight: 700;
  font-size: 16px; letter-spacing: 3px;
}

.idphoto {
  position: relative; z-index: 2; margin: 0 auto;
  width: 220px; height: 268px; border-radius: 10px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #f1ece6;
}
.idphoto img { width: 100%; height: 100%; object-fit: cover; }
.idphotoph { font-size: 18px; font-weight: 600; letter-spacing: 4px; color: #b6a99b; }

.idname {
  position: relative; z-index: 2; text-align: center; font-weight: 800;
  font-size: 30px; letter-spacing: 0.4px; color: #6E1E3C;
}

.idrows { position: relative; z-index: 2; }
.idrow { display: flex; align-items: baseline; font-size: 18px; line-height: 1.9; }
.idlabel { width: 168px; flex: none; font-weight: 600; color: #574b50; }
.idcolon { width: 16px; flex: none; }
.idvalue { flex: 1; font-weight: 600; }

.idfoot { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; }
.idvalid { font-size: 15px; font-weight: 600; color: #6E1E3C; }
.idsign { text-align: center; }
.idsignimg { height: 46px; object-fit: contain; display: block; margin: 0 auto -2px; }
.idsignline { width: 168px; border-top: 1.5px solid #1c1117; margin-bottom: 4px; }
.idsignrole { font-size: 14px; font-weight: 600; }

.idseal {
  position: absolute; z-index: 1; opacity: 0.06; pointer-events: none;
  left: 50%; top: 56%; transform: translate(-50%, -50%);
}
.idseal img { width: 320px; height: 320px; object-fit: contain; }

/* ---- Design 1: Maroon Classic ---- */
.zid1 { background: #ffffff; padding: 0 40px 36px; }
.zid1 .frameA { position: absolute; inset: 10px; border: 2px solid #C6A875; border-radius: 14px; z-index: 0; }
.zid1 .idhead {
  margin: 0 -40px; padding: 26px 40px 22px;
  background: linear-gradient(135deg, #6E1E3C, #5a1831);
  color: #fff; border-radius: 0;
}
.zid1 .idschool { color: #fff; }
.zid1 .idtypebar {
  margin: 0 -40px 26px; padding: 9px 0;
  background: #C6A875; color: #3a2417;
}
.zid1 .idphoto { border: 4px solid #6E1E3C; box-shadow: 0 6px 18px rgba(110,30,60,0.18); }
.zid1 .idname { margin-top: 18px; }
.zid1 .idrows { margin-top: 18px; padding: 0 8px; }
.zid1 .idfoot { margin-top: 30px; padding: 0 8px; }

/* ---- Design 2: Gold Elegant ---- */
.zid2 { background: #F6F1E7; padding: 0 44px 40px; }
.zid2 .frameA { position: absolute; inset: 16px; border: 2px solid #6E1E3C; border-radius: 6px; z-index: 0; }
.zid2 .frameA::after {
  content: ""; position: absolute; inset: 6px; border: 1px solid #C6A875; border-radius: 3px;
}
.zid2 .idhead { justify-content: center; text-align: center; flex-direction: column; gap: 8px; margin-top: 40px; }
.zid2 .idlogo { height: 66px; }
.zid2 .idschool { color: #6E1E3C; }
.zid2 .idtypebar {
  margin: 16px auto 26px; padding: 7px 26px; width: max-content;
  border-top: 1.5px solid #C6A875; border-bottom: 1.5px solid #C6A875; color: #6E1E3C;
}
.zid2 .idphoto { border: 3px solid #C6A875; box-shadow: 0 0 0 1px #6E1E3C; }
.zid2 .idname { margin-top: 18px; }
.zid2 .idrows { margin-top: 18px; padding: 0 14px; }
.zid2 .idfoot { margin-top: 30px; padding: 0 14px; }

/* ---- Design 3: Modern Band ---- */
.zid3 { background: #ffffff; padding: 0 40px 36px 76px; }
.zid3 .frameA { position: absolute; left: 0; top: 0; bottom: 0; width: 44px; background: linear-gradient(180deg, #6E1E3C, #5a1831); z-index: 0; }
.zid3 .idhead { margin-top: 32px; }
.zid3 .idschool { color: #6E1E3C; }
.zid3 .idtypebar {
  margin: 18px 0 26px; padding: 8px 0; text-align: left;
  border-bottom: 3px solid #6E1E3C; color: #6E1E3C; letter-spacing: 2px;
}
.zid3 .idphoto { margin: 0; border: 3px solid #6E1E3C; border-radius: 8px; }
.zid3 .idname { text-align: left; margin-top: 18px; }
.zid3 .idrows { margin-top: 14px; }
.zid3 .idrow { font-size: 17px; }
.zid3 .idlabel { width: 150px; }
.zid3 .idfoot { margin-top: 30px; }
`;
