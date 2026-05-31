import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { saveGalleryAction, deleteGalleryAction } from "@/lib/actions";
import ImageField from "@/components/admin/ImageField";

export const dynamic = "force-dynamic";

export default async function AdminGallery({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-ink">Gallery</h1>
      <p className="mt-1 text-sm text-ink/60">
        Upload photos for the gallery. {images.length} total.
      </p>

      {searchParams.error === "image" && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          Please choose an image to upload.
        </p>
      )}

      <details open className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-display text-lg font-bold text-brand">
          + Upload new photo
        </summary>
        <form action={saveGalleryAction} className="mt-4 space-y-4">
          <ImageField hint="JPG, PNG, WEBP or GIF · max 8MB. Required." />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Title (optional)</label>
              <input name="title" className="input" placeholder="Annual day celebration" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" defaultValue="Campus" className="input" placeholder="Events" />
            </div>
          </div>
          <input type="hidden" name="order" value="0" />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4" />
            Published
          </label>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary">Upload photo</button>
          </div>
        </form>
      </details>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {images.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="relative aspect-square bg-gray-100">
              <Image src={g.imageUrl} alt={g.title || "Gallery"} fill className="object-cover" sizes="200px" />
              {!g.published && (
                <span className="absolute left-2 top-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Hidden</span>
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium text-ink">{g.title || "Untitled"}</p>
              <p className="text-xs text-ink/50">{g.category}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-medium text-brand">Edit</summary>
                <form action={saveGalleryAction} className="mt-2 space-y-2">
                  <input type="hidden" name="id" value={g.id} />
                  <input type="hidden" name="currentImageUrl" value={g.imageUrl} />
                  <input name="title" defaultValue={g.title} placeholder="Title" className="input text-sm" />
                  <input name="category" defaultValue={g.category} placeholder="Category" className="input text-sm" />
                  <input name="order" type="number" defaultValue={g.order} className="input text-sm" />
                  <label className="flex items-center gap-2 text-xs text-ink/70">
                    <input type="checkbox" name="published" defaultChecked={g.published} className="h-4 w-4" />
                    Published
                  </label>
                  <button type="submit" className="btn-primary w-full !py-2 text-xs">Save</button>
                </form>
              </details>
              <form action={deleteGalleryAction} className="mt-1">
                <input type="hidden" name="id" value={g.id} />
                <button className="text-xs text-red-600 hover:underline">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
