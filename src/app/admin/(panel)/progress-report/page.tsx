import type { Metadata } from "next";
import {
  Cinzel,
  Great_Vibes,
  Inter,
  Noto_Sans_Malayalam,
  Noto_Serif_Malayalam,
} from "next/font/google";
import ProgressReportMaker from "@/components/ProgressReportMaker";

// Self-hosted via next/font so the fonts (incl. Malayalam and the signature
// script) embed cleanly in the downloaded PNG. html-to-image cannot fetch
// cross-origin font files.
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
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-signature",
  display: "swap",
});
const notoSansMl = Noto_Sans_Malayalam({
  subsets: ["malayalam", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-ml",
  display: "swap",
});
const notoSerifMl = Noto_Serif_Malayalam({
  subsets: ["malayalam", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-noto-serif-ml",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Progress Report",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminProgressReportPage() {
  return (
    <div
      className={`${cinzel.variable} ${inter.variable} ${greatVibes.variable} ${notoSansMl.variable} ${notoSerifMl.variable}`}
    >
      <h1 className="font-display text-2xl font-bold text-ink">Progress Report</h1>
      <p className="mt-1 text-sm text-ink/60">
        Enter marks and the card prints grades automatically. Generate a single
        card, or upload an Excel sheet to create one for every student.
      </p>

      <div className="mt-6">
        <ProgressReportMaker />
      </div>
    </div>
  );
}
