"use client";

import { useEffect, useMemo, useState } from "react";
import { type StaffDTO, listStaffAction } from "@/lib/actions";

/**
 * Reusable "pick a saved signatory" dropdown. Loads the central staff list and
 * calls onPick with the chosen entry (name + designation + signature) so the
 * host tool can fill its signature fields. Optionally filtered by category.
 */
export default function SignatoryPicker({
  label = "Use saved signatory",
  category,
  onPick,
}: {
  label?: string;
  category?: string;
  onPick: (staff: StaffDTO) => void;
}) {
  const [staff, setStaff] = useState<StaffDTO[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let on = true;
    listStaffAction().then((rows) => {
      if (!on) return;
      setStaff(rows);
      setLoaded(true);
    });
    return () => {
      on = false;
    };
  }, []);

  const items = useMemo(
    () => (category ? staff.filter((s) => s.category === category) : staff),
    [staff, category],
  );

  if (loaded && items.length === 0) return null;

  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const s = staff.find((x) => x.id === e.target.value);
        if (s) onPick(s);
        e.target.value = "";
      }}
      className="w-full rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-sm text-brand outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
    >
      <option value="">{label}…</option>
      {items.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.designation ? ` — ${s.designation}` : ""}
        </option>
      ))}
    </select>
  );
}
