import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollTop from "@/components/ScrollTop";
import { getSiteSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: s.schoolName,
    alternateName: "Zenithia",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo-mark.png`,
    image: `${SITE_URL}/brand/banner-1.png`,
    slogan: s.tagline || undefined,
    description: s.heroSubtitle || s.tagline,
    ...(s.email ? { email: s.email } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: s.address,
          },
        }
      : {}),
    sameAs: [s.facebook, s.instagram, s.youtube, s.twitter].filter(Boolean),
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // Structured data built from admin-managed site settings.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollTop />
    </div>
  );
}
