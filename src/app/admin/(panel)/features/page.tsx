import { prisma } from "@/lib/prisma";
import { saveFeatureAction, deleteFeatureAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

function FeatureForm({
  feature,
}: {
  feature?: {
    id: string;
    title: string;
    description: string;
    icon: string | null;
    order: number;
    published: boolean;
  };
}) {
  return (
    <form action={saveFeatureAction} className="space-y-4">
      {feature && <input type="hidden" name="id" value={feature.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Icon (emoji)</label>
          <input name="icon" defaultValue={feature?.icon ?? ""} placeholder="⭐" className="input" />
        </div>
        <div>
          <label className="label">Display order</label>
          <input name="order" type="number" defaultValue={feature?.order ?? 0} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input name="title" required defaultValue={feature?.title} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" required rows={3} defaultValue={feature?.description} className="input" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="published" defaultChecked={feature?.published ?? true} className="h-4 w-4" />
        Published
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary">
          {feature ? "Update feature" : "Add feature"}
        </button>
      </div>
    </form>
  );
}

export default async function AdminFeatures() {
  const features = await prisma.feature.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Features (Why Us)</h1>
      <p className="mt-1 text-sm text-ink/60">
        Highlight reasons families should choose your school. {features.length} total.
      </p>

      <details className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-display text-lg font-bold text-brand">
          + Add new feature
        </summary>
        <div className="mt-4">
          <FeatureForm />
        </div>
      </details>

      <div className="mt-6 space-y-4">
        {features.map((f) => (
          <div key={f.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{f.icon || "⭐"}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ink">{f.title}</h3>
                  {!f.published && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Hidden</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink/60 line-clamp-2">{f.description}</p>
              </div>
              <form action={deleteFeatureAction}>
                <input type="hidden" name="id" value={f.id} />
                <button className="text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-brand">Edit</summary>
              <div className="mt-4 border-t border-black/5 pt-4">
                <FeatureForm feature={f} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
