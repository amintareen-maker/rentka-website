"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function HeroBanner() {
  const images = [
    "/hero-1.webp",
    "/hero-2.webp",
    "/hero-3.webp",
    "/hero-4.webp",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const SWIPE_THRESHOLD = 50;

  /* AUTO SCROLL */
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  /* SWIPE */
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
      touchEndX.current === null
    ) {
      setIsPaused(false);
      return;
    }

    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) > SWIPE_THRESHOLD) {
      if (distance > 0) {
        setCurrentIndex((prev) =>
          prev === images.length - 1 ? 0 : prev + 1
        );
      } else {
        setCurrentIndex((prev) =>
          prev === 0 ? images.length - 1 : prev - 1
        );
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setIsPaused(false);
  };

  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Rent a car from verified local partners — without confusion
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              We help you find the right car, confirm availability,
              and coordinate with trusted rental partners in your city.
            </p>

            <p className="mt-4 text-gray-700 font-medium">
              Real cars. Real owners. No hidden charges.
            </p>

            <Link href="#filters">
              <button className="mt-8 rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-500 transition">
                See available cars in your city
              </button>
            </Link>
          </div>

          {/* RIGHT CAROUSEL */}
          <div
            className="relative w-full h-[320px] md:h-[420px] overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {images.map((img, index) => (
              <div
                key={img}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentIndex
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95"
                }`}
              >
                <Image
                  src={img}
                  alt={`Hero image ${index + 1}`}
                  fill
                  className="object-contain"
                  priority={index === 0}
                />
              </div>
            ))}

            {/* DOTS */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === currentIndex
                      ? "bg-gray-800"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}