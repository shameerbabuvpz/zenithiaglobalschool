import { prisma } from "@/lib/prisma";
import StudentsManager from "@/components/admin/StudentsManager";
import type { StudentDTO } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Students",
  robots: { index: false, follow: false },
};

export default async function AdminStudentsPage() {
  const rows = await prisma.student.findMany({
    orderBy: [{ klass: "asc" }, { name: "asc" }],
  });
  const initial: StudentDTO[] = rows.map((s) => ({
    id: s.id,
    admissionNo: s.admissionNo,
    name: s.name,
    klass: s.klass,
    gender: s.gender,
    dob: s.dob,
    fatherName: s.fatherName,
    motherName: s.motherName,
    mobile: s.mobile,
    bloodGroup: s.bloodGroup,
    address: s.address,
    photoUrl: s.photoUrl,
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
      <p className="mt-1 text-sm text-ink/60">
        The central student directory. Add students or upload an Excel sheet,
        filter by class, then reuse them everywhere — ID cards, certificates,
        progress reports, letters and posters — by picking the class and name.
      </p>

      <div className="mt-6">
        <StudentsManager initial={initial} />
      </div>
    </div>
  );
}
