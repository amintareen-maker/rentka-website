export const revalidate = 60;

import HomeCTA from "@/components/HomeCTA";
import HeroBanner from "@/components/HeroBanner";
import HomePageClient from "@/components/HomePageClient";
import { collection, getDocs, query, limit } from "firebase/firestore/lite";
import { liteDb } from "@/lib/firebaseLite";
import GoogleReviews from "@/components/GoogleReviews";
import RouteGrid from "@/components/intercity/RouteGrid";
import ArticleGrid from "./blog/components/ArticleGrid";
import Script from "next/script";

import type { Metadata } from "next";
import Link from "next/link";
import { LOCAL_BUSINESS_ID, LOGO_ID, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo";
import type { Car } from "@/lib/useCars";

export const metadata: Metadata = {
  title: { absolute:
    "Car Rental with Driver Islamabad & Rawalpindi | RentKA",
  },
  description:
    "Book car rental with driver in Islamabad and Rawalpindi for city travel, airport transfers, corporate transport and intercity trips with clear quotations.",
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
      "Car Rental with Driver Islamabad & Rawalpindi | RentKA",
    description:
      "Book cars with professional drivers in Islamabad and Rawalpindi for airport, city, corporate and intercity travel.",
    url: "https://www.rentka.co",
    siteName: "RentKA",
    locale: "en_PK",
    type: "website",
    images: [{ url: "/hero-1.webp", alt: "Car rental with driver in Islamabad and Rawalpindi" }],
  },
};

async function getInitialCars() {
  try {
    const ref = collection(liteDb, "countries", "PK", "cars");
    const q = query(ref, limit(20));
    const snap = await getDocs(q);
    const cars: Car[] = [];

    snap.forEach((doc) => {
      cars.push({
        ...(doc.data() as Omit<Car, "id" | "country">),
        id: doc.id,
        country: "PK",
      });
    });

    return cars;
  } catch {
    return [];
  }
}

export default async function Page() {
  const initialCars = await getInitialCars();

  const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does it cost to rent a car in Islamabad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "RentKA offers affordable car rental services in Islamabad and Rawalpindi with prices starting from around PKR 4,500 per day for economy vehicles. Rates vary depending on vehicle category, trip type, duration, and travel requirements."
      }
    },
    {
      "@type": "Question",
      "name": "Is fuel included in RentKA prices?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most RentKA bookings are fuel excluded, allowing customers to pay only for the fuel used during their trip. Some fixed-route airport transfers and special packages may include fuel."
      }
    },
    {
      "@type": "Question",
      "name": "Can I book a Corolla with driver in Islamabad?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Toyota Corolla is one of our most requested vehicles for airport transfers, business travel, family visits, city rides, and out-of-city trips including Murree and Nathiagali."
      }
    },
    {
      "@type": "Question",
      "name": "Do you provide airport pickup and drop?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. RentKA provides airport pickup and drop services to and from Islamabad International Airport with Corolla, BR-V, Hiace, and other cars with a driver."
      }
    },
    {
      "@type": "Question",
      "name": "Can tourists and overseas Pakistanis book a car?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Absolutely. RentKA regularly serves overseas Pakistanis, tourists, business travelers, and international visitors arriving in Islamabad."
      }
    },
    {
      "@type": "Question",
      "name": "How do I pay?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "RentKA accepts payments through JazzCash and online bank transfer to the official company account. A 20 percent advance is required to confirm the booking, while the remaining balance is paid before the journey begins."
      }
    },
    {
      "@type": "Question",
      "name": "Do you provide Hiace rental for families?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. RentKA provides Toyota Hiace rental services for family trips, corporate transportation, weddings, tours, airport transfers, and group travel."
      }
    },
    {
      "@type": "Question",
      "name": "Can I book a car for Murree?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We provide transportation from Islamabad and Rawalpindi to Murree, Nathiagali, Ayubia, Patriata, and other tourist destinations."
      }
    },
    {
      "@type": "Question",
      "name": "How far in advance should I book?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We recommend booking 24 to 48 hours in advance, especially during weekends, holidays, and peak travel seasons."
      }
    },
    {
      "@type": "Question",
      "name": "Is driver included in the rental price?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. All RentKA rentals include a professional driver for a safe and hassle-free travel experience."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need to pay in advance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A 20 percent advance payment is required to reserve your vehicle. The remaining balance is paid when the driver arrives at the pickup location before the journey begins."
      }
    },
    {
      "@type": "Question",
      "name": "Which areas do you serve?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "RentKA serves Islamabad, Rawalpindi, Bahria Town, DHA, Chaklala, Blue Area, Islamabad International Airport, Murree, Nathiagali, and surrounding areas."
      }
    }
  ]
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
        legalName: "RentKA (SMC-PRIVATE) LIMITED",
        description: "RentKA (SMC-PRIVATE) LIMITED is a professional car rental company with driver based in Islamabad, Pakistan. We provide airport transfers, car rental with driver, one-way intercity travel, corporate transportation, hotel transfers, monthly rentals, and professional driver services across Pakistan.",
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
        "@type": "CarRental",
        "@id": LOCAL_BUSINESS_ID,
        name: "RentKA",
        description: "Car rental with professional drivers for Islamabad, Rawalpindi, airport transfers and intercity travel across Pakistan.",
        url: "https://www.rentka.co/",
        image: { "@id": LOGO_ID },
        telephone: "+923020589999",
        parentOrganization: { "@id": ORGANIZATION_ID },
        address: {
          "@type": "PostalAddress",
          streetAddress: "Suite 4, Floor 4, Redco Plaza, Jinnah Avenue, Blue Area",
          addressLocality: "Islamabad",
          addressRegion: "Islamabad Capital Territory",
          addressCountry: "PK",
        },
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
    
      <HomePageClient initialCars={initialCars}>
        <section className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[var(--rentka-blue)]">Need a car in Lahore?</p><p className="mt-1 text-sm text-slate-600">View current Lahore cars and with-driver package prices.</p></div><Link href="/rent-a-car-lahore" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--rentka-green)] px-5 py-3 font-bold text-white">Explore Lahore Car Rental →</Link></div></section>
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
              Rent a Car in Islamabad & Rawalpindi with Driver
            </h2>
            <p className="text-slate-700 leading-relaxed">
              RentKA offers affordable{" "}
              <Link
                href="/rent-a-car-islamabad"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                car rental in Islamabad
              </Link>{" "}
              and{" "}
              <Link
                href="/rent-a-car-rawalpindi"
                className="text-[var(--rentka-blue)] hover:underline"
              >
                car rental in Rawalpindi
              </Link>{" "}
              with professional drivers and transparent pricing. Whether you need a
              full-day city ride, airport transfer, or outstation trip, we connect
              you with verified local vendors to ensure reliable service without
              unnecessary complications.
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

    {[
      {
        q: "How much does it cost to rent a car in Islamabad?",
        a: "RentKA offers affordable car rental services in Islamabad and Rawalpindi with prices starting from around PKR 4,500 per day for economy vehicles. Rates vary depending on vehicle category, trip type, duration, and travel requirements."
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
        a: "RentKA serves Islamabad, Rawalpindi, Bahria Town, DHA, Chaklala, Blue Area, Islamabad International Airport, Murree, Nathiagali, and surrounding areas."
      }
    ].map((faq, index) => (
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
    </>
  );
}
