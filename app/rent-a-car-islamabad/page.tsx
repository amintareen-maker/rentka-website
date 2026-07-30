import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import GoogleReviews from "@/components/GoogleReviews";
import CityVehicleSelector from "@/components/city-pages/CityVehicleSelector";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ORGANIZATION_ID } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute:
    "Car Rental with Driver Islamabad | RentKA",
  },
  description:
    "Browse verified car rentals in Islamabad with professional drivers and transparent pricing. Book Corolla, Civic, Prado, Hiace and more for airport transfers, city rides, Murree trips, weddings, and family travel.",
  keywords: [
    "rent a car islamabad",
    "car rental islamabad",
    "corolla rent islamabad",
    "civic rent islamabad",
    "prado rent islamabad",
    "hiace rent islamabad",
    "car rental islamabad with driver",
    "islamabad airport transfer",
    "murree trip car rental",
    "monthly car rental islamabad",
    "wedding car rental islamabad",
  ],
  alternates: {
    canonical: "https://www.rentka.co/rent-a-car-islamabad",
  },
  openGraph: {
    title: "Rent a Car in Islamabad With Driver | RentKA",
    description:
      "Professional cars with drivers for local travel, airport transfers, corporate transport, weddings and outstation trips.",
    url: "https://www.rentka.co/rent-a-car-islamabad",
    type: "website",
    siteName: "RentKA",
    images: [{ url: "/hero-1.webp", alt: "Car rental with driver in Islamabad" }],
  },
};

const whatsappUrl =
  "https://wa.me/923020589999?text=Hello%20RentKA%2C%20I%20want%20to%20book%20a%20car%20with%20driver%20in%20Islamabad.%20Please%20share%20available%20cars%20and%20prices.";

const serviceAreas = [
  "Blue Area",
  "F-6",
  "F-7",
  "F-8",
  "F-10",
  "F-11",
  "G-6",
  "G-8",
  "G-9",
  "G-10",
  "G-11",
  "I-8",
  "I-9",
  "I-10",
  "I-11",
  "E-11",
  "Bani Gala",
  "Gulberg Greens",
  "Bahria Enclave",
  "DHA Islamabad",
  "PWD Housing Scheme",
  "Pakistan Town",
  "Islamabad International Airport",
  "Rawat",
];

const faqs = [
  {
    question: "Do you provide rent-a-car service in Islamabad with a driver?",
    answer:
      "Yes. RentKA currently provides cars with professional drivers in Islamabad for local travel, airport transfers, business requirements, events and outstation journeys.",
  },
  {
    question: "Can I book a car for Murree or northern trips from Islamabad?",
    answer:
      "Yes. Customers frequently book Prado, Hiace, Corolla and SUVs for Murree, Nathia Gali, Naran and northern travel.",
  },
  {
    question: "Which areas of Islamabad do you serve?",
    answer:
      "We serve Islamabad, Rawalpindi, DHA, Bahria Town, Blue Area and surrounding sectors.",
  },
  {
    question: "Can I arrange an airport transfer from Islamabad?",
    answer:
      "Yes. Airport pickup and drop-off can be arranged between Islamabad and Islamabad International Airport with a professional driver. Vehicle selection can be matched to your passenger and luggage requirements.",
  },
  {
    question: "Can I book a one-way or outstation trip from Islamabad?",
    answer:
      "Yes. One-way and outstation transport is available for popular routes across Pakistan. RentKA confirms the vehicle, route requirements and quotation before booking.",
  },
  {
    question: "Is advance payment required?",
    answer:
      "Yes. A 20% advance payment is required after availability and pricing are confirmed to secure the booking. The RentKA team then shares the booking confirmation.",
  },
  {
    question: "Which cars are available in Islamabad?",
    answer:
      "Availability commonly includes economy cars, sedans, family vehicles, premium SUVs and vans such as Suzuki Alto, Toyota Corolla, Honda Civic, Honda BR-V, Toyota Prado and Toyota Hiace. Live availability varies by date.",
  },
  {
    question: "Do you provide self-drive cars?",
    answer:
      "RentKA currently provides cars with professional drivers. Self-drive service is not currently available.",
  },
];

