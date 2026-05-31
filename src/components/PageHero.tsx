import Image from "next/image";

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  image = "/brand/banner-1.png",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-900 text-white">
      <div className="absolute inset-0">
        {image && (
          <Image
            src={image}
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover object-left"
          />
        )}
        <div className="absolute inset-0 bg-brand-900/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/85 to-brand-900/70" />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-gold-400 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand-500 blur-3xl" />
      </div>
      <div className="container-page relative py-16 md:py-24">
        {eyebrow && <span className="eyebrow text-gold-300">{eyebrow}</span>}
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
