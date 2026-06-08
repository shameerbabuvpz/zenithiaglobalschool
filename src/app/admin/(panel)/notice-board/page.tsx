import type { Metadata } from "next";
import {
  Cinzel,
  Inter,
  Noto_Sans_Malayalam,
  Noto_Serif_Malayalam,
} from "next/font/google";
import NoticeBoardMaker from "@/components/NoticeBoardMaker";

// Self-hosted via next/font so the fonts (incl. Malayalam) embed cleanly in the
// downloaded PNG. html-to-image cannot fetch cross-origin font files.
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
  title: "Notice Board",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminNoticeBoardPage() {
  return (
    <div
      className={`${cinzel.variable} ${inter.variable} ${notoSansMl.variable} ${notoSerifMl.variable}`}
    >
      <h1 className="font-display text-2xl font-bold text-ink">Notice Board</h1>
      <p className="mt-1 text-sm text-ink/60">
        Create a portrait announcement in Malayalam or English, then download it
        or publish it straight to the gallery.
      </p>

      <div className="mt-6">
        <NoticeBoardMaker />
      </div>
    </div>
  );
}
