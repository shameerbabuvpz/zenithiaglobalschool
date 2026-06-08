"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  type StaffDTO,
  saveStaffAction,
  deleteStaffAction,
  listStaffAction,
} from "@/lib/actions";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "teacher", label: "Class Teacher" },
  { id: "principal", label: "Principal" },
  { id: "admin", label: "Admin" },
  { id: "manager", label: "Manager" },
  { id: "staff", label: "Other Staff" },
];

function catLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Staff";
}

type Draft = {
  id?: string;
  name: string;
  designation: string;
  category: string;
  signatureUrl: string | null;
};

const EMPTY: Draft = { name: "", designation: "", category: "teacher", signatureUrl: null };

async function uploadSignature(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  const json = (await res.json()) as { url: string };
  return json.url;
}

export default function SignatoriesManager({ initial }: { initial: StaffDTO[] }) {
  const [staff, setStaff] = useState<StaffDTO[]>(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      items: staff.filter((s) => s.category === c.id),
    })).filter((g) => g.items.length > 0);
  }, [staff]);

  const refresh = useCallback(async () => {
    setStaff(await listStaffAction());
  }, []);

  const startAdd = useCallback(() => {
    setDraft(EMPTY);
    setEditingId(null);
    setShowForm(true);
    setMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const startEdit = useCallback((s: StaffDTO) => {
    setDraft({ id: s.id, name: s.name, designation: s.designation, category: s.category, signatureUrl: s.signature });
    setEditingId(s.id);
    setShowForm(true);
    setMsg(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }, []);

  const onSign = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setMsg("Uploading signature…");
    try {
      const url = await uploadSignature(f);
      setDraft((d) => ({ ...d, signatureUrl: url }));
      setMsg(null);
    } catch {
      setMsg("Signature upload failed.");
    }
  }, []);

  const save = useCallback(async () => {
    if (!draft.name.trim()) {
      setMsg("Enter a name first.");
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await saveStaffAction({
      id: draft.id,
      name: draft.name,
      designation: draft.designation,
      category: draft.category,
      signatureUrl: draft.signatureUrl,
    });
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
    async (s: StaffDTO) => {
      if (!confirm(`Delete ${s.name}?`)) return;
      await deleteStaffAction(s.id);
      await refresh();
    },
    [refresh],
  );

  const inputCls =
    "w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={startAdd} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
          + Add signatory
        </button>
      </div>

      {showForm && (
        <div ref={formRef} className="rounded-2xl border border-brand/30 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-brand">{editingId ? "Edit signatory" : "Add signatory"}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Name</span>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Dr. Shameer Babu" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Designation</span>
              <input value={draft.designation} onChange={(e) => setDraft({ ...draft, designation: e.target.value })} placeholder="Principal" className={inputCls} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/70">Category</span>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label className="cursor-pointer rounded-full border border-brand/40 px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-brand/5">
              {draft.signatureUrl ? "Change signature" : "Upload signature"}
              <input type="file" accept="image/*" onChange={onSign} className="hidden" />
            </label>
            {draft.signatureUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.signatureUrl} alt="" className="h-10 object-contain" />
                <button type="button" onClick={() => setDraft({ ...draft, signatureUrl: null })} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              </>
            )}
          </div>

          {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

          <div className="mt-5 flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
              {saving ? "Saving…" : editingId ? "Update" : "Add signatory"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setDraft(EMPTY); setEditingId(null); setMsg(null); }} className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-ink/70 transition hover:bg-black/5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-black/10 bg-white px-4 py-10 text-center text-sm text-ink/50 shadow-sm">
          No signatories yet. Add the principal, class teachers, admin and manager — they will be available in every tool.
        </p>
      ) : (
        grouped.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink/50">
              {g.label}
            </div>
            <ul className="divide-y divide-black/5">
              {g.items.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded bg-ink/5">
                    {s.signature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.signature} alt="" className="max-h-9 max-w-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-ink/30">no sign</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink">{s.name}</div>
                    <div className="text-xs text-ink/50">{s.designation || catLabel(s.category)}</div>
                  </div>
                  <button type="button" onClick={() => startEdit(s)} className="text-sm font-medium text-brand hover:underline">Edit</button>
                  <button type="button" onClick={() => remove(s)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
