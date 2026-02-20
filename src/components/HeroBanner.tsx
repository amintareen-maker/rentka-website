import Image from "next/image";
import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Rent a car from verified local partners — without confusion
            </h1>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              We help you find the right car, confirm availability, and coordinate
              with trusted rental partners in your city. Self-drive or with driver.
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

          {/* RIGHT IMAGE */}
          <div className="relative w-full h-[320px] md:h-[420px]">
            <Image
              src="/hero-1.webp"
              alt="RentKA rental car"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}