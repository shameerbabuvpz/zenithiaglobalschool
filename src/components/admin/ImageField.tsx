import Image from "next/image";

/**
 * Image upload field for admin forms. Shows the current image (if any) and a
 * file input. The hidden field preserves the existing URL when no new file is
 * chosen. Pair with `resolveImage` on the server action.
 */
export default function ImageField({
  label = "Image",
  fileName = "imageFile",
  currentName = "currentImageUrl",
  currentUrl,
  hint,
}: {
  label?: string;
  fileName?: string;
  currentName?: string;
  currentUrl?: string | null;
  hint?: string;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-gray-50">
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt="Current"
              fill
              className="object-cover"
              sizes="120px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink/40">
              No image
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            name={fileName}
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
          />
          <p className="mt-1 text-xs text-ink/45">
            {hint || "JPG, PNG, WEBP or GIF · max 8MB. Leave empty to keep the current image."}
          </p>
        </div>
      </div>
      <input type="hidden" name={currentName} value={currentUrl ?? ""} />
    </div>
  );
}
