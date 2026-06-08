import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import LetterGenerator from "@/components/LetterGenerator";
import { getSiteSettings } from "@/lib/data";

// Self-hosted via next/font so the display font embeds cleanly in the
// downloaded PNG. html-to-image cannot fetch cross-origin font files.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-cinzel",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Letter & Certificate Generator",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLettersPage() {
  const s = await getSiteSettings();
  return (
    <div className={`${cinzel.variable} ${inter.variable}`}>
      <h1 className="font-display text-2xl font-bold text-ink">Letter &amp; Certificate Generator</h1>
      <p className="mt-1 text-sm text-ink/60">
        Produce official documents on the school letterhead — Bonafide
        Certificate, Transfer Certificate (TC), Conduct Certificate or a
        free-form letter. The body text is written automatically from the
        details, then download a high-res PNG.
      </p>

      <div className="mt-6">
        <LetterGenerator schoolName={s.schoolName} address={s.address} phone={s.phone} email={s.email} />
      </div>
    </div>
  );
}
