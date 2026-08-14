// FILE PATH:
// src/app/airport-transfer/islamabad/page.tsx

import Link from "next/link";
import Script from "next/script";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ORGANIZATION_ID } from "@/lib/seo";
import AirportBookingEngine from "@/components/airport/AirportBookingEngine";

export const metadata = {
  title: { absolute: "Islamabad Airport Transfer with Driver | RentKA" },
  description:
    "Book reliable Islamabad airport transfer service with driver. Airport pickup and drop with fuel included, professional drivers, transparent pricing, and 24/7 airport transportation in Islamabad.",
  keywords: [
    "Islamabad airport transfer",
    "Islamabad airport pickup",
    "Islamabad airport drop service",
    "airport transfer Islamabad",
    "Islamabad airport taxi",
    "airport pickup Islamabad",
    "Islamabad airport car rental with driver",
    "Islamabad airport transfer service",
    "Islamabad airport transportation",
    "Islamabad airport transfer service",
    "Islamabad airport ride",
    "Islamabad airport cab",
    "airport pickup and drop Islamabad",
    "airport car service Islamabad",
    "Islamabad airport travel service",
    "airport transfer Pakistan",
    "Islamabad airport booking",
    "Islamabad airport rent a car",
    "Islamabad airport driver service",
    "RentKA Islamabad airport transfer",
  ],
  alternates: {
    canonical: "https://www.rentka.co/airport-car-rental-islamabad",
  },
  openGraph: {
    title: "Islamabad Airport Transfer Service | RentKA",
    description:
      "Professional airport pickup and drop service in Islamabad with driver, fuel included pricing, and 24/7 availability.",
    url: "https://www.rentka.co/airport-car-rental-islamabad",
    siteName: "RentKA",
    locale: "en_PK",
    type: "website",
    images: [{ url: "/blog/airport-transfer.png", alt: "Islamabad airport transfer with driver" }],
  },
};

