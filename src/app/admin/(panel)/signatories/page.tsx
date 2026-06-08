import { prisma } from "@/lib/prisma";
import SignatoriesManager from "@/components/admin/SignatoriesManager";
import type { StaffDTO } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Signatories",
  robots: { index: false, follow: false },
};

export default async function AdminSignatoriesPage() {
  const rows = await prisma.staff.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }, { name: "asc" }],
  });
  const initial: StaffDTO[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    designation: s.designation,
    category: s.category,
    signature: s.signatureUrl,
  }));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Signatories</h1>
      <p className="mt-1 text-sm text-ink/60">
        Save the principal, class teachers, admin and manager once — name,
        designation and signature image. They become available in a dropdown in
        every tool that prints a signature (certificates, ID cards, progress
        reports and letters), so you never re-type them.
      </p>

      <div className="mt-6">
        <SignatoriesManager initial={initial} />
      </div>
    </div>
  );
}
