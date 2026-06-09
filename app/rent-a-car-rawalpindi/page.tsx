import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import GoogleReviews from "@/components/GoogleReviews";

export const metadata: Metadata = {
  title:
    "Rent a Car in Rawalpindi | Corolla, Civic, Prado & Hiace Rentals – RentKA",

  description:
    "Browse verified car rentals in Rawalpindi with professional drivers and transparent pricing. Book Corolla, Civic, Prado, Hiace and more for airport transfers, city rides, Murree trips, weddings, and family travel.",

  keywords: [
    "rent a car rawalpindi",
    "car rental rawalpindi",
    "corolla rent rawalpindi",
    "civic rent rawalpindi",
    "prado rent rawalpindi",
    "hiace rent rawalpindi",
    "car rental rawalpindi with driver",
    "rawalpindi airport transfer",
    "rawalpindi to murree car rental",
    "monthly car rental rawalpindi",
    "wedding car rental rawalpindi",
  ],
};

const popularCars = [
  {
    name: "Toyota Corolla",
    type: "Comfort Sedan",
    model: "Toyota Corolla",

    image:
      "https://firebasestorage.googleapis.com/v0/b/carconnectapp-be6a1.firebasestorage.app/o/cars%2Fcorolla.png?alt=media&token=b6c9325b-de4c-4800-bda8-01a06f8e5445",

    whatsappText:
      "Hi RentKA, I want to rent a Toyota Corolla in Rawalpindi.",
  },

  {
    name: "Honda Civic",
    type: "Executive Sedan",
    model: "Honda Civic",

    image:
      "https://firebasestorage.googleapis.com/v0/b/carconnectapp-be6a1.firebasestorage.app/o/cars%2Fcivic.png?alt=media&token=7eba6c94-6c2f-4f97-b0d5-555d09c70d46",

    whatsappText:
      "Hi RentKA, I want to rent a Honda Civic in Rawalpindi.",
  },

  {
    name: "Toyota Prado",
    type: "Luxury SUV",
    model: "Toyota Prado",

    image:
      "https://firebasestorage.googleapis.com/v0/b/carconnectapp-be6a1.firebasestorage.app/o/cars%2FToyota%20Prado%2FpRado.webp?alt=media&token=727beae6-14fc-44f0-a487-3144d24c3e9b",

    whatsappText:
      "Hi RentKA, I want to rent a Toyota Prado in Rawalpindi.",
  },

  {
    name: "Toyota Hiace",
    type: "Family & Group Travel",
    model: "Toyota Hiace",

    image:
      "https://firebasestorage.googleapis.com/v0/b/carconnectapp-be6a1.firebasestorage.app/o/cars%2FToyota%20Hiace%2Fgrand.jpg?alt=media&token=d4275851-e8ce-46d9-bd01-522fd32e44ba",

    whatsappText:
      "Hi RentKA, I want to rent a Toyota Hiace in Rawalpindi.",
  },
];

