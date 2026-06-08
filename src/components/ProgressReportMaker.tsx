"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import {
  listStaffAction,
  saveStaffAction,
  deleteStaffAction,
  type StudentDTO,
} from "@/lib/actions";
import StudentPicker from "@/components/admin/StudentPicker";

/**
 * Progress Report card maker (admin only).
 *
 * Pick a grade (A+ … D) for each subject and the card shows the grade +
 * an automatic remark. Only the subjects that have a grade appear on the
 * card. Pick the exam (Monthly / First–Third Term / Annual), add the
 * student's details and an optional photo, then download a high-res PNG.
 * A class-teacher signature is rendered in a handwriting font.
 *
 * Bulk mode: upload an Excel sheet (Name, Class, Roll + one grade column
 * per subject) and a card is generated and downloaded for every student.
 */

/* ------------------------------- Grades -------------------------------- */

type Grade = { grade: string; remark: string; tier: number };

// Grades are entered directly (no marks). Each grade carries a remark, a
// colour tier and a point used to average the overall grade.
const GRADE_LIST: { grade: string; remark: string; tier: number; point: number }[] = [
  { grade: "A+", remark: "Outstanding", tier: 5, point: 8 },
  { grade: "A", remark: "Excellent", tier: 5, point: 7 },
  { grade: "B+", remark: "Very Good", tier: 4, point: 6 },
  { grade: "B", remark: "Good", tier: 4, point: 5 },
  { grade: "C+", remark: "Above Average", tier: 3, point: 4 },
  { grade: "C", remark: "Average", tier: 3, point: 3 },
  { grade: "D+", remark: "Satisfactory", tier: 2, point: 2 },
  { grade: "D", remark: "Needs Improvement", tier: 2, point: 1 },
];

const GRADE_VALUES = GRADE_LIST.map((g) => g.grade);

function normalizeGrade(raw: string): string {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  return GRADE_VALUES.includes(s) ? s : "";
}

function gradeInfo(grade: string): Grade | null {
  const g = GRADE_LIST.find((x) => x.grade === grade);
  return g ? { grade: g.grade, remark: g.remark, tier: g.tier } : null;
}

/* ------------------------------- Exams --------------------------------- */

type ExamId = "monthly" | "term1" | "term2" | "term3" | "annual";

const EXAM_TYPES: { id: ExamId; label: string; ml: string }[] = [
  { id: "monthly", label: "Monthly Test", ml: "മന്ത്‌ലി ടെസ്റ്റ്" },
  { id: "term1", label: "First Term Examination", ml: "ഒന്നാം ടേം പരീക്ഷ" },
  { id: "term2", label: "Second Term Examination", ml: "രണ്ടാം ടേം പരീക്ഷ" },
  { id: "term3", label: "Third Term Examination", ml: "മൂന്നാം ടേം പരീക്ഷ" },
  { id: "annual", label: "Annual Examination", ml: "വാർഷിക പരീക്ഷ" },
];

/* ------------------------------ Designs -------------------------------- */

type DesignId = 1 | 2;

const DESIGNS: { id: DesignId; name: string; hint: string }[] = [
  { id: 1, name: "Classic Maroon", hint: "Maroon header, ruled table" },
  { id: 2, name: "Elegant Gold", hint: "Framed cream, gold accents" },
];

const REPORT_BG: Record<DesignId, string> = { 1: "#FFFFFF", 2: "#F4EEE3" };

const WHITE_LOGO = "/brand/logo-full-white.png";
const DARK_LOGO = "/brand/logo-full.png";
const TAGLINE = "Knowledge · Character · Excellence";
const DOMAIN = "www.zenithiaglobalschool.com";

const DEFAULT_SUBJECTS = [
  "English",
  "Malayalam",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Science",
  "General Knowledge",
  "Computer Science",
  "EBS",
  "Lisani",
  "Thilawath",
  "Hifd",
];

type StaffPreset = { id: string; name: string; signature: string | null };

