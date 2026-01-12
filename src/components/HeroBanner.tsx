"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useHeroBanner } from "@/lib/useHeroBanner";

export default function HeroBanner() {
  const { banner, loading } = useHeroBanner();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 50; // px

  /* ---------------------------------------------------------
     AUTO SCROLL
  --------------------------------------------------------- */
  useEffect(() => {
    if (!banner?.images || banner.images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === banner.images.length - 1 ? 0 : prev + 1
      );
    }, banner.autoScrollInterval ?? 4000);

    return () => clearInterval(interval);
  }, [banner, isPaused]);

  /* ---------------------------------------------------------
     SWIPE HANDLERS
  --------------------------------------------------------- */
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      !banner
    ) {
      setIsPaused(false);
      return;
    }

    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      if (distance > 0) {
        // swipe left → next
        setCurrentIndex((prev) =>
          prev === banner.images.length - 1 ? 0 : prev + 1
        );
      } else {
        // swipe right → previous
        setCurrentIndex((prev) =>
          prev === 0 ? banner.images.length - 1 : prev - 1
        );
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  /* ---------------------------------------------------------
     FAST FALLBACK HERO
  --------------------------------------------------------- */
  if (loading && !banner) {
    return (
      <section className="relative w-full bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Rent a car from verified local partners — without confusion.
              </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-xl">
                Find reliable rental cars with clear pricing and flexible options.
                Self-drive or with driver. No upfront payment required.
              </p>

              <Link href="/cars">
                <button className="mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-500 transition">
                  See available cars in your city
                </button>
              </Link>
            </div>

            <div className="relative w-full h-[320px] md:h-[420px]">
              <Image
                src="/hero-car.png"
                alt="Rental car"
                fill
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!banner || banner.active === false) return null;

  /* ---------------------------------------------------------
     FIREBASE HERO
  --------------------------------------------------------- */
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              {banner.title}
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl whitespace-pre-line">
              {banner.subtitle}
            </p>

            <Link href="/cars">
              <button className="mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-500 transition">
                {banner.ctaText}
              </button>
            </Link>
          </div>

          {/* RIGHT – CAROUSEL */}
          <div
            className="relative w-full h-[320px] md:h-[420px] overflow-hidden touch-pan-y"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {banner.images.map((img, index) => (
              <div
                key={`${img}-${index}`}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }`}
              >
                <Image
                  src={img}
                  alt={`Hero car ${index + 1}`}
                  fill
                  className="object-contain"
                  priority={index === 0}
                />
              </div>
            ))}

            {/* DOTS */}
            {banner.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banner.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-2 w-2 rounded-full transition ${
                      i === currentIndex
                        ? "bg-gray-800"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
