"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Item = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
};

export default function GalleryGrid({ items }: { items: Item[] }) {
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [items]);

  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<Item | null>(null);

  const filtered =
    active === "All" ? items : items.filter((i) => i.category === active);

  if (items.length === 0) {
    return (
      <p className="text-center text-ink/60">
        Photos will be added soon. Please check back later.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === c
                ? "bg-brand text-white"
                : "border border-black/10 text-ink/70 hover:bg-black/5"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item)}
            className="group relative block w-full overflow-hidden rounded-2xl"
          >
            <Image
              src={item.imageUrl}
              alt={item.title || "Gallery image"}
              width={600}
              height={600}
              className="h-auto w-full object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            {item.title && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                {item.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            ×
          </button>
          <div
            className="relative max-h-[85vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.imageUrl}
              alt={lightbox.title || "Gallery image"}
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
            {lightbox.title && (
              <p className="mt-3 text-center text-sm text-white/80">
                {lightbox.title}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
