import type { Metadata } from "next";
import Script from "next/script";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ORGANIZATION_ID } from "@/lib/seo";

import Hero from "@/components/intercity/Hero";
import RouteGrid from "@/components/intercity/RouteGrid";
import PriceTable from "@/components/intercity/PriceTable";
import WhyChoose from "@/components/intercity/WhyChoose";
import RoundTripCTA from "@/components/intercity/RoundTripCTA";
import IntercityFAQ from "@/components/intercity/IntercityFAQ";

import GoogleReviews from "@/components/GoogleReviews";

import { intercityRoutes } from "@/data/intercityRoutes";

export const metadata: Metadata = {
  title: { absolute:
    "One Way Drop & Intercity Car Rental Pakistan | RentKA",

  },
  description:
    "Book one way drop and intercity car rental across Pakistan. Fixed Toyota Corolla pricing, fuel included, professional drivers and instant WhatsApp booking.",

  keywords: [
    "one way drop",
    "one way drop pakistan",
    "intercity car rental",
    "islamabad to lahore",
    "islamabad to peshawar",
    "lahore to islamabad",
    "murree transport",
    "rentka",
    "driver service pakistan",
  ],

  alternates: {
    canonical: "https://www.rentka.co/one-way-drop",
  },

  openGraph: {
    title:
      "One Way Drop Service Pakistan | RentKA",

    description:
      "Professional one-way intercity transport with fuel included and transparent pricing.",

    url:
      "https://www.rentka.co/one-way-drop",

    siteName: "RentKA",

    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "One Way Drop Service | RentKA",

    description:
      "Book one-way intercity transportation across Pakistan.",
  },
};

