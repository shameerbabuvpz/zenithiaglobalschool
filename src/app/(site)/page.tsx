import Link from "next/link";
import type { Metadata } from "next";
import SafeImage from "@/components/SafeImage";
import HeroBanner from "@/components/HeroBanner";
import {
  getSiteSettings,
  getFacilities,
  getPrograms,
  getGallery,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Zenithia Global School — Excellence, Leadership & Success",
};

function formatDate(d: Date | null) {
  if (!d) return "Date to be announced";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function HomePage() {
  const [s, facilities, programs, gallery] = await Promise.all([
    getSiteSettings(),
    getFacilities(),
    getPrograms(),
    getGallery(),
  ]);

  const stats = [
    { label: "Students", value: s.statStudents },
    { label: "Teachers", value: s.statTeachers },
    { label: "Years of Excellence", value: s.statYears },
    { label: "Awards", value: s.statAwards },
  ];

  return (
    <>
      {/* HERO BANNERS */}
      <HeroBanner
        images={["/brand/banner-1.png", "/brand/banner-2.png"]}
      />

      {/* STATS */}
      <section className="border-b border-black/5 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 md:grid-cols-4 md:py-10">
          {stats.map((st) => (
            <div key={st.label} className="text-center">
              <div className="font-display text-3xl font-bold text-brand md:text-4xl">
                {st.value}
              </div>
              <div className="mt-1 text-xs text-ink/60 md:text-sm">
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT PREVIEW */}
      <section className="section">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <SafeImage
              src={s.heroImageUrl || "/brand/banner-2.png"}
              alt="About Zenithia Global School"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-4 left-4 rounded-2xl bg-white/95 px-5 py-4 shadow-lg">
              <div className="font-display text-2xl font-bold text-brand">
                {s.statYears}
              </div>
              <div className="text-xs text-ink/60">Years shaping futures</div>
            </div>
          </div>
          <div>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-3 h-title">{s.aboutTitle}</h2>
            <p className="mt-4 text-ink/70">
              {s.aboutBody || s.heroSubtitle}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-gold-50 p-5">
                <h3 className="font-display text-lg font-bold text-brand">Our Vision</h3>
                <p className="mt-2 text-sm text-ink/70 line-clamp-4">
                  {s.visionBody || "To be a beacon of holistic education."}
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-brand-50 p-5">
                <h3 className="font-display text-lg font-bold text-brand">Our Mission</h3>
                <p className="mt-2 text-sm text-ink/70 line-clamp-4">
                  {s.missionBody || "To nurture confident, compassionate leaders."}
                </p>
              </div>
            </div>
            <Link href="/about" className="btn-primary mt-8">
              Read More
            </Link>
          </div>
        </div>
      </section>

      {/* FACILITIES */}
      {facilities.length > 0 && (
        <section className="section">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="eyebrow">Campus</span>
                <h2 className="mt-3 h-title">World-class facilities</h2>
              </div>
              <Link href="/facilities" className="btn-outline">
                View all facilities
              </Link>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.slice(0, 6).map((f) => (
                <article key={f.id} className="card overflow-hidden">
                  <div className="relative aspect-[16/10]">
                    <SafeImage
                      src={f.imageUrl}
                      alt={f.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-ink">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink/65 line-clamp-3">
                      {f.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROGRAMS */}
      {programs.length > 0 && (
        <section className="section bg-brand-900 text-white">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="eyebrow text-gold-300">What&apos;s on</span>
                <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                  Upcoming programs &amp; events
                </h2>
              </div>
              <Link
                href="/programs"
                className="btn-outline border-white/30 text-white hover:bg-white hover:text-brand"
              >
                See all
              </Link>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {programs.slice(0, 3).map((p) => (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="relative aspect-[16/9]">
                    <SafeImage
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gold-300">
                      {formatDate(p.date)}
                    </div>
                    <h3 className="mt-2 font-display text-lg font-bold">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-sm text-white/70 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {gallery.length > 0 && (
        <section className="section">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="eyebrow">Life at Zenithia</span>
                <h2 className="mt-3 h-title">From our gallery</h2>
              </div>
              <Link href="/gallery" className="btn-outline">
                Open gallery
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.slice(0, 8).map((g) => (
                <div
                  key={g.id}
                  className="group relative aspect-square overflow-hidden rounded-xl"
                >
                  <SafeImage
                    src={g.imageUrl}
                    alt={g.title || "Gallery image"}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-brand-700 px-8 py-14 text-center text-white md:px-16 md:py-20">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-400/30 blur-3xl" />
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Give your child a future-ready start
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Admissions are open. Visit our campus or reach out to our team to
              begin the journey toward excellence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-gold">
                Apply for Admission
              </Link>
              {s.phone && (
                <a
                  href={`tel:${s.phone}`}
                  className="btn-outline border-white/30 text-white hover:bg-white hover:text-brand"
                >
                  Call {s.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