const CLASS_OPTIONS = [
  "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

/* ------------------------------ Data types ----------------------------- */

type Subject = { name: string; grade: string };

type ReportData = {
  design: DesignId;
  exam: ExamId;
  year: string;
  studentName: string;
  klass: string;
  roll: string;
  photo: string | null;
  subjects: Subject[];
  teacher: string;
  teacherSig: string | null;
  principal: string;
  principalSig: string | null;
  date: string;
};

type GradedRow = { name: string; grade: string; remark: string; tier: number };

function gradedRows(subjects: Subject[]): GradedRow[] {
  const rows: GradedRow[] = [];
  for (const s of subjects) {
    const g = gradeInfo(normalizeGrade(s.grade));
    if (!s.name.trim() || !g) continue;
    rows.push({ name: s.name.trim(), grade: g.grade, remark: g.remark, tier: g.tier });
  }
  return rows;
}

function overallGrade(subjects: Subject[]): Grade | null {
  const points: number[] = [];
  for (const s of subjects) {
    if (!s.name.trim()) continue;
    const entry = GRADE_LIST.find((x) => x.grade === normalizeGrade(s.grade));
    if (entry) points.push(entry.point);
  }
  if (!points.length) return null;
  const avg = points.reduce((a, b) => a + b, 0) / points.length;
  const rounded = Math.round(avg);
  const best = GRADE_LIST.reduce(
    (b, x) => (Math.abs(x.point - rounded) < Math.abs(b.point - rounded) ? x : b),
    GRADE_LIST[0],
  );
  return { grade: best.grade, remark: best.remark, tier: best.tier };
}

/* ------------------------------ Card view ------------------------------ */

function ExamLabel({ exam }: { exam: ExamId }) {
  const e = EXAM_TYPES.find((x) => x.id === exam) ?? EXAM_TYPES[0];
  return <>{e.label}</>;
}

function ReportCard({ data }: { data: ReportData }) {
  const rows = gradedRows(data.subjects);
  const overall = overallGrade(data.subjects);
  const logo = data.design === 1 ? WHITE_LOGO : DARK_LOGO;

  return (
    <div className={`zreport zr${data.design}`}>
      <div className="frame1" />
      <div className="frame2" />

      <div className="head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="Zenithia Global School" />
        <div className="rtitle">PROGRESS REPORT CARD</div>
        <div className="rsub">
          <ExamLabel exam={data.exam} />
          {data.year ? ` · ${data.year}` : ""}
        </div>
      </div>

      <div className="body">
        {/* Student strip */}
        <div className="student">
          <div className="photo">
            {data.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.photo} alt={data.studentName || "Student"} />
            ) : (
              <span className="ph">PHOTO</span>
            )}
          </div>
          <div className="sinfo">
            <div className="row">
              <span className="lbl">Name</span>
              <span className="val name">{data.studentName || "—"}</span>
            </div>
            <div className="grid2">
              <div className="row">
                <span className="lbl">Class</span>
                <span className="val">{data.klass || "—"}</span>
              </div>
              <div className="row">
                <span className="lbl">Roll No</span>
                <span className="val">{data.roll || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Marks table → grades only */}
        <table className="rtable">
          <thead>
            <tr>
              <th className="cno">#</th>
              <th className="csub">Subject</th>
              <th className="cgr">Grade</th>
              <th className="crm">Remark</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r, i) => (
                <tr key={i}>
                  <td className="cno">{i + 1}</td>
                  <td className="csub">{r.name}</td>
                  <td className="cgr">
                    <span className={`gbadge t${r.tier}`}>{r.grade}</span>
                  </td>
                  <td className="crm">{r.remark}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="cno">1</td>
                <td className="csub ghost">Subject</td>
                <td className="cgr">
                  <span className="gbadge t5">A+</span>
                </td>
                <td className="crm ghost">Outstanding</td>
              </tr>
            )}
          </tbody>
        </table>

        {overall ? (
          <div className="overall">
            <span className="olbl">Overall Grade</span>
            <span className={`obadge t${overall.tier}`}>{overall.grade}</span>
            <span className="orem">{overall.remark}</span>
          </div>
        ) : null}

        {/* Signatures */}
        <div className="signs">
          <div className="sign">
            <div className="sline">
              {data.teacherSig ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.teacherSig} alt="Signature" className="simg" />
              ) : data.teacher ? (
                <span className="hand">{data.teacher}</span>
              ) : null}
            </div>
            <div className="srule" />
            <div className="slabel">Class Teacher</div>
          </div>
          <div className="sign">
            <div className="sline">
              {data.principalSig ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.principalSig} alt="Signature" className="simg" />
              ) : data.principal ? (
                <span className="hand">{data.principal}</span>
              ) : null}
            </div>
            <div className="srule" />
            <div className="slabel">Principal</div>
          </div>
        </div>
      </div>

      <div className="foot">
        <span>{data.date ? `Date: ${data.date}` : ""}</span>
        <span className="dom">{DOMAIN}</span>
      </div>
    </div>
  );
}

