import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession, hasAuthSecret } from "@/lib/auth";
import { loginAction } from "@/lib/actions";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  if (session) redirect("/admin");

  const configured = hasAuthSecret();

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

        {!configured && (
          <p className="mt-5 rounded-lg bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-700">
            Server not configured: the <code>AUTH_SECRET</code> environment
            variable is missing. Please set it in the deployment settings to
            enable login.
          </p>
        )}

        {searchParams.error && (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
            Incorrect PIN. Please try again.
          </p>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="pin">6-digit PIN</label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="\d{6}"
              minLength={6}
              maxLength={6}
              required
              autoFocus
              placeholder="••••••"
              className="input text-center text-2xl tracking-[0.6em]"
              disabled={!configured}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={!configured}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
