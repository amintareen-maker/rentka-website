"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-6">

        {/* ROW 1 — ALWAYS VISIBLE */}
        <div className="flex h-16 items-center justify-between">
          {/* LOGO */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="RentKA"
              width={188}
              height={188}
              priority
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <Link href="/about" className="hover:text-slate-900">
              About Us
            </Link>
            <Link href="/contact" className="hover:text-slate-900">
              Info
            </Link>
          </nav>

          {/* CTA */}
          <a
            href="https://wa.me/923048919511"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
          >
            Contact Us
          </a>
        </div>

        {/* ROW 2 — MOBILE ONLY */}
        <nav className="flex md:hidden items-center gap-6 pb-3 text-sm font-medium text-slate-700">
          <Link href="/about" className="hover:text-slate-900">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-slate-900">
            Info
          </Link>
        </nav>

      </div>
    </header>
  );
}