/* --------------------------------- CSS --------------------------------- */

const REPORT_CSS = `
.zreport, .zreport *{ margin:0; padding:0; box-sizing:border-box; }
.zreport{
  --maroon:#7A1F35; --maroon-deep:#3f0f1d; --maroon-glow:#9c3550;
  --gold:#E7CFA1; --gold-deep:#B9924E; --gold-lite:#FBEFD2;
  --ink:#181819; --white:#F7F5F2; --cream:#F4EEE3;
  --t5:#1f7a4d; --t4:#2f6f9e; --t3:#b07d1e; --t2:#b5532a; --t1:#9a2330;
  width:800px; height:1120px; position:relative; overflow:hidden;
  font-family:var(--font-noto-sans-ml),'Noto Sans Malayalam',var(--font-inter),'Inter',sans-serif;
  color:var(--ink);
}
.zreport img{ display:block; }
.zreport .hand{ font-family:var(--font-signature),'Great Vibes',cursive; font-size:38px; line-height:1; color:var(--maroon); }

/* header */
.zreport .head{ display:flex; flex-direction:column; align-items:center; gap:8px; }
.zreport .rtitle{ font-family:var(--font-cinzel),'Cinzel',serif; letter-spacing:.18em; font-weight:800; }
.zreport .rsub{ font-size:16px; }

/* student strip */
.zreport .student{ display:flex; gap:20px; align-items:stretch; }
.zreport .photo{ width:112px; height:138px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.zreport .photo img{ width:100%; height:100%; object-fit:cover; }
.zreport .photo .ph{ font-size:13px; letter-spacing:.2em; color:var(--gold-deep); opacity:.7; }
.zreport .sinfo{ flex:1; display:flex; flex-direction:column; justify-content:center; gap:12px; }
.zreport .sinfo .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.zreport .sinfo .row{ display:flex; flex-direction:column; gap:3px; }
.zreport .sinfo .lbl{ font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--gold-deep); font-weight:600; }
.zreport .sinfo .val{ font-size:20px; font-weight:600; }
.zreport .sinfo .val.name{ font-size:26px; font-weight:700; color:var(--maroon); }

/* table */
.zreport .rtable{ width:100%; border-collapse:collapse; }
.zreport .rtable th, .zreport .rtable td{ text-align:left; padding:13px 16px; font-size:19px; }
.zreport .rtable th{ font-size:14px; letter-spacing:.06em; text-transform:uppercase; }
.zreport .rtable .cno{ width:48px; text-align:center; }
.zreport .rtable .cgr{ width:120px; text-align:center; }
.zreport .rtable .crm{ width:230px; }
.zreport .rtable td.ghost{ opacity:.4; }
.zreport .gbadge{ display:inline-block; min-width:50px; padding:4px 12px; border-radius:999px; color:#fff; font-weight:800; font-size:18px; }
.zreport .gbadge.t5{ background:var(--t5); } .zreport .gbadge.t4{ background:var(--t4); }
.zreport .gbadge.t3{ background:var(--t3); } .zreport .gbadge.t2{ background:var(--t2); }
.zreport .gbadge.t1{ background:var(--t1); }

/* overall */
.zreport .overall{ display:flex; align-items:center; gap:16px; }
.zreport .overall .olbl{ font-size:18px; font-weight:700; color:var(--maroon); }
.zreport .obadge{ display:inline-block; min-width:56px; text-align:center; padding:6px 16px; border-radius:10px; color:#fff; font-weight:800; font-size:24px; }
.zreport .obadge.t5{ background:var(--t5); } .zreport .obadge.t4{ background:var(--t4); }
.zreport .obadge.t3{ background:var(--t3); } .zreport .obadge.t2{ background:var(--t2); }
.zreport .obadge.t1{ background:var(--t1); }
.zreport .overall .orem{ font-size:18px; font-weight:600; }

/* signatures */
.zreport .signs{ display:flex; gap:40px; margin-top:auto; }
.zreport .sign{ flex:1; text-align:center; }
.zreport .sign .sline{ height:52px; display:flex; align-items:flex-end; justify-content:center; }
.zreport .sign .simg{ max-height:50px; max-width:200px; object-fit:contain; }
.zreport .sign .srule{ border-top:1.5px solid var(--ink); margin-top:6px; }
.zreport .sign .slabel{ margin-top:8px; font-size:14px; font-weight:600; color:var(--ink); opacity:.8; }

/* footer */
.zreport .foot{ display:flex; align-items:center; justify-content:space-between; font-size:13px; }
.zreport .foot .dom{ font-family:var(--font-inter),'Inter',sans-serif; letter-spacing:.06em; }

/* ===== Design 1 — Classic Maroon ===== */
.zr1{ background:#fff; }
.zr1 .frame1, .zr1 .frame2{ display:none; }
.zr1 .head{ background:linear-gradient(135deg,var(--maroon),var(--maroon-deep));
  padding:34px 40px 26px; color:var(--gold-lite); position:relative; }
.zr1 .head img{ height:70px; }
.zr1 .head::after{ content:''; position:absolute; left:0; right:0; bottom:0; height:5px;
  background:linear-gradient(90deg,var(--gold-deep),var(--gold-lite),var(--gold-deep)); }
.zr1 .head .rtitle{ font-size:30px; color:#fff; }
.zr1 .head .rsub{ color:var(--gold-lite); }
.zr1 .body{ position:absolute; top:222px; left:0; right:0; bottom:0; padding:30px 44px 26px;
  display:flex; flex-direction:column; gap:24px; }
.zr1 .photo{ border:2px solid var(--maroon); border-radius:8px; background:var(--cream); }
.zr1 .rtable thead tr{ background:var(--maroon); color:#fff; }
.zr1 .rtable tbody tr:nth-child(even){ background:#faf6f1; }
.zr1 .rtable tbody td{ border-bottom:1px solid #ecdfe3; }
.zr1 .overall{ background:var(--cream); border-left:5px solid var(--maroon); border-radius:8px; padding:14px 20px; }
.zr1 .foot{ color:var(--ink); opacity:.65; padding-top:4px; }

/* ===== Design 2 — Elegant Gold ===== */
.zr2{ background:var(--cream); }
.zr2 .frame1{ position:absolute; inset:22px; border:3px solid var(--maroon); }
.zr2 .frame2{ position:absolute; inset:30px; border:1px solid var(--gold-deep); }
.zr2 .head{ position:absolute; top:50px; left:60px; right:60px; gap:4px; }
.zr2 .head img{ height:84px; width:auto; margin-bottom:6px; }
.zr2 .head .rtitle{ font-size:27px; color:var(--maroon); margin-top:8px; padding-bottom:10px; }
.zr2 .head .rtitle{ position:relative; }
.zr2 .head .rtitle::after{ content:''; position:absolute; left:50%; bottom:0; transform:translateX(-50%);
  width:160px; height:2px; background:linear-gradient(90deg,transparent,var(--gold-deep),transparent); }
.zr2 .head .rsub{ color:var(--gold-deep); font-weight:600; margin-top:8px; }
.zr2 .body{ position:absolute; top:290px; left:60px; right:60px; bottom:54px;
  display:flex; flex-direction:column; gap:22px; }
.zr2 .photo{ border:2px solid var(--gold-deep); border-radius:8px; background:#fff; }
.zr2 .sinfo .val.name{ color:var(--maroon); }
.zr2 .rtable thead tr{ background:var(--gold-lite); color:var(--maroon); border-top:2px solid var(--gold-deep); border-bottom:2px solid var(--gold-deep); }
.zr2 .rtable tbody td{ border-bottom:1px solid #e3d4b8; }
.zr2 .overall{ border:1.5px solid var(--gold-deep); border-radius:8px; padding:14px 20px; background:#fff; }
.zr2 .foot{ color:var(--maroon); opacity:.8; }
`;