const serviceShortcuts = [
  {
    title: "Within Islamabad",
    description: "Local rides and full-day city travel",
    href: "#cars",
    icon: MapPin,
  },
  {
    title: "Airport Transfer",
    description: "Scheduled airport pickup and drop-off with a professional driver",
    href: "/airport-car-rental-islamabad",
    icon: Plane,
  },
  {
    title: "Outstation Travel",
    description: "Travel outside the twin cities",
    href: "/one-way-drop",
    icon: Route,
  },
  {
    title: "One-Way Drop",
    description: "Popular intercity one-way routes",
    href: "/one-way-drop",
    icon: ArrowRight,
  },
  {
    title: "Corporate Travel",
    description: "Transport for meetings and teams",
    href: "/blog/corporate-car-rental-islamabad",
    icon: BriefcaseBusiness,
  },
  {
    title: "Monthly Rental",
    description: "Long-term car rental with driver",
    href: "/blog/monthly-car-rental-islamabad",
    icon: CalendarCheck,
  },
  {
    title: "Wedding Cars",
    description: "Sedans and SUVs for special events",
    href: whatsappUrl,
    icon: Sparkles,
    external: true,
  },
];

const breadcrumbSchema = {
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
      name: "Rent a Car Islamabad",
      item: "https://www.rentka.co/rent-a-car-islamabad",
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Car Rental With Driver",
  name: "Rent a Car in Islamabad With Driver",
  provider: {
    "@id": ORGANIZATION_ID,
  },
  areaServed: [
    {
      "@type": "City",
      name: "Rawalpindi",
    },
    {
      "@type": "City",
      name: "Islamabad",
    },
  ],
  url: "https://www.rentka.co/rent-a-car-islamabad",
  description:
    "Car rentals in Islamabad with driver for local travel, airport transfers, corporate transport, weddings and outstation trips.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function IslamabadRentalPage() {
  return (
    <>
      <Script
        id="breadcrumb-schema-islamabad"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="service-schema-islamabad"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="faq-schema-islamabad"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="overflow-x-clip bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Rent a Car Islamabad", href: "/rent-a-car-islamabad" }]} />
        </div>
        <section className="border-b border-slate-200 bg-[#F7FAFC]">
          <div className="mx-auto grid max-w-7xl gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--rentka-green)]/20 bg-white px-4 py-2 text-sm font-bold text-[var(--rentka-green)] shadow-sm">
                <CarFront className="h-4 w-4" aria-hidden="true" />
                With Driver Only
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[var(--rentka-blue)] sm:text-5xl lg:text-6xl">
                Rent a Car in Islamabad With Driver
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Professional cars with driver for premium, corporate, wedding, airport, city, and outstation travel. Rent a car with driver in Islamabad and Rawalpindi for reliable local and intercity journeys.
              </p>

              <p className="mt-3 text-sm font-bold text-[var(--rentka-green)]">
                Car rentals. Made simple.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Professional drivers",
                  "Transparent pricing",
                  "Verified fleet partners",
                  "Fast WhatsApp booking",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--rentka-green)]" aria-hidden="true" />
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#cars"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rentka-green)] px-6 py-3.5 font-bold text-white transition hover:bg-[var(--rentka-green-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-green)] focus-visible:ring-offset-2"
                >
                  View Cars &amp; Prices
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--rentka-blue)] bg-white px-6 py-3.5 font-bold text-[var(--rentka-blue)] transition hover:bg-[var(--rentka-blue)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-blue)] focus-visible:ring-offset-2"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  Book on WhatsApp
                </a>
              </div>
            </div>

            <aside className="rounded-[2rem] bg-[var(--rentka-blue)] p-7 text-white shadow-xl sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9AD08F]">
                Quick booking
              </p>
              <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
                Find the right car in a few simple steps
              </h2>
              <div className="mt-7 space-y-5">
                {[
                  ["1", "Choose a vehicle", "Compare current cars and starting prices."],
                  ["2", "Review the package", "Select city or outstation pricing in the vehicle details."],
                  ["3", "Request availability", "Share your pickup date, time and contact details."],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rentka-green)] font-extrabold">
                      {number}
                    </span>
                    <div>
                      <h3 className="font-bold">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm leading-6 text-slate-200">
                Availability and the final quotation are confirmed by the RentKA
                team before the 20% booking advance is requested.
              </div>
            </aside>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <CityVehicleSelector city="islamabad" />

          <section>
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
                Travel your way
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] md:text-4xl">
                Driver-Included Services in Islamabad
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Book a car with an experienced driver for airport transfers, city travel, corporate transport, weddings, and outstation journeys.
              </p>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Choose the trip type that best matches your plans. Dedicated
                service pages are linked where available.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {serviceShortcuts.map((service) => {
                const Icon = service.icon;
                const className =
                  "group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--rentka-green)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-green)]";
                const content = (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--rentka-green)]/10 text-[var(--rentka-green)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-extrabold text-[var(--rentka-blue)]">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                  </>
                );

                return service.external ? (
                  <a
                    key={service.title}
                    href={service.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <Link key={service.title} href={service.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-50 p-7 sm:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
                  Why RentKA
                </p>
                <h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] md:text-4xl">
                  Clear, Supported Travel From Islamabad
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  RentKA coordinates bookings through verified fleet partners
                  while keeping the customer journey simple and transparent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  [ShieldCheck, "Driver-included service", "A professional driver is included with every available rental."],
                  [BadgeCheck, "Transparent pricing", "Review package rates and applicable conditions before confirming."],
                  [MessageCircle, "Professional support", "Get booking assistance through RentKA and WhatsApp."],
                  [CarFront, "Maintained vehicles", "Choose from active listings provided by vetted fleet partners."],
                  [Plane, "Airport and intercity travel", "Arrange city, airport and outstation transport."],
                  [Building2, "SECP-registered company", "Book through RentKA's official customer channels."],
                ].map(([Icon, title, description]) => {
                  const FeatureIcon = Icon as typeof ShieldCheck;
                  return (
                    <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <FeatureIcon className="h-6 w-6 text-[var(--rentka-green)]" aria-hidden="true" />
                      <h3 className="mt-3 font-extrabold text-[var(--rentka-blue)]">{title as string}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{description as string}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
                Local pickup coverage
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] md:text-4xl">
                Areas We Serve in Islamabad
              </h2>
              <p className="mt-4 max-w-4xl leading-7 text-slate-600">
                Pickup can be arranged from major residential, commercial and
                business areas across Islamabad, subject to vehicle and
                driver availability for your selected date.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {serviceAreas.map((area) => (
                <li
                  key={area}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--rentka-green)]" aria-hidden="true" />
                  {area}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-10">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
                Simple confirmation
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] md:text-4xl">
                How Booking Works
              </h2>
            </div>

            <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["1", "Select your car", "Compare live vehicle options and choose a suitable model."],
                ["2", "Share trip details", "Provide the pickup date, time, route and contact information."],
                ["3", "Confirm availability and price", "The RentKA team verifies the vehicle and final quotation."],
                ["4", "Secure the booking", "Pay the required 20% advance and receive booking confirmation."],
              ].map(([number, title, description]) => (
                <li key={number} className="rounded-2xl bg-slate-50 p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rentka-green)] font-extrabold text-white">
                    {number}
                  </span>
                  <h3 className="mt-4 font-extrabold text-[var(--rentka-blue)]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <GoogleReviews />

        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--rentka-green)]">
            Helpful answers
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] md:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6 sm:px-8">
            {faqs.map((faq) => (
              <article key={faq.question} className="py-6">
                <h3 className="text-lg font-extrabold text-[var(--rentka-blue)]">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-[var(--rentka-blue)] p-8 text-white shadow-xl md:grid-cols-[1.15fr_0.85fr] md:items-center md:p-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#9AD08F]">
                Islamabad bookings
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to Book a Car in Islamabad?
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-200">
                Compare current cars and prices, or speak with RentKA for help
                planning your car rental with driver.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="#cars"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rentka-green)] px-6 py-3.5 font-bold text-white transition hover:bg-[var(--rentka-green-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                View Cars &amp; Prices
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Book on WhatsApp
              </a>
              <a
                href="tel:+923020589999"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                Call 0302 058 9999
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
