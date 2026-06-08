"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

/**
 * Letter / certificate generator (admin only).
 *
 * Produce official school documents — Bonafide Certificate, Transfer
 * Certificate (TC), Conduct Certificate, or a free-form letter — on a printed
 * letterhead. Fill the details, the body text is written automatically (or
 * overridden), then download a high-res PNG.
 *
 * Nothing is stored — every document is generated on the fly.
 */

const LOGO = "/brand/logo-full.png";
const SEAL = "/brand/logo-mark.png";

type DocType = "bonafide" | "tc" | "conduct" | "custom";

const DOC_TYPES: { id: DocType; name: string; title: string }[] = [
  { id: "bonafide", name: "Bonafide", title: "BONAFIDE CERTIFICATE" },
  { id: "tc", name: "Transfer (TC)", title: "TRANSFER CERTIFICATE" },
  { id: "conduct", name: "Conduct", title: "CONDUCT CERTIFICATE" },
  { id: "custom", name: "Letter", title: "" },
];

type Gender = "male" | "female";

type LetterData = {
  design: 1 | 2;
  docType: DocType;
  schoolName: string;
  address: string;
  phone: string;
  email: string;

  refNo: string;
  date: string;
  place: string;

  name: string;
  gender: Gender;
  guardian: string;
  motherName: string;
  klass: string;
  admissionNo: string;
  dob: string;
  academicYear: string;
  nationality: string;
  religion: string;
  dateOfAdmission: string;
  dateOfLeaving: string;
  classStudying: string;
  reason: string;
  conduct: string;
  purpose: string;
  qualified: string;
  feesDue: string;

  customTitle: string;
  customBody: string;

  signName: string;
  signRole: string;
  signImg: string | null;
};

function pron(g: Gender) {
  return g === "female"
    ? { sub: "She", subl: "she", pos: "her", child: "daughter", obj: "her" }
    : { sub: "He", subl: "he", pos: "his", child: "son", obj: "him" };
}

function docTitle(d: LetterData): string {
  if (d.docType === "custom") return d.customTitle.trim().toUpperCase();
  return DOC_TYPES.find((t) => t.id === d.docType)?.title ?? "";
}

function bonafideBody(d: LetterData): string {
  const p = pron(d.gender);
  const name = d.name.trim() || "________";
  const guardian = d.guardian.trim() || "________";
  const klass = d.klass.trim() || "____";
  const year = d.academicYear.trim() || "____";
  let s = `This is to certify that ${name}, ${p.child} of ${guardian}`;
  if (d.admissionNo.trim()) s += `, bearing Admission No. ${d.admissionNo.trim()},`;
  s += ` is a bonafide student of this school studying in Class ${klass} during the academic year ${year}.`;
  if (d.dob.trim()) s += ` As per the school records, ${p.pos} date of birth is ${d.dob.trim()}.`;
  s += ` ${p.sub} bears a good moral character and conduct.`;
  const purpose = d.purpose.trim();
  s += ` This certificate is issued ${purpose ? `for the purpose of ${purpose}` : "on request"}.`;
  return s;
}

function conductBody(d: LetterData): string {
  const p = pron(d.gender);
  const name = d.name.trim() || "________";
  const guardian = d.guardian.trim() || "________";
  const klass = d.klass.trim() || "____";
  const year = d.academicYear.trim() || "____";
  const conduct = d.conduct.trim() || "good";
  let s = `This is to certify that ${name}, ${p.child} of ${guardian}, was a student of Class ${klass} in this school during the academic year ${year}.`;
  s += ` During ${p.pos} period of study, ${p.pos} conduct and character were found to be ${conduct}.`;
  s += ` ${p.sub} was sincere and well-behaved in all school activities.`;
  s += ` We wish ${p.obj} all success in ${p.pos} future endeavours.`;
  return s;
}

/* ------------------------------ Document view --------------------------- */

function tcFields(d: LetterData): { n: number; label: string; value: string }[] {
  const p = pron(d.gender);
  return [
    { n: 1, label: "Admission Number", value: d.admissionNo.trim() || "—" },
    { n: 2, label: "Name of the Pupil", value: d.name.trim() || "—" },
    { n: 3, label: "Father's / Guardian's Name", value: d.guardian.trim() || "—" },
    { n: 4, label: "Mother's Name", value: d.motherName.trim() || "—" },
    { n: 5, label: "Nationality", value: d.nationality.trim() || "Indian" },
    { n: 6, label: "Religion", value: d.religion.trim() || "—" },
    { n: 7, label: "Date of Birth", value: d.dob.trim() || "—" },
    { n: 8, label: "Date of Admission", value: d.dateOfAdmission.trim() || "—" },
    { n: 9, label: "Class in which studying", value: d.classStudying.trim() || d.klass.trim() || "—" },
    { n: 10, label: "Date of Leaving the School", value: d.dateOfLeaving.trim() || "—" },
    { n: 11, label: "Reason for Leaving", value: d.reason.trim() || "—" },
    { n: 12, label: "Conduct and Character", value: d.conduct.trim() || "Good" },
    { n: 13, label: "Qualified for Promotion", value: d.qualified.trim() || "Yes" },
    { n: 14, label: "Any Fees Due", value: d.feesDue.trim() || "Nil" },
  ];
}

