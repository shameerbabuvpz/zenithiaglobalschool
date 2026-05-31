import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { loginAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Admin Login" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-900 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <Image src="/brand/logo-mark.png" alt="Zenithia" width={48} height={52} />
          <h1 className="mt-4 font-display text-xl font-bold text-ink">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-ink/55">
            Sign in to manage your website
          </p>
        </div>

        {searchParams.error && (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
            Invalid email or password.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className="input" autoComplete="username" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
