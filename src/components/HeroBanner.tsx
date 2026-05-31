"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Full-width banner carousel. The supplied banner artwork is the hero itself
 * (the headline is part of the artwork), so we keep the overlay minimal:
 * just call-to-action buttons, slide indicators and a branded scroll cue.
 */
export default function HeroBanner({ images }: { images: string[] }) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      6000
    );
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="relative w-full overflow-hidden bg-brand-900">
      <div className="relative aspect-[16/10] w-full sm:aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6]">
        {slides.map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt="Zenithia Global School"
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Soft bottom fade so the buttons stay legible on any banner */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-900/70 to-transparent" />

        {/* Call to action */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="container-page flex flex-wrap items-center gap-3 pb-8 md:pb-10">
            <Link href="/contact" className="btn-gold">
              Apply for Admission
            </Link>
            <Link
              href="/about"
              className="btn-outline border-white/40 text-white hover:bg-white hover:text-brand"
            >
              Discover Zenithia
            </Link>
          </div>
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-7 bg-gold-300" : "w-3 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
