import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import IdCardMaker from "@/components/IdCardMaker";
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
  title: "ID Card Maker",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminIdCardsPage() {
  const s = await getSiteSettings();
  return (
    <div className={`${cinzel.variable} ${inter.variable}`}>
      <h1 className="font-display text-2xl font-bold text-ink">ID Card Maker</h1>
      <p className="mt-1 text-sm text-ink/60">
        Generate student and staff identity cards. Fill the details, add a photo,
        pick a design, then download a high-res PNG — or upload an Excel sheet to
        make one for every student.
      </p>

      <div className="mt-6">
        <IdCardMaker schoolName={s.schoolName} address={s.address} phone={s.phone} />
      </div>
    </div>
  );
}
