"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Floating "scroll to top" button using the logo mark. Appears once the
 * visitor has scrolled down. Branded scroll icon.
 */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold-300/40 bg-white shadow-lg ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        aria-hidden
        width={28}
        height={32}
        className="h-7 w-auto"
      />
    </button>
  );
}