export default function OneWayDropPage() {

  const serviceSchema = {

    "@context": "https://schema.org",

    "@graph": [

      {
        "@type": "WebPage",

        name: "One Way Drop",

        url: "https://www.rentka.co/one-way-drop",

        description:
          "One Way Drop and Intercity Car Rental Services in Pakistan.",

      },

      {
        "@type": "Service",

        serviceType:
          "One Way Intercity Car Rental",

        provider: {
          "@id": ORGANIZATION_ID,

        },

        areaServed: "Pakistan",

        offers:

          intercityRoutes.map((route) => ({

            "@type": "Offer",

            price:
              route.vehicles.corolla.price,

            priceCurrency: "PKR",

            itemOffered: {

              "@type": "Service",

              name:
                `${route.from} to ${route.to} One Way Drop`,

            },

          })),

      },

      {
        "@type": "BreadcrumbList",

        itemListElement: [

          {
            "@type": "ListItem",

            position: 1,

            name: "Home",

            item: "https://www.rentka.co",
          },

          {
            "@type": "ListItem",

            position: 2,

            name: "One Way Drop",

            item:
              "https://www.rentka.co/one-way-drop",
          },

        ],

      },

    ],

  };

  return (

    <>

      <Script

        id="one-way-schema"

        type="application/ld+json"

        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}

      />

      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "One-Way Drop", href: "/one-way-drop" }]} />
        </div>

        <Hero />
                {/* Quick Stats */}

        <section className="border-y bg-[#0F2B46]">

          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-8 text-center text-white md:grid-cols-4">

            <div>
              <p className="text-3xl font-bold text-[#5BAE4A]">
                {intercityRoutes.length}+
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Popular Routes
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#5BAE4A]">
                100%
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Fuel Included
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#5BAE4A]">
                24/7
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Booking Support
              </p>
            </div>

            <div>
              <p className="text-3xl font-bold text-[#5BAE4A]">
                Driver
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Always Included
              </p>
            </div>

          </div>

        </section>

        {/* Popular Routes */}

        <RouteGrid />

        {/* Why customers choose us */}

        <WhyChoose />

        {/* Pricing */}

        <section
          id="price-table"
          className="scroll-mt-28"
        >
          <PriceTable />
        </section>

        {/* Route Information */}

        <section className="bg-slate-50 py-20">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Travel Across Pakistan
              </span>

              <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">

                Fixed Price One Way Drop Service

              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">

                RentKA provides comfortable intercity travel between major
                cities in Pakistan with transparent pricing, professional
                drivers and fuel included. Whether you're travelling for
                business, family visits or airport connections, our one-way
                drop service offers a convenient alternative to traditional
                taxi services.

              </p>

            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">

              <div className="rounded-3xl bg-white p-8 shadow-sm">

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Popular Destinations

                </h3>

                <ul className="mt-8 space-y-4 text-slate-700">

                  <li>Islamabad → Lahore</li>

                  <li>Islamabad → Peshawar</li>

                  <li>Islamabad → Murree</li>

                  <li>Islamabad → Faisalabad</li>

                  <li>Islamabad → Abbottabad</li>

                  <li>Islamabad → Naran</li>

                </ul>

              </div>

              <div className="rounded-3xl bg-white p-8 shadow-sm">

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Included

                </h3>

                <ul className="mt-8 space-y-4 text-slate-700">

                  <li>✔ Professional Driver</li>

                  <li>✔ Fuel Included</li>

                  <li>✔ Air Conditioned Vehicle</li>

                  <li>✔ Door Pickup</li>

                  <li>✔ Transparent Pricing</li>

                  <li>✔ WhatsApp Booking</li>

                </ul>

              </div>

              <div className="rounded-3xl bg-white p-8 shadow-sm">

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Best For

                </h3>

                <ul className="mt-8 space-y-4 text-slate-700">

                  <li>Business Travel</li>

                  <li>Airport Transfers</li>

                  <li>Family Visits</li>

                  <li>University Students</li>

                  <li>Tourists</li>

                  <li>Corporate Clients</li>

                </ul>

              </div>

            </div>

          </div>

        </section>
                {/* Round Trip CTA */}

        <RoundTripCTA />

        {/* Google Reviews */}

        <section className="py-20 bg-white">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Customer Reviews
              </span>

              <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">

                Trusted by Travellers Across Pakistan

              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">

                Whether you're travelling for business, airport transfers,
                family visits or tourism, RentKA focuses on punctuality,
                professional drivers and transparent pricing.

              </p>

            </div>

            <div className="mt-14">

              <GoogleReviews />

            </div>

          </div>

        </section>

        {/* Related Services */}

        <section className="bg-slate-50 py-20">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-[#0F2B46]">

                More Services

              </span>

              <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">

                Explore More RentKA Services

              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">

                Besides one-way transfers, RentKA provides airport transport,
                city rentals and chauffeur-driven vehicles across Pakistan.

              </p>

            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">

              <a
                href="/rent-a-car-islamabad"
                className="group rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Rent a Car Islamabad

                </h3>

                <p className="mt-4 leading-7 text-slate-600">

                  Chauffeur-driven cars for city travel,
                  corporate meetings and daily transportation.

                </p>

              </a>

              <a
                href="/rent-a-car-rawalpindi"
                className="group rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Rent a Car Rawalpindi

                </h3>

                <p className="mt-4 leading-7 text-slate-600">

                  Reliable transportation with experienced
                  drivers throughout Rawalpindi.

                </p>

              </a>

              <a
                href="/airport-car-rental-islamabad"
                className="group rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >

                <h3 className="text-2xl font-bold text-[#0F2B46]">

                  Islamabad Airport Transfer

                </h3>

                <p className="mt-4 leading-7 text-slate-600">

                  Airport pickup and drop-off with professional
                  drivers and fixed pricing.

                </p>

              </a>

            </div>

          </div>

        </section>

        {/* SEO Content */}

        <section className="py-20 bg-white">

          <div className="mx-auto max-w-5xl px-6">

            <h2 className="text-4xl font-bold text-[#0F2B46]">

              Why Choose RentKA for One Way Drop Services?

            </h2>

            <p className="mt-8 text-lg leading-9 text-slate-600">

              RentKA offers fixed-price one-way transportation between major
              cities in Pakistan. Unlike traditional taxi services where
              pricing may vary, our transparent rates include a professional
              driver and fuel, allowing you to travel confidently without
              unexpected costs.

            </p>

            <p className="mt-8 text-lg leading-9 text-slate-600">

              Whether you need transportation between Islamabad and Lahore,
              Islamabad and Peshawar, Murree, Faisalabad or other destinations,
              our one-way drop service provides a comfortable alternative for
              business travellers, tourists, families and corporate clients.

            </p>

            <p className="mt-8 text-lg leading-9 text-slate-600">

              Customers looking for round trips, northern tours or customised
              itineraries can request a personalised quotation through WhatsApp,
              allowing us to recommend the most suitable vehicle and itinerary
              for their travel requirements.

            </p>

          </div>

        </section>
                {/* Booking Process */}

        <section className="bg-[#0F2B46] py-20">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Booking Process
              </span>

              <h2 className="mt-6 text-4xl font-bold text-white">
                Book Your One Way Drop in 4 Easy Steps
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Booking with RentKA is quick, transparent and hassle-free.
              </p>

            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5BAE4A] text-2xl font-bold text-white">
                  1
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#0F2B46]">
                  Select Route
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Choose your pickup city and destination using our Route Finder.
                </p>

              </div>

              <div className="rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5BAE4A] text-2xl font-bold text-white">
                  2
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#0F2B46]">
                  View Price
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Instantly view the fixed one-way price including fuel and driver.
                </p>

              </div>

              <div className="rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5BAE4A] text-2xl font-bold text-white">
                  3
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#0F2B46]">
                  Confirm Booking
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Complete your booking quickly through WhatsApp with our team.
                </p>

              </div>

              <div className="rounded-3xl bg-white p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#5BAE4A] text-2xl font-bold text-white">
                  4
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#0F2B46]">
                  Enjoy Your Journey
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Your professional driver arrives on time and takes you safely to your destination.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* FAQ */}

        <IntercityFAQ />

        {/* Final CTA */}

        <section className="py-24">

          <div className="mx-auto max-w-5xl px-6">

            <div className="rounded-[36px] bg-gradient-to-r from-[#0F2B46] to-[#143b5f] p-12 text-center">

              <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Ready To Travel?
              </span>

              <h2 className="mt-6 text-4xl font-bold text-white">

                Book Your One Way Drop Today

              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">

                Instant pricing, professional drivers,
                fuel included and transparent rates.
                Travel comfortably with RentKA.

              </p>

              <div className="mt-10 flex flex-wrap justify-center gap-5">

                <a
                  href="https://wa.me/923020589999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#5BAE4A] px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Book on WhatsApp
                </a>

                <a
                  href="#top"
                  className="rounded-xl border border-white px-8 py-4 font-semibold text-white hover:bg-white hover:text-[#0F2B46]"
                >
                  Back to Route Finder
                </a>

              </div>

            </div>

          </div>

        </section>
                {/* Related Links */}

        <section className="bg-slate-50 py-20">

          <div className="mx-auto max-w-7xl px-6">

            <div className="mx-auto max-w-3xl text-center">

              <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#5BAE4A]">
                Explore More
              </span>

              <h2 className="mt-6 text-4xl font-bold text-[#0F2B46]">
                Related RentKA Services
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Looking for airport transfers, city rentals or cars with professional drivers?
                Explore our most popular transportation solutions.
              </p>

            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

              <a
                href="/rent-a-car-islamabad"
                className="rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#0F2B46]">
                  Rent a Car Islamabad
                </h3>

                <p className="mt-4 text-slate-600">
                  Daily, weekly and monthly car rentals with professional drivers.
                </p>

              </a>

              <a
                href="/rent-a-car-rawalpindi"
                className="rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#0F2B46]">
                  Rent a Car Rawalpindi
                </h3>

                <p className="mt-4 text-slate-600">
                  Comfortable transportation throughout Rawalpindi.
                </p>

              </a>

              <a
                href="/airport-car-rental-islamabad"
                className="rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#0F2B46]">
                  Airport Transfers
                </h3>

                <p className="mt-4 text-slate-600">
                  Reliable Islamabad Airport pickup and drop-off service.
                </p>

              </a>

              <a
                href="/contact"
                className="rounded-3xl border bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="text-xl font-bold text-[#0F2B46]">
                  Contact RentKA
                </h3>

                <p className="mt-4 text-slate-600">
                  Need a custom quotation? Our team is ready to help.
                </p>

              </a>

            </div>

          </div>

        </section>

      </main>

    </>
  );
}
