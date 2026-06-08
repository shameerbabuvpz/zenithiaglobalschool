"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/settings", label: "Site Content", icon: "⚙" },
  { href: "/admin/facilities", label: "Facilities", icon: "🏛" },
  { href: "/admin/features", label: "Features", icon: "⭐" },
  { href: "/admin/programs", label: "Programs", icon: "📅" },
  { href: "/admin/gallery", label: "Gallery", icon: "🖼" },
  { href: "/admin/messages", label: "Messages", icon: "✉" },
  { href: "/admin/poster", label: "Poster Maker", icon: "🏅" },
  { href: "/admin/photo-frame", label: "Photo Frame", icon: "🖼️" },
  { href: "/admin/notice-board", label: "Notice Board", icon: "📢" },
  { href: "/admin/progress-report", label: "Progress Report", icon: "📊" },
  { href: "/admin/certificates", label: "Certificate Maker", icon: "🎖" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand text-white"
                : "text-ink/70 hover:bg-black/5"
            }`}
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
