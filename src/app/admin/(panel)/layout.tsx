import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="shrink-0 border-b border-black/5 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between p-5">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/brand/logo-mark.png" alt="Zenithia" width={32} height={36} />
              <span className="font-display text-sm font-bold text-ink">
                Zenithia Admin
              </span>
            </Link>
          </div>
          <div className="px-3 pb-5">
            <AdminSidebar />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
            <div className="text-sm text-ink/60">
              Signed in as <span className="font-medium text-ink">{session.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" target="_blank" className="text-sm text-brand hover:underline">
                View site ↗
              </Link>
              <form action={logoutAction}>
                <button className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium hover:bg-black/5">
                  Log out
                </button>
              </form>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
