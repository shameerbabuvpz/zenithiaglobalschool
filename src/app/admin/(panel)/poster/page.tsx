import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import PosterGenerator from "@/components/PosterGenerator";

// Self-hosted via next/font so the fonts embed cleanly in the downloaded PNG.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poster Maker",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPosterPage() {
  return (
    <div className={`${cinzel.variable} ${inter.variable}`}>
      <h1 className="font-display text-2xl font-bold text-ink">
        Student of the Month — Poster Maker
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Pick a design, add the month, student name, class and photo, then
        download a print-ready poster.
      </p>

      <div className="mt-6">
        <PosterGenerator />
      </div>
    </div>
  );
}
