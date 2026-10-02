export const revalidate = 60;

import HomeCTA from "@/components/HomeCTA";
import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { getPublicNormalRentalInventory } from "@/lib/normal-rental/public-inventory";
import { PUBLIC_NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";
import GoogleReviews from "@/components/GoogleReviews";
import RouteGrid from "@/components/intercity/RouteGrid";
import ArticleGrid from "./blog/components/ArticleGrid";
import Script from "next/script";

import type { Metadata } from "next";
import Link from "next/link";
import { LOGO_ID, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo";
import PreferredSourceButton from "@/components/PreferredSourceButton";

export const metadata: Metadata = {
  // Next normalizes a root URL against metadataBase to its origin without '/'.
  // This page uses absolute social URLs so its exact root canonical is retained.
  metadataBase: null,
  title: { absolute:
    "RentKA | Car Rental with Driver in Islamabad, Rawalpindi & Lahore",
  },
  description:
    "Book car rental with driver in Islamabad, Rawalpindi and Lahore. Compare vehicles and pricing for within-city travel, airport transfers, outstation trips and one-way drops.",
  keywords: [
    "rent a car islamabad",
    "rent a car rawalpindi",
    "car rental islamabad with driver",
    "car rental rawalpindi with driver",
    "islamabad airport car rental",
    "murree trip car rental",
    "affordable car rental islamabad",
  ],
  alternates: {
    canonical: "https://www.rentka.co/",
  },
  openGraph: {
    title:
      "RentKA | Car Rental with Driver in Islamabad, Rawalpindi & Lahore",
    description:
      "Book cars with professional drivers in Islamabad, Rawalpindi and Lahore for airport, city, corporate and intercity travel.",
    url: "https://www.rentka.co",
    siteName: "RentKA",
    locale: "en_PK",
    type: "website",
    images: [{ url: "https://www.rentka.co/hero-1.webp", alt: "Car rental with driver in Islamabad, Rawalpindi and Lahore" }],
  },
  twitter: { card: "summary_large_image", images: ["https://www.rentka.co/hero-1.webp"] },
};

const homeFaqs = [
{
        q: "How much does it cost to rent a car in Islamabad?",
        a: "Choose your city above to view current starting prices from eligible RentKA vehicles. Rates vary by vehicle, trip type, duration and travel requirements; final availability and charges are confirmed before booking."
      },
      {
        q: "Is fuel included in RentKA prices?",
        a: "Most RentKA bookings are fuel excluded, allowing customers to pay only for the fuel used during their trip. Some fixed-route airport transfers and special packages may include fuel."
      },
      {
        q: "Can I book a Corolla with driver in Islamabad?",
        a: "Yes. Toyota Corolla is one of our most requested vehicles for airport transfers, business travel, family visits, city rides, and out-of-city trips including Murree and Nathiagali."
      },
      {
        q: "Do you provide airport pickup and drop?",
        a: "Yes. RentKA provides airport pickup and drop services to and from Islamabad International Airport with Corolla, BR-V, Hiace, and other cars with a driver."
      },
      {
        q: "Can tourists and overseas Pakistanis book a car?",
        a: "Absolutely. RentKA regularly serves overseas Pakistanis, tourists, business travelers, and international visitors arriving in Islamabad."
      },
      {
        q: "How do I pay?",
        a: "RentKA accepts payments through JazzCash and online bank transfer to the official company account. For customer safety and payment transparency, we recommend avoiding cash payments to drivers. A 20% advance is required to confirm the booking, while the remaining balance can be paid before the journey begins. Fuel and other charges via Cash to Driver, when applicable, may be settled separately during the trip."
      },
      {
        q: "Do you provide Hiace rental for families?",
        a: "Yes. RentKA provides Toyota Hiace rental services for family trips, corporate transportation, weddings, tours, airport transfers, and group travel."
      },
      {
        q: "Can I book a car for Murree?",
        a: "Yes. We provide transportation from Islamabad and Rawalpindi to Murree, Nathiagali, Ayubia, Patriata, and other tourist destinations."
      },
      {
        q: "How far in advance should I book?",
        a: "We recommend booking 24–48 hours in advance, especially during weekends, holidays, and peak travel seasons."
      },
      {
        q: "Is driver included in the rental price?",
        a: "Yes. All RentKA rentals include a professional driver for a safe and hassle-free travel experience."
      },
      {
        q: "Do I need to pay in advance?",
        a: "A 20% advance payment is required to reserve your vehicle. The remaining balance is paid when the driver arrives at the pickup location before the journey begins. This booking process helps secure availability while maintaining transparency and convenience for customers."
      },
      {
        q: "Which areas do you serve?",
        a: "RentKA serves Lahore, Islamabad, Rawalpindi, Bahria Town, DHA, Chaklala, Blue Area, Islamabad International Airport, Murree, Nathiagali, and surrounding areas."
      }
];

export default async function Page() {
  const initialInventory = Object.fromEntries(await Promise.all(PUBLIC_NORMAL_RENTAL_ZONES.map(async (zone) => [zone.defaultCityId, await getPublicNormalRentalInventory(zone.id, zone.defaultCityId)])));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const entitySchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": LOGO_ID,
        url: "https://www.rentka.co/logo.png",
        contentUrl: "https://www.rentka.co/logo.png",
      },
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "RentKA",
        legalName: "RENTKA (SMC-PRIVATE) LIMITED",
        description: "RentKA (SMC-PRIVATE) LIMITED is a professional car rental company with driver based in Islamabad, Pakistan. We provide airport transfers, car rental with driver, one-way intercity travel, corporate transportation, hotel transfers, monthly rentals, and professional driver services in Islamabad, Rawalpindi and Lahore.",
        url: "https://www.rentka.co/",
        logo: { "@id": LOGO_ID },
        telephone: "+923020589999",
        email: "support@rentka.co",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Suite 4, Floor 4, Redco Plaza, Jinnah Avenue, Blue Area",
          addressLocality: "Islamabad",
          addressRegion: "Islamabad Capital Territory",
          addressCountry: "PK",
        },
        sameAs: [
          "https://www.facebook.com/RentKACarRental",
          "https://www.instagram.com/rentka.co",
          "https://www.linkedin.com/company/rentka",
          "https://x.com/RentKACarRental",
          "https://www.youtube.com/@RentKACarRental",
        ],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "RentKA",
        url: "https://www.rentka.co/",
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };

  return (
  <>
    <Script
      id="rentka-entities"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(entitySchema) }}
    />
    <Script
  id="faq-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(faqSchema),
  }}