/* ------------------------------ Component ------------------------------ */

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "student"
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

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// Make sure a signature is a persistent URL. Freshly uploaded signatures are
// data URLs (from FileReader); upload them to /api/upload (server storage) and
// return the resulting /media URL. Already-stored URLs are returned as-is.
async function ensureSignatureUrl(sig: string | null): Promise<string | null> {
  if (!sig) return null;
  if (!sig.startsWith("data:")) return sig;
  const fd = new FormData();
  fd.append("file", dataUrlToBlob(sig), "signature.png");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Signature upload failed");
  const { url } = (await res.json()) as { url: string };
  return url;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type BulkStudent = { name: string; klass: string; roll: string; grades: Record<string, string> };

export default function ProgressReportMaker() {
  const [design, setDesign] = useState<DesignId>(1);
  const [exam, setExam] = useState<ExamId>("term1");
  const [year, setYear] = useState("2025-26");

  const [studentName, setStudentName] = useState("");
  const [klass, setKlass] = useState("");
  const [roll, setRoll] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>(
    DEFAULT_SUBJECTS.map((name) => ({ name, grade: "" })),
  );

  const [teacher, setTeacher] = useState("");
  const [teacherSig, setTeacherSig] = useState<string | null>(null);
  const [principal, setPrincipal] = useState("");
  const [principalSig, setPrincipalSig] = useState<string | null>(null);
  const [date, setDate] = useState("");

  const [teacherPresets, setTeacherPresets] = useState<StaffPreset[]>([]);
  const [principalPresets, setPrincipalPresets] = useState<StaffPreset[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedPrincipalId, setSelectedPrincipalId] = useState("");

  const [bulk, setBulk] = useState<BulkStudent[]>([]);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const W = 800;
  const H = 1120;

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

  const refreshStaff = useCallback(async () => {
    try {
      const all = await listStaffAction();
      setTeacherPresets(
        all.filter((s) => s.category === "teacher").map((s) => ({ id: s.id, name: s.name, signature: s.signature })),
      );
      setPrincipalPresets(
        all.filter((s) => s.category === "principal").map((s) => ({ id: s.id, name: s.name, signature: s.signature })),
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshStaff();
  }, [refreshStaff]);

  const data: ReportData = useMemo(
    () => ({
      design,
      exam,
      year,
      studentName,
      klass,
      roll,
      photo,
      subjects,
      teacher,
      teacherSig,
      principal,
      principalSig,
      date,
    }),
    [design, exam, year, studentName, klass, roll, photo, subjects, teacher, teacherSig, principal, principalSig, date],
  );

  /* subject helpers */
  const setSubjectName = (i: number, name: string) =>
    setSubjects((prev) => prev.map((s, k) => (k === i ? { ...s, name } : s)));
  const setSubjectGrade = (i: number, grade: string) =>
    setSubjects((prev) => prev.map((s, k) => (k === i ? { ...s, grade } : s)));
  const addSubject = () => setSubjects((prev) => [...prev, { name: "", grade: "" }]);
  const removeSubject = (i: number) => setSubjects((prev) => prev.filter((_, k) => k !== i));

  /* uploads */
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(await fileToDataUrl(f));
    e.target.value = "";
  };
  const onSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setTeacherSig(await fileToDataUrl(f));
    e.target.value = "";
  };
  const onPrincipalSig = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPrincipalSig(await fileToDataUrl(f));
    e.target.value = "";
  };

  const fillFromStudent = (s: StudentDTO) => {
    setStudentName(s.name);
    setKlass(s.klass ? `Class ${s.klass}` : "");
    setRoll(s.admissionNo);
    setPhoto(s.photoUrl);
  };

  /* Teacher / principal presets (saved with their signature) */
  const applyStaff = (role: "teacher" | "principal", id: string) => {
    if (role === "teacher") setSelectedTeacherId(id);
    else setSelectedPrincipalId(id);
    if (!id) return;
    const list = role === "teacher" ? teacherPresets : principalPresets;
    const p = list.find((x) => x.id === id);
    if (!p) return;
    if (role === "teacher") {
      setTeacher(p.name);
      setTeacherSig(p.signature);
    } else {
      setPrincipal(p.name);
      setPrincipalSig(p.signature);
    }
  };

  const saveStaff = async (role: "teacher" | "principal") => {
    const name = (role === "teacher" ? teacher : principal).trim();
    if (!name) {
      alert("Enter a name first.");
      return;
    }
    const sig = role === "teacher" ? teacherSig : principalSig;
    try {
      const url = await ensureSignatureUrl(sig);
      const res = await saveStaffAction({
        name,
        designation: role === "teacher" ? "Class Teacher" : "Principal",
        category: role,
        signatureUrl: url,
      });
      if (!res.ok) {
        alert(res.error || "Could not save.");
        return;
      }
      // Use the persisted URL locally so the card and future saves reuse it.
      if (role === "teacher") {
        setTeacherSig(url);
        setSelectedTeacherId(res.id ?? "");
      } else {
        setPrincipalSig(url);
        setSelectedPrincipalId(res.id ?? "");
      }
      await refreshStaff();
    } catch {
      alert("Could not save the signature. Please try again.");
    }
  };

  const deleteStaff = async (role: "teacher" | "principal") => {
    const id = role === "teacher" ? selectedTeacherId : selectedPrincipalId;
    if (!id) return;
    const res = await deleteStaffAction(id);
    if (!res.ok) {
      alert(res.error || "Could not delete.");
      return;
    }
    if (role === "teacher") setSelectedTeacherId("");
    else setSelectedPrincipalId("");
    await refreshStaff();
  };

  /* single download */
  const capturePng = useCallback(async () => {
    const node = reportRef.current;
    if (!node) throw new Error("Nothing to render.");
    if (document.fonts?.ready) await document.fonts.ready;
    // Make sure every image (logo, photo, signatures) is fully decoded before
    // capturing — otherwise html-to-image can drop a not-yet-loaded image
    // (notably the larger dark logo on the Elegant Gold design).
    const imgs = Array.from(node.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : img.decode().catch(() => undefined),
      ),
    );
    // Two passes: the first toPng warms html-to-image's internal image cache so
    // the second pass embeds every asset reliably.
    const opts = { pixelRatio: 3, backgroundColor: REPORT_BG[design] };
    await toPng(node, opts);
    return toPng(node, opts);
  }, [design]);

  const onDownload = useCallback(async () => {
    setBusy(true);
    try {
      const dataUrl = await capturePng();
      const a = document.createElement("a");
      a.download = `zenithia-report-${slugify(studentName)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Sorry, the report could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [capturePng, studentName]);

  /* ------------------------------- Bulk -------------------------------- */

  const subjectNames = useMemo(
    () => subjects.map((s) => s.name.trim()).filter(Boolean),
    [subjects],
  );

  const downloadTemplate = useCallback(() => {
    const headers = ["Name", "Class", "Roll No", ...subjectNames];
    const sample = ["Aaron Thomas", "5 A", "12", ...subjectNames.map(() => "A+")];
    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "zenithia-report-template.xlsx");
  }, [subjectNames]);

  const downloadSample = useCallback(() => {
    const headers = ["Name", "Class", "Roll No", ...subjectNames];
    const cycle = GRADE_VALUES; // A+, A, B+, B, C+, C, D+, D
    const sampleStudents = [
      { name: "Aaron Thomas", klass: "5 A", roll: "12" },
      { name: "Fathima Rishana", klass: "5 A", roll: "13" },
      { name: "Mohammed Sinan", klass: "5 A", roll: "14" },
      { name: "Diya Krishna", klass: "5 A", roll: "15" },
    ];
    const rows = sampleStudents.map((s, si) => [
      s.name,
      s.klass,
      s.roll,
      // Vary the grades per student so the example looks realistic.
      ...subjectNames.map((_, k) => cycle[(si + k) % cycle.length]),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "zenithia-report-sample.xlsx");
  }, [subjectNames]);

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
      const rollKey = find(/^roll|no\.?$|number|adm/);
      const known = new Set([nameKey, classKey, rollKey].filter(Boolean) as string[]);
      const subjectKeys = keys.filter((k) => !known.has(k));

      const students: BulkStudent[] = rows
        .map((r) => {
          const grades: Record<string, string> = {};
          for (const sk of subjectKeys) grades[sk.trim()] = normalizeGrade(String(r[sk] ?? ""));
          return {
            name: nameKey ? String(r[nameKey] ?? "").trim() : "",
            klass: classKey ? String(r[classKey] ?? "").trim() : "",
            roll: rollKey ? String(r[rollKey] ?? "").trim() : "",
            grades,
          };
        })
        .filter((s) => s.name);

      if (!students.length) {
        setBulkMsg("Could not find a 'Name' column with student names.");
        return;
      }
      // Adopt the subject columns from the sheet so cards match the upload.
      setSubjects(subjectKeys.map((k) => ({ name: k.trim(), grade: "" })));
      setBulk(students);
      // Load the first student into the preview.
      loadStudent(students[0], subjectKeys.map((k) => k.trim()));
      setBulkMsg(`${students.length} students loaded. Click a name to preview, or download all.`);
    } catch (err) {
      console.error(err);
      setBulkMsg("Could not read that file. Please upload a valid .xlsx sheet.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudent = (s: BulkStudent, names?: string[]) => {
    setStudentName(s.name);
    setKlass(s.klass);
    setRoll(s.roll);
    const order = names ?? subjectNames;
    setSubjects(order.map((name) => ({ name, grade: s.grades[name] ?? "" })));
  };

  const downloadAll = useCallback(async () => {
    if (!bulk.length) return;
    setBusy(true);
    try {
      const names = subjectNames;
      for (let i = 0; i < bulk.length; i++) {
        const s = bulk[i];
        setProgress(`Generating ${i + 1} / ${bulk.length} — ${s.name}`);
        flushSync(() => {
          setStudentName(s.name);
          setKlass(s.klass);
          setRoll(s.roll);
          setSubjects(names.map((name) => ({ name, grade: s.grades[name] ?? "" })));
        });
        // Allow the browser to paint the freshly-flushed DOM.
        await sleep(60);
        const dataUrl = await capturePng();
        const a = document.createElement("a");
        a.download = `zenithia-report-${String(i + 1).padStart(2, "0")}-${slugify(s.name)}.png`;
        a.href = dataUrl;
        a.click();
        await sleep(180);
      }
      setProgress(`Done — ${bulk.length} report cards downloaded.`);
    } catch (err) {
      console.error(err);
      setProgress("Something went wrong while generating the cards.");
    } finally {
      setBusy(false);
    }
  }, [bulk, subjectNames, capturePng]);

  const inputCls =
    "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style dangerouslySetInnerHTML={{ __html: REPORT_CSS }} />

      {/* Controls */}
      <div className="space-y-6">
        {/* Exam + design */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Exam & design</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Examination</span>
              <select value={exam} onChange={(e) => setExam(e.target.value as ExamId)} className={inputCls}>
                {EXAM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Academic year</span>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025-26" className={inputCls} />
            </label>
          </div>

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
        </div>

        {/* Student */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Student</h2>
          <div className="mt-4 space-y-4">
            <StudentPicker onPick={fillFromStudent} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Student name</span>
              <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Aaron Thomas" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Class / Division</span>
                <input
                  type="text"
                  list="zr-classes"
                  value={klass}
                  onChange={(e) => setKlass(e.target.value)}
                  placeholder="Select or type, e.g. 5 A"
                  className={inputCls}
                />
                <datalist id="zr-classes">
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink/70">Roll No</span>
                <input type="text" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 12" className={inputCls} />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer rounded-full border border-brand/40 px-4 py-2 text-xs font-medium text-brand transition hover:bg-brand/5">
                {photo ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </label>
              {photo ? (
                <button type="button" onClick={() => setPhoto(null)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove photo
                </button>
              ) : (
                <span className="text-xs text-ink/45">Optional student photo</span>
              )}
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Subjects & grades</h2>
          <p className="mt-1 text-xs text-ink/45">
            Pick a <strong>grade</strong> for each subject — the remark fills in automatically. Subjects left blank are skipped.
          </p>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-[1fr_170px_28px] gap-2 px-1 text-xs font-medium text-ink/50">
              <span>Subject</span>
              <span>Grade</span>
              <span />
            </div>
            {subjects.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_170px_28px] items-center gap-2">
                <input
                  type="text"
                  value={s.name}
                  onChange={(e) => setSubjectName(i, e.target.value)}
                  placeholder="Subject"
                  className="rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-brand"
                />
                <select
                  value={normalizeGrade(s.grade)}
                  onChange={(e) => setSubjectGrade(i, e.target.value)}
                  className="rounded-lg border border-black/15 px-2 py-1.5 text-sm outline-none focus:border-brand"
                >
                  <option value="">— Select grade —</option>
                  {GRADE_LIST.map((g) => (
                    <option key={g.grade} value={g.grade}>
                      {g.grade} · {g.remark}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSubject(i)}
                  className="text-ink/30 transition hover:text-red-600"
                  aria-label="Remove subject"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSubject}
            className="mt-3 rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5"
          >
            + Add subject
          </button>
        </div>

        {/* Signatures */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Signatures</h2>
          <p className="mt-1 text-xs text-ink/45">
            Save a teacher or principal with their signature once — next time just select them. The selected signatures apply to every card (incl. bulk).
          </p>

          {/* Class teacher */}
          <div className="mt-4 rounded-xl border border-black/10 p-4">
            <span className="block text-sm font-semibold text-ink">Class teacher</span>
            {teacherPresets.length > 0 && (
              <select
                value={selectedTeacherId}
                onChange={(e) => applyStaff("teacher", e.target.value)}
                className={`${inputCls} mt-2`}
              >
                <option value="">— Select saved teacher —</option>
                {teacherPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.signature ? " ✍" : ""}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Class teacher name"
              className={`${inputCls} mt-2`}
            />
            <span className="mt-1 block text-xs text-ink/45">
              Printed as a handwritten-style signature when no image is uploaded.
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
                {teacherSig ? "Change signature" : "Upload signature"}
                <input type="file" accept="image/*" onChange={onSignature} className="hidden" />
              </label>
              {teacherSig && (
                <button type="button" onClick={() => setTeacherSig(null)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => saveStaff("teacher")}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
              >
                Save teacher
              </button>
              {selectedTeacherId && (
                <button type="button" onClick={() => deleteStaff("teacher")} className="text-xs font-medium text-red-600 hover:underline">
                  Delete saved
                </button>
              )}
            </div>
            {teacherSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teacherSig} alt="Teacher signature" className="mt-2 h-10 object-contain" />
            )}
          </div>

          {/* Principal */}
          <div className="mt-4 rounded-xl border border-black/10 p-4">
            <span className="block text-sm font-semibold text-ink">Principal</span>
            {principalPresets.length > 0 && (
              <select
                value={selectedPrincipalId}
                onChange={(e) => applyStaff("principal", e.target.value)}
                className={`${inputCls} mt-2`}
              >
                <option value="">— Select saved principal —</option>
                {principalPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.signature ? " ✍" : ""}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="Principal name"
              className={`${inputCls} mt-2`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
                {principalSig ? "Change signature" : "Upload signature"}
                <input type="file" accept="image/*" onChange={onPrincipalSig} className="hidden" />
              </label>
              {principalSig && (
                <button type="button" onClick={() => setPrincipalSig(null)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => saveStaff("principal")}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
              >
                Save principal
              </button>
              {selectedPrincipalId && (
                <button type="button" onClick={() => deleteStaff("principal")} className="text-xs font-medium text-red-600 hover:underline">
                  Delete saved
                </button>
              )}
            </div>
            {principalSig && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={principalSig} alt="Principal signature" className="mt-2 h-10 object-contain" />
            )}
          </div>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-ink/70">Date <span className="text-ink/40">(optional)</span></span>
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. 10 June 2026" className={inputCls} />
          </label>
        </div>

        {/* Bulk Excel */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl text-brand">Bulk from Excel</h2>
          <p className="mt-1 text-xs text-ink/45">
            Upload a sheet with <strong>Name, Class, Roll No</strong> and one <strong>grade</strong> column per subject (A+, A, B+, B, C+, C, D+, D). A card is generated for every student.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5"
            >
              Download Excel template
            </button>
            <button
              type="button"
              onClick={downloadSample}
              className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5"
            >
              Download sample (filled)
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
                {bulk.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => loadStudent(s)}
                    className={`block w-full truncate rounded px-2 py-1 text-left text-xs transition hover:bg-brand/5 ${
                      s.name === studentName ? "bg-brand/10 font-semibold text-brand" : "text-ink/70"
                    }`}
                  >
                    {i + 1}. {s.name} {s.klass ? `· ${s.klass}` : ""}
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
          {busy ? "Generating…" : `Download report (PNG)`}
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
            <div ref={reportRef}>
              <ReportCard data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
