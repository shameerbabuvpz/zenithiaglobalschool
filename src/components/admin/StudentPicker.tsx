"use client";

import { useEffect, useMemo, useState } from "react";
import { type StudentDTO, listStudentsAction } from "@/lib/actions";

/**
 * Reusable "pick a student from the directory" control. Loads the central
 * student list once, lets the user filter by class and choose a student, then
 * calls onPick with the full record so the host tool can autofill its fields.
 */
export default function StudentPicker({
  onPick,
}: {
  onPick: (student: StudentDTO) => void;
}) {
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [klass, setKlass] = useState("");
  const [sid, setSid] = useState("");

  useEffect(() => {
    let on = true;
    listStudentsAction().then((rows) => {
      if (!on) return;
      setStudents(rows);
      setLoaded(true);
    });
    return () => {
      on = false;
    };
  }, []);

  const classes = useMemo(() => {
    const set = new Set(students.map((s) => s.klass).filter((k) => k.trim()));
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [students]);

  const inClass = useMemo(
    () => students.filter((s) => (klass ? s.klass === klass : true)),
    [students, klass],
  );

  if (loaded && students.length === 0) return null;

  const selectCls =
    "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-brand/70">
        Pick from student directory
      </span>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={klass}
          onChange={(e) => {
            setKlass(e.target.value);
            setSid("");
          }}
          className={selectCls}
        >
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
        <select
          value={sid}
          onChange={(e) => {
            const id = e.target.value;
            setSid(id);
            const s = students.find((x) => x.id === id);
            if (s) onPick(s);
          }}
          className={selectCls}
        >
          <option value="">Select student…</option>
          {inClass.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.klass ? ` · ${s.klass}` : ""}
              {s.admissionNo ? ` · ${s.admissionNo}` : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
