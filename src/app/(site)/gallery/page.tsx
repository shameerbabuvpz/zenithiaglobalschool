import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import GalleryGrid from "@/components/GalleryGrid";
import { getGallery } from "@/lib/data";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A glimpse of life at Zenithia Global School — events, activities and memorable moments from our vibrant campus community.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Gallery — Zenithia Global School",
    description: "Events, activities and memorable moments from life at Zenithia.",
    url: "/gallery",
    type: "website",
  },
};

export default async function GalleryPage() {
  const images = await getGallery();

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Moments from life at Zenithia"
        subtitle="A glimpse into our classrooms, campus, events and the everyday joy of learning."
      />

      <section className="section">
        <div className="container-page">
          <GalleryGrid
            items={images.map((i) => ({
              id: i.id,
              title: i.title,
              category: i.category,
              imageUrl: i.imageUrl,
            }))}
          />
        </div>
      </section>
    </>
  );
}
