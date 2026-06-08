import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import PhotoFrameMaker from "@/components/PhotoFrameMaker";

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
  title: "Photo Frame",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminPhotoFramePage() {
  return (
    <div className={`${cinzel.variable} ${inter.variable}`}>
      <h1 className="font-display text-2xl font-bold text-ink">
        Program Photo Frame
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        Frame a program photo with the school logo and program name, then
        download a ready-to-share image.
      </p>

      <div className="mt-6">
        <PhotoFrameMaker />
      </div>
    </div>
  );
}
