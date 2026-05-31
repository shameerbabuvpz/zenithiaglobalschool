import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SafeImage from "@/components/SafeImage";
import { getPrograms } from "@/lib/data";

export const metadata: Metadata = {
  title: "Upcoming Programs",
  description:
    "Stay updated with upcoming programs and events at Zenithia Global School — academic, cultural and co-curricular activities throughout the year.",
  alternates: { canonical: "/programs" },
  openGraph: {
    title: "Programs & Events — Zenithia Global School",
    description:
      "Upcoming academic, cultural and co-curricular programs and events at Zenithia.",
    url: "/programs",
    type: "website",
  },
};

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ProgramsPage() {
  const programs = await getPrograms();
  const now = new Date();
  const upcoming = programs.filter((p) => !p.date || new Date(p.date) >= now);
  const past = programs.filter((p) => p.date && new Date(p.date) < now);

  return (
    <>
      <PageHero
        eyebrow="Programs & Events"
        title="Upcoming programs at Zenithia"
        subtitle="Stay updated with our events, activities and celebrations throughout the academic year."
      />

      <section className="section">
        <div className="container-page">
          {programs.length === 0 ? (
            <p className="text-center text-ink/60">
              No programs have been announced yet. Please check back soon.
            </p>
          ) : (
            <>
              <div className="grid gap-8 lg:grid-cols-2">
                {(upcoming.length ? upcoming : programs).map((p) => (
                  <article
                    key={p.id}
                    className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[16/9]">
                      <SafeImage
                        src={p.imageUrl}
                        alt={p.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      {formatDate(p.date) && (
                        <span className="absolute left-4 top-4 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white">
                          {formatDate(p.date)}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h2 className="font-display text-xl font-bold text-ink">
                        {p.title}
                      </h2>
                      {p.location && (
                        <p className="mt-1 text-sm font-medium text-brand">
                          📍 {p.location}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-ink/65">{p.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              {past.length > 0 && (
                <div className="mt-16">
                  <h2 className="h-title">Past programs</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {past.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-black/5 bg-gray-50 p-5"
                      >
                        {formatDate(p.date) && (
                          <div className="text-xs font-semibold text-ink/50">
                            {formatDate(p.date)}
                          </div>
                        )}
                        <h3 className="mt-1 font-display text-base font-bold text-ink">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-sm text-ink/60 line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
