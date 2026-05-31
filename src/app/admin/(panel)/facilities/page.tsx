import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { saveFacilityAction, deleteFacilityAction } from "@/lib/actions";
import ImageField from "@/components/admin/ImageField";

export const dynamic = "force-dynamic";

function FacilityForm({
  facility,
}: {
  facility?: {
    id: string;
    title: string;
    description: string;
    icon: string | null;
    order: number;
    published: boolean;
    imageUrl: string | null;
  };
}) {
  return (
    <form action={saveFacilityAction} className="space-y-4">
      {facility && <input type="hidden" name="id" value={facility.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input name="title" required defaultValue={facility?.title} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" required rows={3} defaultValue={facility?.description} className="input" />
        </div>
        <div>
          <label className="label">Icon (emoji, optional)</label>
          <input name="icon" defaultValue={facility?.icon ?? ""} placeholder="🏫" className="input" />
        </div>
        <div>
          <label className="label">Display order</label>
          <input name="order" type="number" defaultValue={facility?.order ?? 0} className="input" />
        </div>
      </div>
      <ImageField currentUrl={facility?.imageUrl} />
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="published" defaultChecked={facility?.published ?? true} className="h-4 w-4" />
        Published (visible on website)
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          {facility ? "Update facility" : "Add facility"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminFacilities() {
  const facilities = await prisma.facility.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Facilities</h1>
      <p className="mt-1 text-sm text-ink/60">
        Showcase your campus facilities. {facilities.length} total.
      </p>

      <details className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-display text-lg font-bold text-brand">
          + Add new facility
        </summary>
        <div className="mt-4">
          <FacilityForm />
        </div>
      </details>

      <div className="mt-6 space-y-4">
        {facilities.map((f) => (
          <div key={f.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {f.imageUrl && (
                  <Image src={f.imageUrl} alt={f.title} fill className="object-cover" sizes="80px" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ink">{f.icon} {f.title}</h3>
                  {!f.published && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Hidden</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink/60 line-clamp-2">{f.description}</p>
              </div>
              <form action={deleteFacilityAction}>
                <input type="hidden" name="id" value={f.id} />
                <button className="text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-brand">Edit</summary>
              <div className="mt-4 border-t border-black/5 pt-4">
                <FacilityForm facility={f} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
