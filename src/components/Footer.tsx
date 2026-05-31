import Link from "next/link";
import Logo from "./Logo";
import { getSiteSettings } from "@/lib/data";

const quickLinks = [
  { href: "/about", label: "About" },
  { href: "/facilities", label: "Facilities" },
  { href: "/programs", label: "Programs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default async function Footer() {
  const s = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 bg-brand-900 text-white/80">
      <div className="container-page flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:gap-4 md:text-left">
        <Logo variant="light" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-white/75 transition hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 md:flex-row">
          <p>
            © {year} {s.schoolName}. All rights reserved.
          </p>
          <p>
            Powered by{" "}
            <a
              href="https://datahex.co/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-white/70 transition hover:text-white"
            >
              Datahex
            </a>
          </p>
          <div className="flex items-center gap-4">
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noreferrer" className="hover:text-white/80">
                Facebook
              </a>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noreferrer" className="hover:text-white/80">
                Instagram
              </a>
            )}
            {s.youtube && (
              <a href={s.youtube} target="_blank" rel="noreferrer" className="hover:text-white/80">
                YouTube
              </a>
            )}
            <Link href="/admin" className="hover:text-white/80">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
