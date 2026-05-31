import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import SafeImage from "@/components/SafeImage";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = { title: "About Us" };

const values = [
  { icon: "📘", title: "Knowledge", text: "A rigorous, future-ready curriculum that builds strong foundations." },
  { icon: "🎯", title: "Discipline", text: "Structure and values that shape responsible global citizens." },
  { icon: "💪", title: "Confidence", text: "An environment where every child finds their voice and strengths." },
  { icon: "🌍", title: "Global Outlook", text: "Preparing learners to lead and thrive anywhere in the world." },
];

export default async function AboutPage() {
  const s = await getSiteSettings();

  const stats = [
    { label: "Students", value: s.statStudents },
    { label: "Teachers", value: s.statTeachers },
    { label: "Years of Excellence", value: s.statYears },
    { label: "Awards", value: s.statAwards },
  ];

  return (
    <>
      <PageHero
        eyebrow="About Us"
        title={s.aboutTitle}
        subtitle={s.tagline}
      />

      {/* INTRO — image + story (home style) */}
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
            <span className="eyebrow">Our story</span>
            <h2 className="mt-3 h-title">Shaping confident, capable learners</h2>
            <div className="prose-content mt-5 space-y-4 text-ink/70">
              {(s.aboutBody || s.heroSubtitle)
                .split("\n")
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR (home style) */}
      <section className="border-y border-black/5 bg-white">
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

      {/* Vision & Mission */}
      <section className="section bg-gray-50">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-brand-900 p-8 text-white md:p-10">
            <span className="eyebrow text-gold-300">Our Vision</span>
            <p className="mt-4 text-lg leading-relaxed text-white/85">
              {s.visionBody ||
                "To be a globally respected institution that empowers every learner to reach their highest potential with knowledge, character and confidence."}
            </p>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white p-8 md:p-10">
            <span className="eyebrow">Our Mission</span>
            <p className="mt-4 text-lg leading-relaxed text-ink/75">
              {s.missionBody ||
                "To deliver holistic, value-based education through innovative teaching, modern facilities and a caring community that nurtures lifelong learners and future leaders."}
            </p>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">What we stand for</span>
            <h2 className="mt-3 h-title">Our core values</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-3xl">
                  {v.icon}
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm text-ink/65">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA (home style) */}
      <section className="section">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand to-brand-700 px-8 py-14 text-center text-white md:px-16 md:py-20">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold-400/30 blur-3xl" />
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Come and see Zenithia for yourself
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Schedule a campus visit or talk to our team to learn how we can
              help your child grow with confidence.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-gold">
                Book a campus visit
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
