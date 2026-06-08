"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  type StudentDTO,
  type StudentInput,
  saveStudentAction,
  deleteStudentAction,
  bulkUpsertStudentsAction,
  listStudentsAction,
} from "@/lib/actions";

type Draft = {
  id?: string;
  admissionNo: string;
  name: string;
  klass: string;
  gender: string;
  dob: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  bloodGroup: string;
  address: string;
  photoUrl: string | null;
};

const EMPTY: Draft = {
  admissionNo: "",
  name: "",
  klass: "",
  gender: "male",
  dob: "",
  fatherName: "",
  motherName: "",
  mobile: "",
  bloodGroup: "",
  address: "",
  photoUrl: null,
};

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const json = (await res.json()) as { url: string };
  return json.url;
}

export default function StudentsManager({ initial }: { initial: StudentDTO[] }) {
  const [students, setStudents] = useState<StudentDTO[]>(initial);
  const [filterClass, setFilterClass] = useState<string>("");
  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const classes = useMemo(() => {
    const set = new Set(students.map((s) => s.klass).filter((k) => k.trim()));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [students]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => (filterClass ? s.klass === filterClass : true))
      .filter((s) =>
        q
          ? [s.name, s.admissionNo, s.fatherName, s.motherName, s.mobile]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [students, filterClass, search]);

  const refresh = useCallback(async () => {
    const fresh = await listStudentsAction();
    setStudents(fresh);
  }, []);

  const startAdd = useCallback(() => {
    setDraft({ ...EMPTY, klass: filterClass });
    setEditingId(null);
    setShowForm(true);
    setMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, [filterClass]);

  const startEdit = useCallback((s: StudentDTO) => {
    setDraft({
      id: s.id,
      admissionNo: s.admissionNo,
      name: s.name,
      klass: s.klass,
      gender: s.gender || "male",
      dob: s.dob,
      fatherName: s.fatherName,
      motherName: s.motherName,
      mobile: s.mobile,
      bloodGroup: s.bloodGroup,
      address: s.address,
      photoUrl: s.photoUrl,
    });
    setEditingId(s.id);
    setShowForm(true);
    setMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const onPhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setMsg("Uploading photo…");
    try {
      const url = await uploadPhoto(f);
      setDraft((d) => ({ ...d, photoUrl: url }));
      setMsg(null);
    } catch {
      setMsg("Photo upload failed.");
    }
  }, []);

  const save = useCallback(async () => {
    if (!draft.name.trim()) {
      setMsg("Enter a name first.");
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await saveStudentAction(draft as StudentInput);
    setSaving(false);
    if (!res.ok) {
      setMsg(res.error || "Could not save.");
      return;
    }
    await refresh();
    setShowForm(false);
    setDraft(EMPTY);
    setEditingId(null);
  }, [draft, refresh]);

  const remove = useCallback(
    async (s: StudentDTO) => {
      if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
      await deleteStudentAction(s.id);
      await refresh();
    },
    [refresh],
  );

  /* ------------------------------ Bulk ------------------------------ */
  const downloadTemplate = useCallback(() => {
    const headers = [
      "Admission No", "Name", "Class", "Gender", "Date of Birth",
      "Father Name", "Mother Name", "Mobile", "Blood Group", "Address",
    ];
    const sample = [
      ["ZGS-2026-101", "Aaron Thomas", "1", "Male", "12-03-2019", "Thomas John", "Mary Thomas", "98470 11111", "B+", "Kozhikode"],
      ["ZGS-2026-118", "Fathima Rishana", "2", "Female", "07-08-2018", "Abdul Rahman", "Ayesha Rahman", "98470 22222", "O+", "Malappuram"],
      ["ZGS-2026-094", "Mohammed Sinan", "3", "Male", "21-11-2017", "Salim K", "Suhra Salim", "98470 33333", "A+", "Wayanad"],
      ["ZGS-2026-077", "Diya Krishna", "4", "Female", "03-02-2016", "Krishnan Nair", "Lakshmi Nair", "98470 44444", "AB+", "Kannur"],
      ["ZGS-2026-052", "Hannan Basheer", "5", "Male", "19-09-2015", "Basheer P", "Razia Basheer", "98470 55555", "B-", "Kondotty"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "zenithia-students-sample.xlsx");
  }, []);

  const onExcel = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      setBulkMsg("Reading…");
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
        const admKey = find(/admission|adm\b|reg|id\s*no|^id/);
        const nameKey = find(/^name|student/);
        const classKey = find(/^class|std|grade|division|sec/);
        const genderKey = find(/gender|sex/);
        const dobKey = find(/birth|dob/);
        const fatherKey = find(/father|guardian|parent/);
        const motherKey = find(/mother/);
        const mobileKey = find(/mobile|phone|contact|number/);
        const bloodKey = find(/blood/);
        const addrKey = find(/address|place|town|city|residence/);

        const parsed: StudentInput[] = rows
          .map((r) => ({
            admissionNo: String(admKey ? r[admKey] : "").trim(),
            name: String(nameKey ? r[nameKey] : "").trim(),
            klass: String(classKey ? r[classKey] : "").trim(),
            gender: String(genderKey ? r[genderKey] : "").trim(),
            dob: String(dobKey ? r[dobKey] : "").trim(),
            fatherName: String(fatherKey ? r[fatherKey] : "").trim(),
            motherName: String(motherKey ? r[motherKey] : "").trim(),
            mobile: String(mobileKey ? r[mobileKey] : "").trim(),
            bloodGroup: String(bloodKey ? r[bloodKey] : "").trim(),
            address: String(addrKey ? r[addrKey] : "").trim(),
            photoUrl: null,
          }))
          .filter((r) => r.name);

        if (!parsed.length) {
          setBulkMsg("Could not find a Name column with data.");
          return;
        }
        setBulkMsg(`Importing ${parsed.length} student(s)…`);
        const res = await bulkUpsertStudentsAction(parsed);
        if (!res.ok) {
          setBulkMsg(res.error || "Import failed.");
          return;
        }
        await refresh();
        setBulkMsg(`Imported: ${res.created} new, ${res.updated} updated.`);
      } catch (err) {
        console.error(err);
        setBulkMsg("Sorry, that file could not be read. Use the sample.");
      }
    },
    [refresh],
  );

  const inputCls =
    "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink/60">Class</span>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className={`${inputCls} w-32`}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </label>
        <label className="block flex-1 min-w-[180px]">
          <span className="mb-1 block text-xs font-medium text-ink/60">Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, admission no, mobile…" className={inputCls} />
        </label>
        <button type="button" onClick={startAdd} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
          + Add student
        </button>
      </div>

      {/* Bulk */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink/70">Bulk upload:</span>
          <button type="button" onClick={downloadTemplate} className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
            Download sample Excel
          </button>
          <label className="cursor-pointer rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
            Upload Excel (.xlsx)
            <input type="file" accept=".xlsx,.xls,.csv" onChange={onExcel} className="hidden" />
          </label>
          {bulkMsg && <span className="text-xs text-ink/60">{bulkMsg}</span>}
        </div>
        <p className="mt-2 text-xs text-ink/45">
          Columns: Admission No, Name, Class, Gender, Date of Birth, Father Name, Mother Name, Mobile, Blood Group, Address.
          Rows matching an existing Admission No are updated.
        </p>
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div ref={formRef} className="rounded-2xl border border-brand/30 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-brand">{editingId ? "Edit student" : "Add student"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Admission No</span>
              <input value={draft.admissionNo} onChange={(e) => setDraft({ ...draft, admissionNo: e.target.value })} placeholder="ZGS-2026-101" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Class</span>
              <input value={draft.klass} onChange={(e) => setDraft({ ...draft, klass: e.target.value })} placeholder="1" list="zs-classes" className={inputCls} />
              <datalist id="zs-classes">
                {classes.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Gender</span>
              <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })} className={inputCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Date of Birth</span>
              <input value={draft.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} placeholder="12-03-2019" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Blood Group</span>
              <input value={draft.bloodGroup} onChange={(e) => setDraft({ ...draft, bloodGroup: e.target.value })} placeholder="B+" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Father&apos;s name</span>
              <input value={draft.fatherName} onChange={(e) => setDraft({ ...draft, fatherName: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Mother&apos;s name</span>
              <input value={draft.motherName} onChange={(e) => setDraft({ ...draft, motherName: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Mobile</span>
              <input value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} placeholder="98470 00000" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Address</span>
              <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Town / Village" className={inputCls} />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700">
              {draft.photoUrl ? "Change photo" : "Upload photo"}
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
            {draft.photoUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.photoUrl} alt="" className="h-12 w-12 rounded object-cover ring-1 ring-black/10" />
                <button type="button" onClick={() => setDraft({ ...draft, photoUrl: null })} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </>
            )}
          </div>

          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

          <div className="mt-5 flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
              {saving ? "Saving…" : editingId ? "Update student" : "Add student"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setDraft(EMPTY); setEditingId(null); setMsg(null); }} className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <span className="text-sm font-medium text-ink/70">
            {visible.length} student{visible.length === 1 ? "" : "s"}{filterClass ? ` in Class ${filterClass}` : ""}
          </span>
        </div>
        {visible.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink/50">No students yet. Add one or upload an Excel sheet.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {visible.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-ink/10">
                  {s.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-ink/40">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium text-ink">{s.name}</span>
                    {s.klass && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">Class {s.klass}</span>}
                    {s.gender && <span className="text-xs capitalize text-ink/40">{s.gender}</span>}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink/50">
                    {[s.admissionNo, s.fatherName ? `S/o ${s.fatherName}` : "", s.mobile, s.dob].filter(Boolean).join("  ·  ")}
                  </div>
                </div>
                <button type="button" onClick={() => startEdit(s)} className="text-sm font-medium text-brand hover:underline">Edit</button>
                <button type="button" onClick={() => remove(s)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
