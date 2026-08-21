"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!mobileMenuRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [moreOpen]);

  const handleHomeClick = (event: React.MouseEvent) => {
    if (pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" onClick={handleHomeClick} className="flex items-center">
            <Image src="/logo.png" alt="RentKA" width={140} height={40} priority className="h-10 w-auto" />
          </Link>

          <div className="hidden items-center gap-10 md:flex">
            <nav className="flex items-center gap-8 text-sm font-medium text-slate-700">
              <Link href="/rent-a-car-islamabad" className="transition hover:text-[var(--rentka-blue)]">Islamabad</Link>
              <Link href="/rent-a-car-lahore" className="transition hover:text-[var(--rentka-blue)]">Lahore</Link>
              <Link href="/airport-car-rental-islamabad" className="transition hover:text-[var(--rentka-blue)]">Airport Transfer</Link>
              <Link href="/one-way-drop" className="transition hover:text-[var(--rentka-blue)]">One-Way Trips</Link>
              <Link href="/blog" className="transition hover:text-[var(--rentka-blue)]">Travel Guides</Link>
              <Link href="/about" className="transition hover:text-[var(--rentka-blue)]">About Us</Link>
            </nav>
            <a href="https://wa.me/923020589999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md bg-[var(--rentka-green)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--rentka-green-hover)]">Contact Us</a>
          </div>
        </div>

        <nav aria-label="Primary mobile navigation" className="flex items-center justify-between gap-1 pb-3 text-sm font-semibold text-slate-700 md:hidden">
          <Link href="/rent-a-car-islamabad" className="inline-flex min-h-10 items-center rounded-md px-2 transition hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Cars</Link>
          <Link href="/airport-car-rental-islamabad" className="inline-flex min-h-10 items-center rounded-md px-2 transition hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Airport</Link>
          <Link href="/one-way-drop" className="inline-flex min-h-10 items-center rounded-md px-2 transition hover:bg-slate-50 hover:text-[var(--rentka-blue)]">One-Way</Link>
          <div ref={mobileMenuRef} className="relative">
            <button type="button" aria-expanded={moreOpen} aria-controls="mobile-more-menu" className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 transition hover:bg-slate-50 hover:text-[var(--rentka-blue)]" onClick={() => setMoreOpen((open) => !open)}>
              More <span aria-hidden="true">☰</span>
            </button>
            {moreOpen && (
              <div id="mobile-more-menu" className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link href="/rent-a-car-islamabad" onClick={() => setMoreOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Islamabad &amp; Rawalpindi</Link>
                <Link href="/rent-a-car-lahore" onClick={() => setMoreOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Lahore Car Rental</Link>
                <Link href="/blog" onClick={() => setMoreOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Travel Guides</Link>
                <Link href="/about" onClick={() => setMoreOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-slate-50 hover:text-[var(--rentka-blue)]">About RentKA</Link>
                <Link href="/contact" onClick={() => setMoreOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-slate-50 hover:text-[var(--rentka-blue)]">Contact</Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
