import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, CalendarCheck, CarFront, CheckCircle2, MapPin, MessageCircle, Route, ShieldCheck } from "lucide-react";
import { hasAdminSession } from "../admin/_lib/session";
import LahoreBookingClient from "@/components/lahore/LahoreBookingClient";
import { resolveNormalRentalInventory } from "@/lib/normal-rental/inventory-resolver";
import { toPublicLahoreInventory } from "@/lib/normal-rental/public-inventory";
import { getNormalRentalBookingContext, NORMAL_RENTAL_ZONES } from "@/lib/normal-rental/zones";
import { ORGANIZATION_ID } from "@/lib/seo";

export const dynamic = "force-dynamic";

const pageUrl = "https://www.rentka.co/rent-a-car-lahore";
const title = "Rent a Car Lahore With Driver | RentKA";
const description = "Rent a car in Lahore with a professional driver for city travel or Outstation trips. View transparent prices and request your booking with RentKA.";

export function generateMetadata(): Metadata {
  const prelaunch = !NORMAL_RENTAL_ZONES.lahore.publicEnabled;
  return {
    title: { absolute: title }, description,
    robots: prelaunch ? { index: false, follow: false, noarchive: true, nosnippet: true } : { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website", siteName: "RentKA", locale: "en_PK", images: [{ url: "/hero-1.webp", alt: "RentKA car rental with driver" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/hero-1.webp"] },
  };
}

const serviceAreas = ["Gulberg", "DHA", "Johar Town", "Model Town", "Lahore Cantt", "Bahria Town Lahore", "Wapda Town", "Garden Town", "Faisal Town"];

const faqs = [
  { question: "Is a driver included with Lahore car rental?", answer: "Yes. The Lahore vehicles shown on this page are offered with a professional driver. RentKA does not currently offer self-drive rentals." },
  { question: "Can I book a car for Outstation travel from Lahore?", answer: "Yes. Select Outstation, choose an available vehicle and package duration, then provide a Google-selected pickup and destination. RentKA confirms availability and trip requirements before booking." },
  { question: "Which Lahore areas can you arrange pickup from?", answer: "Pickup can be requested across major Lahore residential and commercial areas including Gulberg, DHA, Johar Town, Model Town, Cantt, Bahria Town Lahore, Wapda Town, Garden Town and Faisal Town, subject to availability." },
  { question: "Can I book daily, weekly or monthly?", answer: "Available duration choices are shown for each vehicle. Weekly and monthly choices appear when those packages are available for your selected car." },
  { question: "Is fuel included in the displayed rental price?", answer: "No. The displayed amount is the vehicle rental estimate. Fuel, tolls, parking, overtime, driver food or accommodation and other applicable trip charges are excluded unless RentKA confirms otherwise." },
  { question: "How is my Lahore booking confirmed?", answer: "Submit the booking request with your selected car, package, date, time and Google-selected locations. RentKA then checks availability and confirms the final quotation before requesting the booking advance." },
  { question: "Can I rent a car for business meetings or a wedding in Lahore?", answer: "You can request an available with-driver vehicle for business travel, family commitments, weddings and events. Vehicle availability and any event-specific requirements are confirmed before booking." },
  { question: "What information is required to request a car?", answer: "Choose a vehicle and package, select the pickup date and time, select valid Google locations, and provide your name and phone number. Email is optional." },
];

const schemas = [
  {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.rentka.co" },
      { "@type": "ListItem", position: 2, name: "Rent a Car Lahore", item: pageUrl },
    ],
  },
  {
    "@context": "https://schema.org", "@type": "Service",
    name: "Rent a Car in Lahore With Driver", serviceType: "Car Rental With Driver",
    provider: { "@id": ORGANIZATION_ID }, areaServed: { "@type": "City", name: "Lahore" },
    url: pageUrl, description,
  },
  {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  },
];

