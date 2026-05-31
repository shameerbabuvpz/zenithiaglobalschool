import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [facilities, features, programs, gallery, unread, messages] =
    await Promise.all([
      prisma.facility.count(),
      prisma.feature.count(),
      prisma.program.count(),
      prisma.galleryImage.count(),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.contactMessage.count(),
    ]);

  const cards = [
    { label: "Facilities", value: facilities, href: "/admin/facilities" },
    { label: "Features", value: features, href: "/admin/features" },
    { label: "Programs", value: programs, href: "/admin/programs" },
    { label: "Gallery Photos", value: gallery, href: "/admin/gallery" },
    { label: "Messages", value: messages, href: "/admin/messages" },
    { label: "Unread Messages", value: unread, href: "/admin/messages" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">
        Manage your website content from one place.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="font-display text-3xl font-bold text-brand">
              {c.value}
            </div>
            <div className="mt-1 text-sm text-ink/60">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-bold text-ink">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/admin/settings" className="btn-outline">Edit site content</Link>
          <Link href="/admin/gallery" className="btn-outline">Add gallery photos</Link>
          <Link href="/admin/programs" className="btn-outline">Add a program</Link>
          <Link href="/admin/facilities" className="btn-outline">Add a facility</Link>
        </div>
      </div>
    </div>
  );
}
