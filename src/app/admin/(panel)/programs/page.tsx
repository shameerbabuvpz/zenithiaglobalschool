import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { saveProgramAction, deleteProgramAction } from "@/lib/actions";
import ImageField from "@/components/admin/ImageField";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function ProgramForm({
  program,
}: {
  program?: {
    id: string;
    title: string;
    description: string;
    location: string;
    date: Date | null;
    published: boolean;
    imageUrl: string | null;
  };
}) {
  return (
    <form action={saveProgramAction} className="space-y-4">
      {program && <input type="hidden" name="id" value={program.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input name="title" required defaultValue={program?.title} className="input" />
        </div>
        <div>
          <label className="label">Date</label>
          <input name="date" type="date" defaultValue={toDateInput(program?.date ?? null)} className="input" />
        </div>
        <div>
          <label className="label">Location</label>
          <input name="location" defaultValue={program?.location} placeholder="School auditorium" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" required rows={3} defaultValue={program?.description} className="input" />
        </div>
      </div>
      <ImageField currentUrl={program?.imageUrl} />
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="published" defaultChecked={program?.published ?? true} className="h-4 w-4" />
        Published
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          {program ? "Update program" : "Add program"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminPrograms() {
  const programs = await prisma.program.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Programs & Events</h1>
      <p className="mt-1 text-sm text-ink/60">
        Announce upcoming programs and events. {programs.length} total.
      </p>

      <details className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-display text-lg font-bold text-brand">
          + Add new program
        </summary>
        <div className="mt-4">
          <ProgramForm />
        </div>
      </details>

      <div className="mt-6 space-y-4">
        {programs.map((p) => (
          <div key={p.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {p.imageUrl && (
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="96px" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ink">{p.title}</h3>
                  {!p.published && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Hidden</span>
                  )}
                </div>
                <p className="text-xs text-ink/50">
                  {p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "No date"}
                  {p.location ? ` · ${p.location}` : ""}
                </p>
                <p className="mt-1 text-sm text-ink/60 line-clamp-2">{p.description}</p>
              </div>
              <form action={deleteProgramAction}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-brand">Edit</summary>
              <div className="mt-4 border-t border-black/5 pt-4">
                <ProgramForm program={p} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