export default function IslamabadAirportTransferPage() {
  return (
    <>
      <Script
        id="breadcrumb-schema-airport"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
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
                name: "Islamabad Airport Transfer",
                item: "https://www.rentka.co/airport-car-rental-islamabad",
              },
            ],
          }),
        }}
      />

      <Script
        id="airport-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Airport Transfer Service",
            name: "Islamabad Airport Transfer Service",
            provider: {
              "@id": ORGANIZATION_ID,
            },
            areaServed: [
              "Islamabad",
              "Rawalpindi",
              "Islamabad International Airport",
            ],
            url: "https://www.rentka.co/airport-car-rental-islamabad",
          }),
        }}
      />

      <Script
        id="airport-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Do you provide late-night airport pickup?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, RentKA provides 24/7 airport pickup and drop services.",
                },
              },
              {
                "@type": "Question",
                name: "Do you accept cash payments?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Customers can pay through bank transfer or JazzCash.",
                },
              },
              {
                "@type": "Question",
                name: "Can I book airport transfer directly on WhatsApp?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, airport transfers can be booked directly through WhatsApp.",
                },
              },
              {
                "@type": "Question",
                name: "Does airport transfer pricing include fuel?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, all airport transfer rates displayed on this page include fuel charges.",
                },
              },
            ],
          }),
        }}
      />

      <main className="bg-white text-[#0F2B46] overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Islamabad Airport Transfer", href: "/airport-car-rental-islamabad" }]} />
      </div>

      {/* HERO SECTION */}
      <section className="bg-[#0F2B46] text-white px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* LEFT CONTENT */}
          <div className="w-full">

            {/* BADGE */}
            <div className="mb-5">
              <span className="inline-flex items-center gap-2 bg-[#5BAE4A] text-white px-4 py-2 rounded-full text-xs md:text-sm font-semibold shadow-lg">
                🚖 24/7 Airport Pickup & Drop
              </span>
            </div>

            {/* HEADING */}
            <h1 className="text-[42px] sm:text-3xl lg:text-5xl font-black leading-[1] sm:leading-[0.95] tracking-[-1.5px] sm:tracking-[-2px] mb-5 md:mb-2">

              Islamabad Airport

              <span className="block text-[#5BAE4A] mt-2">
                Transfer Service
              </span>

            </h1>

            {/* DESCRIPTION */}
            <p className="text-[15px] sm:text-[17px] md:text-xl text-gray-300 leading-[1.7] md:leading-[1.8] mb-7 md:mb-8 max-w-xl">
              Reliable airport pickup and drop service in Islamabad with
              professional drivers, clean cars, fuel included pricing,
              and comfortable travel for families, business travelers,
              tourists, and overseas Pakistanis.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-7 md:mb-8">

              <a
                href="#airport-booking"
                className="bg-[#5BAE4A] hover:bg-[#4ca53d] text-white text-center px-6 md:px-7 py-3.5 md:py-4 rounded-2xl font-bold text-base md:text-lg transition duration-300 shadow-xl"
              >
                Calculate Exact Fare
              </a>

              <a
                href="https://wa.me/923020589999"
                target="_blank"
                className="border border-white/20 bg-white/5 backdrop-blur text-center px-6 md:px-7 py-3.5 md:py-4 rounded-2xl font-semibold text-base md:text-lg hover:bg-white hover:text-[#0F2B46] transition duration-300"
              >
                WhatsApp Assistance
              </a>

            </div>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">

              <div className="bg-[#5BAE4A] text-white p-3.5 md:p-4 rounded-2xl font-medium shadow-lg text-[13px] sm:text-sm md:text-base leading-relaxed">
                ✔ Charges Explained Upfront
              </div>

              <div className="bg-[#5BAE4A] text-white p-3.5 md:p-4 rounded-2xl font-medium shadow-lg text-[13px] sm:text-sm md:text-base leading-relaxed">
                ✔ Professional Drivers
              </div>

              <div className="bg-[#5BAE4A] text-white p-3.5 md:p-4 rounded-2xl font-medium shadow-lg text-[13px] sm:text-sm md:text-base leading-relaxed">
                ✔ Family Friendly Service
              </div>

              <div className="bg-[#5BAE4A] text-white p-3 md:p-4 rounded-2xl font-medium shadow-lg text-[13px] sm:text-sm md:text-base leading-relaxed">
                ✔ Fuel Included Rates
              </div>

            </div>

          </div>

          {/* PRICING CARD */}
          <div className="w-full">

            <a
              href="#airport-booking"
              className="group block bg-white text-[#0F2B46] rounded-[32px] p-6 md:p-9 shadow-[0_20px_70px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_90px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition duration-300"
            >

              <div className="flex items-start justify-between gap-4 mb-7">

                <div>

                  <span className="text-[#5BAE4A] font-bold text-xs md:text-sm uppercase tracking-[2px]">
                    Instant route-based quote
                  </span>

                  <h2 className="text-3xl md:text-5xl font-black leading-tight mt-3 tracking-[-1px]">
                    See Your Exact Airport Fare
                  </h2>

                </div>

                <span className="hidden md:block text-[#5BAE4A] text-3xl opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </div>

              <p className="rounded-2xl bg-slate-50 p-5 text-lg leading-relaxed text-slate-600">
                Airport transfers from Rs 5,000. Calculate the exact fare for your route, travel time, luggage, and vehicle below.
              </p>

              <div className="mt-7 flex items-center justify-between gap-4">

                <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                  Google route distance and current airport pricing determine the quotation shown before you submit.
                </p>

                <span className="hidden md:block text-sm font-semibold text-[#5BAE4A] whitespace-nowrap">
                  Calculate fare
                </span>

              </div>

            </a>

          </div>

        </div>
      </section>

      <AirportBookingEngine />

      <section className="bg-white px-4 py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#5BAE4A] md:text-sm">Islamabad Airport Pickup & Drop-off</span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-1px] text-[#0F2B46] md:text-5xl">Private Islamabad Airport Transfer Service, Day or Night</h2>
            <p className="mt-6 text-base leading-8 text-slate-600 md:text-lg">RentKA provides an Islamabad Airport Pickup Service and Islamabad Airport Drop-off Service between Islamabad International Airport and homes, hotels, offices, embassies, hospitals, and destinations across Islamabad and Rawalpindi. The airport is also widely searched by travellers using the former Benazir Bhutto International Airport name. Whether you need an Islamabad to Airport Car Service or an Airport to City Transfer in Islamabad, the instant quote above explains the route-based fare before you submit.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 p-6"><h3 className="text-xl font-black">24/7 airport taxi alternative</h3><p className="mt-3 leading-7 text-slate-600">Pre-book early-morning arrivals, late-night departures, or daytime travel with a private airport chauffeur in Islamabad. Flight details help RentKA coordinate timing and monitor schedule changes when operationally available.</p></article>
            <article className="rounded-3xl border border-slate-200 p-6"><h3 className="text-xl font-black">Family, business and VIP transfers</h3><p className="mt-3 leading-7 text-slate-600">Choose a sedan for individual or business travel, a larger vehicle for families and luggage, or a premium option for executives and VIP guests. Drivers and vehicles are checked through RentKA&apos;s partner process, with professional coordination and luggage assistance.</p></article>
            <article className="rounded-3xl border border-slate-200 p-6"><h3 className="text-xl font-black">Transparent fare and journey planning</h3><p className="mt-3 leading-7 text-slate-600">The calculator uses the Google route distance and the selected vehicle rules rather than presenting a generic taxi estimate. Typical travel between Islamabad city and the airport is often around 30 to 50 minutes, but traffic, exact location, weather, and security checks can change the journey time.</p></article>
          </div>
          <p className="mt-8 rounded-2xl bg-slate-50 p-5 leading-7 text-slate-600"><strong className="text-[#0F2B46]">What is included?</strong> Fuel and a professional driver are identified in each quotation. Any toll, parking, waiting, or timing-related item is shown with the selected vehicle so customers can compare fixed inclusions with route-dependent charges before requesting availability.</p>
        </div>
      </section>

      {/* VEHICLE SECTION */}
      <section className="bg-[#F8FAFC] py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12 md:mb-14">

            <span className="text-[#5BAE4A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
              Vehicle Options
            </span>

            <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#0F2B46] leading-tight tracking-[-1px]">
              Airport Transfer Vehicle Options
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-7">

            {/* COROLLA */}
            <a
              href="https://wa.me/923020589999?text=Hi%20RentKA%2C%20I%20want%20to%20book%20Toyota%20Corolla%20for%20Islamabad%20Airport%20Transfer."
              target="_blank"
              className="group bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition duration-300"
            >

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-2xl md:text-3xl font-black text-[#0F2B46] tracking-[-1px]">
                  Toyota Corolla
                </h3>

                <span className="text-[#5BAE4A] text-xl opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </div>

              <p className="text-gray-600 mb-8 leading-[1.8] text-base md:text-lg">
                Reliable and comfortable sedan ideal for airport pickups,
                business travel, and family transfers.
              </p>

              <div className="flex items-center justify-between">

                <p className="text-[#5BAE4A] font-black text-2xl md:text-3xl">
                  Rs 5,000
                </p>

                <span className="text-sm text-gray-400 font-medium">
                  Tap to inquire
                </span>

              </div>

            </a>

            {/* BRV */}
            <a
              href="https://wa.me/923020589999?text=Hi%20RentKA%2C%20I%20want%20to%20book%20Honda%20BR-V%20for%20Islamabad%20Airport%20Transfer."
              target="_blank"
              className="group bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition duration-300"
            >

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-2xl md:text-3xl font-black text-[#0F2B46] tracking-[-1px]">
                  Honda BR-V
                </h3>

                <span className="text-[#5BAE4A] text-xl opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </div>

              <p className="text-gray-600 mb-8 leading-[1.8] text-base md:text-lg">
                Spacious SUV perfect for families, extra luggage,
                and comfortable airport transfers.
              </p>

              <div className="flex items-center justify-between">

                <p className="text-[#5BAE4A] font-black text-2xl md:text-3xl">
                  Rs 8,000
                </p>

                <span className="text-sm text-gray-400 font-medium">
                  Tap to inquire
                </span>

              </div>

            </a>

            {/* PRADO */}
            <a
              href="https://wa.me/923020589999?text=Hi%20RentKA%2C%20I%20want%20to%20book%20Toyota%20Prado%20for%20Islamabad%20Airport%20Transfer."
              target="_blank"
              className="group bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition duration-300"
            >

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-2xl md:text-3xl font-black text-[#0F2B46] tracking-[-1px]">
                  Toyota Prado
                </h3>

                <span className="text-[#5BAE4A] text-xl opacity-0 group-hover:opacity-100 transition">
                  →
                </span>

              </div>

              <p className="text-gray-600 mb-8 leading-[1.8] text-base md:text-lg">
                Premium luxury SUV for VIP guests, executives,
                overseas Pakistanis, and luxury travel.
              </p>

              <div className="flex items-center justify-between">

                <p className="text-[#5BAE4A] font-black text-2xl md:text-3xl">
                  Rs 15,000
                </p>

                <span className="text-sm text-gray-400 font-medium">
                  Tap to inquire
                </span>

              </div>

            </a>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14">

            <span className="text-[#5BAE4A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
              Simple Booking Process
            </span>

            <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#0F2B46] leading-tight tracking-[-1px]">
              How Airport Pickup Works
            </h2>

            <p className="text-gray-600 mt-5 max-w-2xl mx-auto leading-[1.8] text-base md:text-xl">
              Quick and smooth booking process with professional coordination
              from reservation to airport pickup.
            </p>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

            {[
              {
                number: "1",
                title: "Enter Trip Details",
                description:
                  "Choose pickup or drop-off, route, date, time, passengers, and luggage in the instant quote form.",
              },
              {
                number: "2",
                title: "See Exact Fare",
                description:
                  "Review route distance, estimated travel time, vehicle options, and the calculated fare.",
              },
              {
                number: "3",
                title: "Choose Your Vehicle",
                description:
                  "Select the vehicle that fits your passenger and luggage requirements.",
              },
              {
                number: "4",
                title: "Submit Booking",
                description:
                  "Send your contact and optional flight details for RentKA to check availability.",
              },
              {
                number: "5",
                title: "Pay Advance",
                description:
                  "After availability is confirmed, RentKA will share the advance payment instructions. Payment is not collected on this page yet.",
              },
              {
                number: "6",
                title: "Driver Assigned",
                description:
                  "Driver and vehicle details are shared before travel. WhatsApp remains available for assistance throughout.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className="text-center"
              >

                <div className="w-20 h-20 rounded-full bg-[#5BAE4A] text-white flex items-center justify-center mx-auto text-3xl font-black shadow-xl mb-5">
                  {step.number}
                </div>

                <h3 className="text-xl md:text-2xl font-black text-[#0F2B46] mb-3 tracking-[-0.5px]">
                  {step.title}
                </h3>

                <p className="text-gray-600 leading-[1.8] text-sm md:text-base">
                  {step.description}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>
      {/* RELATED CAR RENTAL LINKS */}
      <section className="py-16 md:py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-12">

            <span className="text-[#5BAE4A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
              Explore More Options
            </span>

            <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#0F2B46] leading-tight tracking-[-1px]">
  Popular Car Rentals In Islamabad & Rawalpindi
</h2>

<p className="text-gray-600 mt-5 max-w-3xl mx-auto leading-[1.8] text-base md:text-lg">
  RentKA serves both Islamabad and Rawalpindi through a shared network
  of verified rental partners. Most vehicles are available for customers
  across both cities, including airport transfers, city travel, family
  trips and corporate transportation.
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
      <section className="bg-[#F8FAFC] py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">

            <span className="text-[#5BAE4A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
              FAQs
            </span>

            <h2 className="text-3xl md:text-5xl font-black mt-4 text-[#0F2B46] leading-tight tracking-[-1px]">
              Frequently Asked Questions
            </h2>

          </div>

          <div className="space-y-5">

            {[
              {
                q: "Do you provide late-night airport pickup?",
                a: "Yes, RentKA provides 24/7 airport pickup and drop services. If you contact us outside reservation hours, simply leave your query on WhatsApp and our team will get back to you during operational hours.",
              },
              {
                q: "Do you accept cash payments?",
                a: "For security and booking confirmation purposes, RentKA does not encourage cash payments. Customers can conveniently pay through bank transfer or JazzCash.",
              },
              {
                q: "Can I book airport transfer directly on WhatsApp?",
                a: "Yes, you can confirm your Islamabad airport transfer directly through WhatsApp.",
              },
              {
                q: "Does airport transfer pricing include fuel?",
                a: "Yes, all airport transfer rates displayed on this page include fuel charges.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-[24px] p-6 md:p-7 border border-gray-100 shadow-sm"
              >

                <h3 className="font-black text-xl md:text-2xl mb-3 text-[#0F2B46] tracking-[-0.5px]">
                  {faq.q}
                </h3>

                <p className="text-gray-600 leading-[1.8] text-sm md:text-base">
                  {faq.a}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto bg-[#0F2B46] rounded-[32px] md:rounded-[40px] p-8 md:p-14 text-center text-white shadow-2xl">

          <span className="text-[#A8E39A] font-bold uppercase tracking-[2px] text-xs md:text-sm">
            Ready To Book?
          </span>

          <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6 leading-tight tracking-[-2px]">
            Book Your Islamabad Airport Transfer
          </h2>

          <p className="text-base md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-[1.8]">
            Fast response, professional drivers, fuel included pricing,
            and comfortable airport pickup and drop services in Islamabad.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">

            <a
              href="https://wa.me/923020589999"
              target="_blank"
              className="bg-[#5BAE4A] hover:bg-[#4ca53d] text-white px-8 py-4 rounded-2xl font-bold text-lg transition shadow-xl"
            >
              WhatsApp Now
            </a>

            <Link
              href="/cars"
              className="border border-white/20 bg-white/5 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white hover:text-[#0F2B46] transition"
            >
              View Cars
            </Link>

          </div>

        </div>
      </section>

    </main>
    </>
  );
}