export default async function LahoreRentalPage() {
  const prelaunch = !NORMAL_RENTAL_ZONES.lahore.publicEnabled;
  if (prelaunch && !(await hasAdminSession())) redirect("/admin/pricing-calculator");
  const context = getNormalRentalBookingContext("lahore", "lahore");
  const inventory = await resolveNormalRentalInventory({ zoneId: "lahore", cityId: "lahore", service: "withDriver" });
  const startingRate = inventory.reduce<number | undefined>((minimum, item) => {
    const rate = item.pricing.withDriver.withinCity.daily;
    return rate && (!minimum || rate < minimum) ? rate : minimum;
  }, undefined);

  return <>
    {schemas.map((schema, index) => <Script key={index} id={`lahore-schema-${index + 1}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replaceAll("<", "\\u003c") }}/>) }
    <main className="overflow-x-clip bg-white">
      {prelaunch && <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950">
        Private pre-launch page · Admin inspection only · Analytics suppressed · <Link href="/admin/pricing/inventory?zone=lahore" className="underline underline-offset-2">Manage Lahore inventory</Link>
      </div>}

      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-green-50/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-bold text-[var(--rentka-green)]"><CarFront className="h-4 w-4" aria-hidden="true"/>Lahore · With Driver</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--rentka-blue)] sm:text-5xl lg:text-6xl">Rent a Car in Lahore With Driver</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Travel within Lahore or plan an Outstation trip with a professional driver. View transparent prices, add your pickup details and request a booking in a few simple steps.</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-700">
              {["Professional driver included", "Transparent rental pricing", "Within Lahore & Outstation", "RentKA booking support"].map((point) => <span key={point} className="inline-flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-[var(--rentka-green)]" aria-hidden="true"/>{point}</span>)}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#lahore-cars" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rentka-green)] px-6 py-3.5 font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-green)] focus-visible:ring-offset-2">View Lahore Cars &amp; Prices<ArrowRight className="h-5 w-5" aria-hidden="true"/></a><a href="#how-booking-works" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-[var(--rentka-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rentka-blue)]">How booking works</a></div>
          </div>
          <aside className="rounded-[2rem] bg-[var(--rentka-blue)] p-7 text-white shadow-xl sm:p-9" aria-label="Lahore booking summary">
            <p className="text-sm font-bold uppercase tracking-widest text-green-300">Current Lahore availability</p>
            <p className="mt-4 text-4xl font-extrabold">{startingRate ? <>From PKR {startingRate.toLocaleString("en-PK")}<span className="block text-base font-semibold text-slate-300">per day</span></> : "Availability on request"}</p>
            <p className="mt-5 leading-7 text-slate-200">Choose your trip details and send a booking request. RentKA will check vehicle availability and confirm the final quotation with you.</p>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-extrabold">{inventory.length}</p><p className="mt-1 text-sm text-slate-300">car option{inventory.length === 1 ? "" : "s"}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-2xl font-extrabold">2</p><p className="mt-1 text-sm text-slate-300">travel options</p></div></div>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
        <section id="lahore-cars" className="scroll-mt-6" aria-labelledby="lahore-cars-heading">
          <div className="mb-8 max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Cars &amp; prices</p><h2 id="lahore-cars-heading" className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] sm:text-4xl">Available Cars in Lahore</h2><p className="mt-4 leading-7 text-slate-600">Compare available cars and starting daily prices for travel within Lahore or Outstation. Select a car to view its package options and request a booking.</p></div>
          <LahoreBookingClient inventory={toPublicLahoreInventory(inventory)} context={{ cityLabel: context.cityLabel }} variant="prelaunch" />
        </section>

        <section aria-labelledby="lahore-trip-types" className="grid gap-5 lg:grid-cols-2">
          <h2 id="lahore-trip-types" className="sr-only">Lahore rental trip types</h2>
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-9"><MapPin className="h-7 w-7 text-[var(--rentka-green)]" aria-hidden="true"/><h3 className="mt-4 text-2xl font-extrabold text-[var(--rentka-blue)]">Within Lahore</h3><p className="mt-3 leading-7 text-slate-600">Request a with-driver car for family travel, business meetings, daily commitments, appointments, weddings or events across Lahore. Choose only the duration options available for your selected vehicle.</p></article>
          <article className="rounded-3xl border border-slate-200 bg-[var(--rentka-blue)] p-7 text-white sm:p-9"><Route className="h-7 w-7 text-green-300" aria-hidden="true"/><h3 className="mt-4 text-2xl font-extrabold">Outstation From Lahore</h3><p className="mt-3 leading-7 text-slate-200">Plan travel outside Lahore using the selected vehicle’s Outstation package. A Google-selected destination is required, and RentKA confirms route requirements and availability before booking.</p></article>
        </section>

        <section aria-labelledby="areas-heading"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Pickup coverage</p><h2 id="areas-heading" className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] sm:text-4xl">Lahore Service Areas</h2><p className="mt-4 max-w-3xl leading-7 text-slate-600">Pickup can be requested in major residential and commercial areas across Lahore, subject to driver and vehicle availability. These are service areas, not RentKA branch addresses.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2 md:grid-cols-3">{serviceAreas.map((area) => <li key={area} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700"><MapPin className="h-4 w-4 shrink-0 text-[var(--rentka-green)]" aria-hidden="true"/>{area}</li>)}</ul></section>

        <section id="how-booking-works" aria-labelledby="booking-heading" className="rounded-[2rem] bg-slate-50 p-7 sm:p-10"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Straightforward request</p><h2 id="booking-heading" className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] sm:text-4xl">How Lahore Booking Works</h2><ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{[
          ["1", "Choose a vehicle", "Review active Lahore models and prices."], ["2", "Select your package", "Choose Within City or Outstation and duration."], ["3", "Add trip details", "Select date, time and verified Google locations."], ["4", "Submit the request", "Share your name and phone number."], ["5", "Confirm availability", "RentKA verifies the car and final quotation."],
        ].map(([number, heading, text]) => <li key={number} className="rounded-2xl bg-white p-5 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rentka-green)] font-extrabold text-white">{number}</span><h3 className="mt-4 font-extrabold text-[var(--rentka-blue)]">{heading}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></li>)}</ol></section>

        <section aria-labelledby="why-heading"><div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Why RentKA</p><h2 id="why-heading" className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] sm:text-4xl">Clear Choices, Supported Lahore Travel</h2><p className="mt-4 leading-7 text-slate-600">RentKA makes it easy to compare with-driver car rental options, understand the price and request a booking for your Lahore journey.</p></div><div className="grid gap-4 sm:grid-cols-2">{[
          [BadgeCheck, "Transparent pricing", "See the selected Lahore package rate before submitting."], [CarFront, "Available car options", "Choose from the cars currently shown for Lahore bookings."], [ShieldCheck, "Professional driver included", "Every vehicle shown is offered with a driver."], [MessageCircle, "Booking support", "RentKA checks availability and confirms the final requirements."], [CalendarCheck, "Flexible durations", "Choose daily, weekly or monthly where available."], [Building2, "Book with RentKA", "Request your car through RentKA’s official booking channels."],
        ].map(([Icon, heading, text]) => { const FeatureIcon = Icon as typeof BadgeCheck; return <article key={heading as string} className="rounded-2xl border border-slate-200 p-5"><FeatureIcon className="h-6 w-6 text-[var(--rentka-green)]" aria-hidden="true"/><h3 className="mt-3 font-extrabold text-[var(--rentka-blue)]">{heading as string}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p></article>; })}</div></div></section>
      </div>

      <section className="border-y border-slate-200 bg-slate-50"><div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8"><p className="text-sm font-bold uppercase tracking-widest text-[var(--rentka-green)]">Helpful answers</p><h2 className="mt-2 text-3xl font-extrabold text-[var(--rentka-blue)] sm:text-4xl">Lahore Car Rental FAQs</h2><div className="mt-8 divide-y divide-slate-200 rounded-3xl border border-slate-200 bg-white px-6 sm:px-8">{faqs.map((faq) => <article key={faq.question} className="py-6"><h3 className="text-lg font-extrabold text-[var(--rentka-blue)]">{faq.question}</h3><p className="mt-3 leading-7 text-slate-600">{faq.answer}</p></article>)}</div></div></section>

      <section className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8"><div className="mx-auto grid max-w-7xl gap-7 rounded-[2rem] bg-[var(--rentka-blue)] p-8 text-white sm:p-10 md:grid-cols-[1fr_auto] md:items-center"><div><h2 className="text-3xl font-extrabold">Ready to Plan Your Lahore Rental?</h2><p className="mt-3 max-w-2xl leading-7 text-slate-200">Choose a current Lahore vehicle above, or review RentKA’s booking terms and support information before requesting availability.</p></div><nav aria-label="Lahore booking resources" className="flex flex-col gap-3 sm:flex-row md:flex-col"><a href="#lahore-cars" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--rentka-green)] px-6 py-3 font-bold">Choose a Lahore car</a><Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-bold">Contact RentKA</Link><div className="flex justify-center gap-4 text-sm"><Link href="/terms" className="underline">Terms</Link><Link href="/cancellation-policy" className="underline">Cancellation policy</Link></div></nav></div></section>
    </main>
  </>;
}
