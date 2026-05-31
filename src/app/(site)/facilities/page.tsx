import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import SafeImage from "@/components/SafeImage";
import { getFacilities } from "@/lib/data";

export const metadata: Metadata = { title: "Facilities" };

export default async function FacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <>
      <PageHero
        eyebrow="Campus"
        title="Facilities designed for modern learning"
        subtitle="Safe, well-equipped and inspiring spaces that help every student learn, play and grow."
      />

      <section className="section">
        <div className="container-page">
          {facilities.length === 0 ? (
            <p className="text-center text-ink/60">
              Facilities will be added soon.
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {facilities.map((f, i) => (
                <article
                  key={f.id}
                  className={`grid items-center gap-6 rounded-3xl border border-black/5 bg-white p-4 shadow-sm md:grid-cols-2 ${
                    i % 2 ? "md:[&>div:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <SafeImage
                      src={f.imageUrl}
                      alt={f.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-2 md:p-4">
                    {f.icon && <div className="mb-2 text-3xl">{f.icon}</div>}
                    <h2 className="font-display text-xl font-bold text-ink">
                      {f.title}
                    </h2>
                    <p className="mt-2 text-sm text-ink/65">{f.description}</p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-14 text-center">
            <Link href="/contact" className="btn-primary">
              Schedule a campus visit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