export default function RawalpindiRentalPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-16 space-y-24 overflow-hidden">

      {/* HERO */}
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 xl:gap-16 items-start">

        {/* LEFT SIDE */}
        <div className="space-y-8 pt-2">

          <div className="space-y-6">

            <h1 className="max-w-4xl text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--rentka-blue)]">
              Rent a Car in Rawalpindi — Browse Verified Cars & Transparent Pricing
            </h1>

            <p className="max-w-2xl text-lg md:text-xl leading-relaxed text-slate-700">
              Compare Corolla, Civic, Prado, Hiace and more from verified rental
              partners in Rawalpindi & Islamabad. Book airport transfers, city
              rides, Murree trips, weddings and family travel with professional
              drivers without unexpected last-minute price changes.
            </p>

          </div>

          {/* TRUST STRIP */}
          <div className="flex flex-wrap gap-3">

            {[
              "SECP Registered",
              "NTN Registered",
              "Verified Rental Partners",
              "Transparent Pricing",
            ].map((item) => (

              <div
                key={item}
                className="rounded-full border border-[var(--rentka-green)]/10 bg-[var(--rentka-green)]/10 px-4 py-2 text-sm font-semibold text-[var(--rentka-green)]"
              >
                ✅ {item}
              </div>

            ))}

          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 pt-2">

            <Link
              href="/cars?city=rawalpindi&service=with-driver&country=PK"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--rentka-blue)] px-8 py-4 text-base font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Browse Cars
            </Link>

            <a
              href="https://wa.me/923020589999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--rentka-green)] px-8 py-4 text-base font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
            >
              WhatsApp Now
            </a>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {popularCars.map((car) => (

            <div
              key={car.name}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >

              {/* IMAGE */}
              <div className="relative h-[240px] bg-white">

                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                />

              </div>

              {/* CONTENT */}
              <div className="space-y-4 p-5">

                <div>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {car.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {car.type}
                  </p>

                </div>

                {/* BUTTONS */}
                <div className="space-y-3">

                  <Link
                    href={`/cars?city=rawalpindi&service=with-driver&country=PK&model=${encodeURIComponent(
                      car.model
                    )}`}
                    className="flex w-full items-center justify-center rounded-2xl bg-[var(--rentka-blue)] px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Browse Available Cars
                  </Link>

                  <a
                    href={`https://wa.me/923020589999?text=${encodeURIComponent(
                      car.whatsappText
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-2xl border border-[var(--rentka-green)] bg-white px-4 py-3 text-center text-sm font-bold text-[var(--rentka-green)] transition hover:bg-[var(--rentka-green)] hover:text-white"
                  >
                    WhatsApp Inquiry
                  </a>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* SERVICES */}
      <div>

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">

          <div>

            <h2 className="text-3xl font-bold text-[var(--rentka-blue)]">
              Services We Provide
            </h2>

            <p className="mt-2 text-slate-600">
              Browse verified cars for airport transfers, weddings,
              northern trips, family travel and more.
            </p>

          </div>

          <Link
            href="/cars?city=rawalpindi&service=with-driver&country=PK"
            className="text-sm font-semibold text-[var(--rentka-green)] hover:underline"
          >
            Browse All Cars →
          </Link>

        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {[
            {
              title: "Airport Transfers",
              description:
                "Professional airport pickup & drop-off services in Rawalpindi & Islamabad.",
            },

            {
              title: "Murree & Northern Trips",
              description:
                "Comfortable sedans, SUVs and Hiace options for northern travel.",
            },

            {
              title: "Wedding Cars",
              description:
                "Luxury and executive vehicles for weddings and special occasions.",
            },

            {
              title: "Corporate Travel",
              description:
                "Reliable transport solutions for meetings and business travel.",
            },

            {
              title: "Monthly Rentals",
              description:
                "Flexible long-term rental solutions for personal and company use.",
            },

            {
              title: "Family Travel",
              description:
                "Spacious SUVs and Hiace vehicles for families and group travel.",
            },
          ].map((service) => (

            <Link
              key={service.title}
              href="/cars?city=rawalpindi&service=with-driver&country=PK"
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[var(--rentka-green)]/30 hover:shadow-xl"
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h3 className="text-xl font-bold text-slate-900 transition group-hover:text-[var(--rentka-blue)]">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {service.description}
                  </p>

                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rentka-green)]/10 text-[var(--rentka-green)] transition group-hover:bg-[var(--rentka-green)] group-hover:text-white">
                  →
                </div>

              </div>

              <div className="mt-5 inline-flex items-center text-sm font-bold text-[var(--rentka-blue)]">
                Browse Available Cars
              </div>

            </Link>

          ))}

        </div>

      </div>

      {/* WHY RENTKA */}
      <div className="rounded-[32px] bg-slate-50 p-8 md:p-12">

        <h2 className="mb-10 text-3xl font-bold text-[var(--rentka-blue)]">
          Why Customers Choose RentKA
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          {[
            "Browse multiple verified cars before booking",
            "Transparent pricing with no hidden surprises",
            "No last-minute pricing surprises after booking confirmation",
            "Quick WhatsApp booking confirmation",
            "Professional drivers and maintained vehicles",
            "Multiple vehicle categories available",
            "Ideal for airport transfers, family travel & city rides",
          ].map((item) => (

            <div
              key={item}
              className="flex items-start gap-3"
            >

              <span className="mt-0.5 text-lg font-bold text-[var(--rentka-green)]">
                ✓
              </span>

              <p className="text-slate-700">
                {item}
              </p>

            </div>

          ))}

        </div>

      </div>

      {/* SEO CONTENT */}
      <div className="space-y-12">

        <div>

          <h2 className="mb-4 text-3xl font-bold text-[var(--rentka-blue)]">
            Car Rental in Rawalpindi Made Simple
          </h2>

          <p className="leading-8 text-slate-700">
            Finding a reliable rental car in Rawalpindi can be frustrating —
            especially when prices suddenly change or vehicles become unavailable
            at the last minute. RentKA simplifies the process by helping customers
            browse verified rental options in one place with transparent pricing
            and quick booking coordination.
          </p>

        </div>

        <div>

          <h2 className="mb-4 text-3xl font-bold text-[var(--rentka-blue)]">
            Airport Transfers & Northern Trips
          </h2>

          <p className="leading-8 text-slate-700">
            We provide airport pickup and drop-off services from Rawalpindi
            along with travel to Murree, Nathia Gali, Naran and northern
            destinations. Whether you need a sedan, SUV, or family vehicle,
            our verified partners offer reliable travel solutions with
            professional drivers.
          </p>

        </div>

      </div>

            {/* RELATED CAR RENTAL LINKS */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">

            <span className="text-[#5BAE4A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
              Explore More Options
            </span>

            <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#0F2B46] leading-tight tracking-[-1px]">
              Popular Car Rentals In Islamabad
            </h2>

            <p className="text-gray-600 mt-5 max-w-3xl mx-auto leading-[1.8] text-base md:text-lg">
              Browse verified rental options available in Islamabad with
              professional drivers, transparent pricing and multiple
              vehicle categories.
            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <Link
              href="/cars/toyota-corolla/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Toyota Corolla Rental Islamabad →
            </Link>

            <Link
              href="/cars/honda-civic/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Honda Civic Rental Islamabad →
            </Link>

            <Link
              href="/cars/toyota-prado/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Toyota Prado Rental Islamabad →
            </Link>

            <Link
              href="/cars/toyota-hiace/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Toyota Hiace Rental Islamabad →
            </Link>

            <Link
              href="/cars/honda-br-v/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Honda BR-V Rental Islamabad →
            </Link>

            <Link
              href="/cars/toyota-hilux/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Toyota Hilux Rental Islamabad →
            </Link>

            <Link
              href="/cars/honda-city/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Honda City Rental Islamabad →
            </Link>

            <Link
              href="/cars/toyota-yaris/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Toyota Yaris Rental Islamabad →
            </Link>

            <Link
              href="/cars/suzuki-alto/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Suzuki Alto Rental Islamabad →
            </Link>

            <Link
              href="/cars/suzuki-wagon-r/islamabad/with-driver"
              className="rounded-2xl border border-slate-200 p-4 font-semibold hover:border-[#5BAE4A] hover:bg-[#F8FAFC] transition"
            >
              Suzuki Wagon R Rental Islamabad →
            </Link>

          </div>

        </div>
      </section>

      {/* FAQ */}
      <div>

        <h2 className="mb-10 text-3xl font-bold text-[var(--rentka-blue)]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-8">

          <div>
            <h3 className="font-semibold text-slate-900">
              Is driver included in the rental price?
            </h3>

            <p className="mt-2 text-slate-700">
              Yes. All RentKA bookings include a professional driver.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Do you offer self drive cars in Rawalpindi?
            </h3>

            <p className="mt-2 text-slate-700">
              No. RentKA currently provides cars with professional drivers only.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Can I book a car for Murree or northern trips?
            </h3>

            <p className="mt-2 text-slate-700">
              Yes. Customers frequently book Prado, Hiace, Corolla and SUVs
              for Murree, Nathia Gali and northern travel.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Which areas do you cover?
            </h3>

            <p className="mt-2 text-slate-700">
              We serve Saddar, Bahria Town, Chaklala, DHA, Commercial Market,
              PWD and surrounding areas.
            </p>
          </div>

        </div>

      </div>

      {/* GOOGLE REVIEWS */}
      <GoogleReviews />      

    </section>
  );
}