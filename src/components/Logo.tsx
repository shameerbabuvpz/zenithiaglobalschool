import Image from "next/image";
import Link from "next/link";

export default function Logo({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  // "dark"  -> used on light surfaces (navbar): full colour logo with text.
  // "light" -> used on dark surfaces (footer): mark + light text lockup.
  if (variant === "dark") {
    return (
      <Link
        href="/"
        className="flex items-center"
        aria-label="Zenithia Global School"
      >
        <Image
          src="/brand/logo-full.png"
          alt="Zenithia Global School"
          width={520}
          height={210}
          className="h-10 w-auto md:h-12"
          priority
        />
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className="flex items-center"
      aria-label="Zenithia Global School"
    >
      <Image
        src="/brand/logo-full-white.png"
        alt="Zenithia Global School"
        width={520}
        height={210}
        className="h-12 w-auto md:h-14"
      />
    </Link>
  );
}
