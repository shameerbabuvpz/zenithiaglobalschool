import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { getSiteSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Zenithia Global School for admissions, campus visits and enquiries. Find our address, phone, email and WhatsApp details.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Zenithia Global School",
    description:
      "Reach out for admissions, campus visits or any enquiry. We would love to hear from you.",
    url: "/contact",
    type: "website",
  },
};

export default async function ContactPage() {
  const s = await getSiteSettings();

  const details = [
    { icon: "📍", label: "Address", value: s.address },
    { icon: "📞", label: "Phone", value: s.phone, href: s.phone ? `tel:${s.phone}` : undefined },
    { icon: "✉️", label: "Email", value: s.email, href: s.email ? `mailto:${s.email}` : undefined },
    { icon: "💬", label: "WhatsApp", value: s.whatsapp, href: s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, "")}` : undefined },
  ].filter((d) => d.value);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with us"
        subtitle="We would love to hear from you. Reach out for admissions, visits or any enquiry."
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Reach us</span>
            <h2 className="mt-3 h-title">We&apos;re here to help</h2>

            <div className="mt-8 space-y-4">
              {details.length === 0 ? (
                <p className="text-ink/60">
                  Contact details will be available here soon.
                </p>
              ) : (
                details.map((d) => (
                  <div key={d.label} className="flex items-start gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                    <span className="text-2xl">{d.icon}</span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                        {d.label}
                      </div>
                      {d.href ? (
                        <a href={d.href} className="font-medium text-ink hover:text-brand">
                          {d.value}
                        </a>
                      ) : (
                        <div className="font-medium text-ink">{d.value}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {s.mapEmbed && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-black/5">
                <div
                  className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full"
                  // mapEmbed is admin-controlled; only paste trusted Google Maps embed code.
                  dangerouslySetInnerHTML={{ __html: s.mapEmbed }}
                />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
            <h3 className="font-display text-xl font-bold text-ink">
              Send us a message
            </h3>
            <p className="mt-1 text-sm text-ink/60">
              Fill in the form and our team will respond soon.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
