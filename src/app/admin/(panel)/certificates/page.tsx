import type { Metadata } from "next";
import { Cinzel, Great_Vibes, Inter } from "next/font/google";
import CertificateMaker from "@/components/CertificateMaker";

// Self-hosted via next/font so the display and signature scripts embed
// cleanly in the downloaded PNG. html-to-image cannot fetch cross-origin
// font files.
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

export const metadata: Metadata = {
  title: "Certificate Maker",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCertificatesPage() {
  return (
    <div className={`${cinzel.variable} ${inter.variable} ${greatVibes.variable}`}>
      <h1 className="font-display text-2xl font-bold text-ink">Certificate Maker</h1>
      <p className="mt-1 text-sm text-ink/60">
        Generate award and participation certificates for Arts, Sports, Day
        Celebrations, Quiz competitions and more. Pick the award, fill the event
        details, optionally add a photo, then download a high-res PNG — or upload
        an Excel sheet to make one for every recipient.
      </p>

      <div className="mt-6">
        <CertificateMaker />
      </div>
    </div>
  );
}