function LetterDoc({ data }: { data: LetterData }) {
  const d = data.design;
  const title = docTitle(data);

  let body: React.ReactNode = null;
  if (data.docType === "custom") {
    body = (
      <div className="ldbody">
        {data.customBody.trim()
          ? data.customBody.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
          : <p className="ldph">Type the letter content on the left…</p>}
      </div>
    );
  } else if (data.docType === "tc") {
    body = (
      <div className="ldtc">
        <table className="ldtctable">
          <tbody>
            {tcFields(data).map((f) => (
              <tr key={f.n}>
                <td className="ldtcn">{f.n}.</td>
                <td className="ldtclabel">{f.label}</td>
                <td className="ldtcsep">:</td>
                <td className="ldtcval">{f.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ldtcnote">
          Certified that the above particulars are correct as per the records of this institution.
        </p>
      </div>
    );
  } else if (data.docType === "bonafide") {
    body = (
      <div className="ldbody">
        <p>{bonafideBody(data)}</p>
      </div>
    );
  } else {
    body = (
      <div className="ldbody">
        <p>{conductBody(data)}</p>
      </div>
    );
  }

  return (
    <div className={`zletter zl${d}`}>
      <div className="frameA" />

      {/* Letterhead */}
      <div className="ldhead">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ldlogo" src={LOGO} alt={data.schoolName} />
        <div className="ldschool">{data.schoolName}</div>
        <div className="ldcontact">
          {[data.address.trim(), data.phone.trim() ? `Ph: ${data.phone.trim()}` : "", data.email.trim()]
            .filter(Boolean)
            .join("  •  ")}
        </div>
      </div>
      <div className="ldrule" />

      {/* Ref + date */}
      <div className="ldmeta">
        <span>{data.refNo.trim() ? `Ref: ${data.refNo.trim()}` : "\u00A0"}</span>
        <span>{data.date.trim() ? `Date: ${data.date.trim()}` : "\u00A0"}</span>
      </div>

      {title && <div className="ldtitle">{title}</div>}

      {body}

      {/* Signature */}
      <div className="ldsignwrap">
        <div className="ldplace">
          {data.place.trim() && <div>Place: {data.place.trim()}</div>}
          {data.date.trim() && <div>Date: {data.date.trim()}</div>}
        </div>
        <div className="ldsign">
          {data.signImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ldsignimg" src={data.signImg} alt="" />
          )}
          <div className="ldsignline" />
          <div className="ldsignname">{data.signName.trim() || "Principal"}</div>
          <div className="ldsignrole">{data.signRole.trim() || "Principal"}</div>
        </div>
      </div>

      <div className="ldseal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SEAL} alt="" />
      </div>
    </div>
  );
}

/* ------------------------------ Helpers -------------------------------- */

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "document";
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* ------------------------------ Component ------------------------------ */

export default function LetterGenerator({
  schoolName: schoolNameDefault = "Zenithia Global School",
  address: addressDefault = "",
  phone: phoneDefault = "",
  email: emailDefault = "",
}: {
  schoolName?: string;
  address?: string;
  phone?: string;
  email?: string;
}) {
  const [design, setDesign] = useState<1 | 2>(1);
  const [docType, setDocType] = useState<DocType>("bonafide");

  const [schoolName, setSchoolName] = useState(schoolNameDefault);
  const [address, setAddress] = useState(addressDefault);
  const [phone, setPhone] = useState(phoneDefault);
  const [email, setEmail] = useState(emailDefault);

  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");

  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [guardian, setGuardian] = useState("");
  const [motherName, setMotherName] = useState("");
  const [klass, setKlass] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [dob, setDob] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-26");
  const [nationality, setNationality] = useState("Indian");
  const [religion, setReligion] = useState("");
  const [dateOfAdmission, setDateOfAdmission] = useState("");
  const [dateOfLeaving, setDateOfLeaving] = useState("");
  const [classStudying, setClassStudying] = useState("");
  const [reason, setReason] = useState("");
  const [conduct, setConduct] = useState("Good");
  const [purpose, setPurpose] = useState("");
  const [qualified, setQualified] = useState("Yes");
  const [feesDue, setFeesDue] = useState("Nil");

  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");

  const [signName, setSignName] = useState("");
  const [signRole, setSignRole] = useState("Principal");
  const [signImg, setSignImg] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const docRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  const W = 794;
  const H = 1123;

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

  const data: LetterData = useMemo(
    () => ({
      design, docType, schoolName, address, phone, email,
      refNo, date, place,
      name, gender, guardian, motherName, klass, admissionNo, dob, academicYear,
      nationality, religion, dateOfAdmission, dateOfLeaving, classStudying,
      reason, conduct, purpose, qualified, feesDue,
      customTitle, customBody, signName, signRole, signImg,
    }),
    [
      design, docType, schoolName, address, phone, email, refNo, date, place,
      name, gender, guardian, motherName, klass, admissionNo, dob, academicYear,
      nationality, religion, dateOfAdmission, dateOfLeaving, classStudying,
      reason, conduct, purpose, qualified, feesDue, customTitle, customBody,
      signName, signRole, signImg,
    ],
  );

  const onSign = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setSignImg(await fileToDataUrl(f));
  }, []);

  const capturePng = useCallback(async () => {
    const node = docRef.current;
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
    const opts = { pixelRatio: 3, backgroundColor: "#ffffff" };
    await toPng(node, opts);
    return toPng(node, opts);
  }, []);

  const onDownload = useCallback(async () => {
    setBusy(true);
    try {
      const dataUrl = await capturePng();
      const a = document.createElement("a");
      a.download = `zenithia-${docType}-${slugify(name)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the document could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [capturePng, docType, name]);

  const inputCls =
    "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  const isTc = docType === "tc";
  const isCustom = docType === "custom";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: LETTER_CSS }} />

      {/* Controls */}
      <div className="space-y-6">
        {/* Document type & design */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Document & design</h2>
          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-ink/70">Document type</span>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocType(t.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    docType === t.id ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium text-ink/70">Letterhead style</span>
            <div className="grid grid-cols-2 gap-2">
              {([{ id: 1, n: "Classic" }, { id: 2, n: "Bordered" }] as const).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDesign(s.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    design === s.id ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-black/15 hover:bg-black/5"
                  }`}
                >
                  {s.n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Letterhead details */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Letterhead</h2>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">School name</span>
            <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={inputCls} />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Address</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, District, PIN" className={inputCls} />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Phone</span>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Email</span>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Ref No.</span>
              <input type="text" value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="ZGS/2026/045" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Date</span>
              <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="08 June 2026" className={inputCls} />
            </label>
          </div>
        </div>

        {/* Custom letter body */}
        {isCustom ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl text-brand">Letter content</h2>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Title / subject</span>
              <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. To Whomsoever It May Concern" className={inputCls} />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Body (blank line = new paragraph)</span>
              <textarea value={customBody} onChange={(e) => setCustomBody(e.target.value)} rows={8} placeholder="Write the letter here…" className={inputCls} />
            </label>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="font-display text-xl text-brand">Student details</h2>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Student name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Gender</span>
                <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={`${inputCls} w-28`}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Father / Guardian</span>
                <input type="text" value={guardian} onChange={(e) => setGuardian(e.target.value)} placeholder="Guardian name" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Class</span>
                <input type="text" value={klass} onChange={(e) => setKlass(e.target.value)} placeholder="6 B" className={inputCls} />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Admission No.</span>
                <input type="text" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} placeholder="ZGS-2026-118" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Date of Birth</span>
                <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} placeholder="07-08-2014" className={inputCls} />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Academic year</span>
              <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-26" className={inputCls} />
            </label>

            {docType === "bonafide" && (
              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Purpose <span className="text-ink/40">(optional)</span></span>
                <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="bank account opening / scholarship …" className={inputCls} />
              </label>
            )}

            {docType === "conduct" && (
              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Conduct</span>
                <input type="text" value={conduct} onChange={(e) => setConduct(e.target.value)} placeholder="excellent / good / satisfactory" className={inputCls} />
              </label>
            )}

            {isTc && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Mother&apos;s name</span>
                    <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Religion</span>
                    <input type="text" value={religion} onChange={(e) => setReligion(e.target.value)} className={inputCls} />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Nationality</span>
                    <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Class studying</span>
                    <input type="text" value={classStudying} onChange={(e) => setClassStudying(e.target.value)} placeholder="6 B" className={inputCls} />
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Date of admission</span>
                    <input type="text" value={dateOfAdmission} onChange={(e) => setDateOfAdmission(e.target.value)} placeholder="01-06-2022" className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Date of leaving</span>
                    <input type="text" value={dateOfLeaving} onChange={(e) => setDateOfLeaving(e.target.value)} placeholder="31-03-2026" className={inputCls} />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-ink/70">Reason for leaving</span>
                  <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At parent's request / relocation" className={inputCls} />
                </label>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Conduct</span>
                    <input type="text" value={conduct} onChange={(e) => setConduct(e.target.value)} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Promotion</span>
                    <input type="text" value={qualified} onChange={(e) => setQualified(e.target.value)} className={inputCls} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-ink/70">Fees due</span>
                    <input type="text" value={feesDue} onChange={(e) => setFeesDue(e.target.value)} className={inputCls} />
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* Signatory */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Signatory & place</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Name <span className="text-ink/40">(optional)</span></span>
              <input type="text" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="Dr. Shameer Babu" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Designation</span>
              <input type="text" value={signRole} onChange={(e) => setSignRole(e.target.value)} placeholder="Principal" className={inputCls} />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Place <span className="text-ink/40">(optional)</span></span>
            <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Kozhikode" className={inputCls} />
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

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          className="w-full rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Generating…" : "Download document (PNG)"}
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
            <div ref={docRef}>
              <LetterDoc data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Styles ------------------------------- */

const LETTER_CSS = `
.zletter {
  position: relative;
  width: 794px;
  height: 1123px;
  box-sizing: border-box;
  background: #ffffff;
  font-family: var(--font-inter), system-ui, sans-serif;
  color: #1c1117;
  overflow: hidden;
}
.zletter * { box-sizing: border-box; }

.ldhead { position: relative; z-index: 2; text-align: center; }
.ldlogo { height: 78px; width: auto; object-fit: contain; margin: 0 auto 10px; display: block; }
.ldschool { font-family: var(--font-cinzel), serif; font-weight: 700; font-size: 32px; color: #6E1E3C; letter-spacing: 0.5px; }
.ldcontact { font-size: 13.5px; color: #4a4047; margin-top: 7px; }
.ldrule { position: relative; z-index: 2; height: 3px; background: linear-gradient(90deg, #6E1E3C, #C6A875, #6E1E3C); margin: 16px 0 0; border-radius: 2px; }

.ldmeta { position: relative; z-index: 2; display: flex; justify-content: space-between; font-size: 15px; font-weight: 600; margin-top: 22px; }

.ldtitle {
  position: relative; z-index: 2; text-align: center; font-weight: 800;
  font-size: 23px; letter-spacing: 2px; color: #6E1E3C; margin-top: 26px;
  text-decoration: underline; text-underline-offset: 6px; text-decoration-color: #C6A875;
}

.ldbody { position: relative; z-index: 2; margin-top: 30px; font-size: 18px; line-height: 2.05; text-align: justify; }
.ldbody p { margin: 0 0 18px; }
.ldph { color: #aaa; font-style: italic; }

.ldtc { position: relative; z-index: 2; margin-top: 26px; }
.ldtctable { width: 100%; border-collapse: collapse; font-size: 16.5px; }
.ldtctable td { padding: 7px 4px; vertical-align: top; }
.ldtcn { width: 30px; color: #6E1E3C; font-weight: 700; }
.ldtclabel { width: 290px; font-weight: 600; color: #3a3137; }
.ldtcsep { width: 18px; }
.ldtcval { font-weight: 600; border-bottom: 1px dotted #b9aea5; }
.ldtcnote { margin-top: 22px; font-size: 16.5px; line-height: 1.9; font-style: italic; }

.ldsignwrap { position: absolute; z-index: 2; left: 64px; right: 64px; bottom: 96px; display: flex; align-items: flex-end; justify-content: space-between; }
.ldplace { font-size: 15px; font-weight: 600; line-height: 1.7; }
.ldsign { text-align: center; }
.ldsignimg { height: 52px; object-fit: contain; display: block; margin: 0 auto -4px; }
.ldsignline { width: 210px; border-top: 1.5px solid #1c1117; margin-bottom: 6px; }
.ldsignname { font-size: 16px; font-weight: 700; }
.ldsignrole { font-size: 14px; color: #4a4047; }

.ldseal { position: absolute; z-index: 1; opacity: 0.05; left: 50%; top: 54%; transform: translate(-50%, -50%); pointer-events: none; }
.ldseal img { width: 420px; height: 420px; object-fit: contain; }

/* ---- Classic ---- */
.zl1 { padding: 56px 64px; }
.zl1 .frameA { display: none; }

/* ---- Bordered ---- */
.zl2 { padding: 64px 72px; }
.zl2 .frameA { position: absolute; inset: 24px; border: 2px solid #6E1E3C; border-radius: 4px; z-index: 0; }
.zl2 .frameA::after { content: ""; position: absolute; inset: 6px; border: 1px solid #C6A875; border-radius: 2px; }
`;