/>

    <HeroBanner />
    
      <HomePageClient initialInventory={initialInventory}>
        <RouteGrid
          limit={6}
          showViewAll
          heading="🚗 Popular One-Way Routes"
          description="Transparent pricing • Fuel included • Professional driver"
        />

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-[var(--rentka-blue)] sm:text-4xl">
                  📖 Travel Guides & Tips
                </h2>
                <p className="mt-4 text-lg font-semibold text-slate-700">
                  Planning your journey?
                </p>
                <p className="mt-1 max-w-2xl text-slate-600">
                  Explore our latest travel guides, rental advice and destination tips across Pakistan.
                </p>
              </div>

              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-semibold text-[#347A2A] transition hover:text-[var(--rentka-green)]"
              >
                View All Guides →
              </Link>
            </div>

            <ArticleGrid limit={3} showHeading={false} />
          </div>
        </section>
      </HomePageClient>

        {/* Intercity Travel Banner */}

      <section className="bg-white py-10">
  <div className="mx-auto max-w-7xl px-6">

    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F2B46] via-[#123554] to-[#0F2B46] shadow-xl">

      <div className="grid items-center gap-10 p-10 lg:grid-cols-2">

        {/* Left */}

        <div>

          <span className="inline-flex rounded-full bg-[#5BAE4A]/20 px-4 py-2 text-sm font-semibold text-[#8DE27F]">
            🚖 NEW SERVICE
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white">
            Intercity Travel
          </h2>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Travel comfortably between cities with a professional driver. Whether you need a One Way Drop or a Round Trip, RentKA provides reliable car rental with driver service for your journey.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-white">

            <div>✅ One Way Drop</div>

            <div>✅ Round Trips</div>

            <div>✅ Fuel Included</div>

            <div>✅ Professional Driver</div>

          </div>

          <Link
            href="/one-way-drop"
            className="mt-10 inline-flex items-center rounded-2xl bg-[#5BAE4A] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#4b9b3d]"
          >
            Explore Intercity →
          </Link>

        </div>

        {/* Right */}

        <div className="hidden lg:flex justify-center">

          <img
            src="/car_light.png"
            alt="RentKA Intercity Travel"
            className="max-h-[340px] object-contain"
          />

        </div>

      </div>

    </div>

  </div>
</section>

      {/* SEO Content Section */}
      <section className="bg-white mx-auto max-w-5xl px-4 py-16">
        <div className="space-y-10">

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Explore RentKA Services
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Choose the RentKA service page for your pickup city:{" "}
              <Link
                href="/rent-a-car-islamabad"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                Islamabad car rental options
              </Link>{" "}
              or{" "}
              <Link
                href="/rent-a-car-rawalpindi"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                Rawalpindi car rental options
              </Link>
              , both with professional drivers and quotations confirmed before booking.
            </p>
            <p className="mt-3 text-slate-700 leading-relaxed">
              Looking to rent a car with driver in Islamabad or Rawalpindi? Request availability and pricing today.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Affordable Full-Day Car Rental
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Choose from popular options like Alto, Corolla, and Civic for your
              daily travel needs. Our full-day rental model is ideal for business
              meetings, family visits, weddings, and personal use within the city.
              Driver charges are included in the rental, while fuel costs are
              calculated separately based on distance traveled.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">
              Airport Transfers & Murree Trips
            </h2>
            <p className="text-slate-700 leading-relaxed">
              We provide convenient{" "}
              <Link
                href="/airport-car-rental-islamabad"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                airport pickup and drop-off services from Islamabad International Airport
              </Link>
              , as well as outstation trips to destinations like Murree and nearby tourist locations.
              With experienced drivers and well-maintained vehicles, you can travel comfortably and safely.
            </p>
          </div>
{/* GOOGLE REVIEWS */}
                <GoogleReviews />

          <div>
  <div className="text-center mb-8">
    <span className="inline-block bg-[var(--rentka-green)]/10 text-[var(--rentka-green)] text-sm font-semibold px-4 py-2 rounded-full mb-3">
      RENTKA FAQ
    </span>

    <h2 className="text-3xl md:text-4xl font-bold text-[var(--rentka-blue)]">
      Frequently Asked Questions
    </h2>

    <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
      Everything you need to know about car rental in Islamabad, Rawalpindi,
      airport transfers, Murree trips, pricing, and booking with RentKA.
    </p>
  </div>

  <div className="space-y-4">

    {homeFaqs.map((faq, index) => (
      <details
        key={index}
        className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[var(--rentka-green)] transition-all"
      >
        <summary className="cursor-pointer list-none flex items-center justify-between p-5 font-semibold text-[var(--rentka-blue)]">
          {faq.q}

          <span className="text-[var(--rentka-green)] text-xl transition-transform group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="px-5 pb-5 text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
          {faq.a}
        </div>
      </details>
    ))}

  </div>
</div>
              

          <HomeCTA />

        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 pb-16">
        <PreferredSourceButton contentType="homepage" placement="landing_page_footer" />
      </div>
    </>
  );
}
