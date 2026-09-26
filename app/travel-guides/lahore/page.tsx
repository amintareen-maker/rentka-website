import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { GUIDE_CITIES, publishedTravelGuides, travelGuides, guidePath } from "@/lib/travel-guides";
import { SITE_URL, WEBSITE_ID } from "@/lib/seo";

const city = GUIDE_CITIES.lahore;
const title = "Lahore Travel Guides, Itineraries and Visitor Planning | RentKA";
const description = "Plan a Lahore visit with practical guidance on sightseeing routes, family attractions, airport arrival, timing and getting around with a driver.";
const lahoreGuides = travelGuides.filter((guide) => guide.city === "lahore");
const published = publishedTravelGuides.filter((guide) => guide.city === "lahore");
const breadcrumbs = [{ name: "Home", href: "/" }, { name: "Travel Guides", href: "/travel-guides" }, { name: "Lahore", href: city.href }];

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}${city.href}` },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: `${SITE_URL}${city.href}`, type: "website", siteName: "RentKA", locale: "en_PK" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}${city.href}#collection`,
  url: `${SITE_URL}${city.href}`,
  name: title,
  description,
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@type": "City", name: "Lahore", containedInPlace: { "@type": "Country", name: "Pakistan" } },
  mainEntity: { "@type": "ItemList", numberOfItems: published.length, itemListElement: published.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: `${SITE_URL}${guidePath(guide)}` })) },
};

export default function LahoreTravelGuidesPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <JsonLd id="lahore-guides-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <JsonLd id="lahore-guides-breadcrumb-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }} />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"><Breadcrumbs items={breadcrumbs} /></div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="font-bold uppercase tracking-wider text-[#347A2A]">Lahore visitor planning</p>
          <h1 className="mt-3 text-4xl font-black text-[#0F2B46] sm:text-6xl">Lahore travel guides and sightseeing plans</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">Lahore rewards unhurried planning. Historic attractions cluster around the Walled City, while museums, gardens, food streets and newer districts require realistic travel time between stops. This hub organizes practical, locally focused guides without creating thin category or filter pages.</p>
        </div>

        <section className="mt-12 grid gap-6 lg:grid-cols-3" aria-labelledby="lahore-planning-basics">
          <h2 id="lahore-planning-basics" className="sr-only">Lahore planning basics</h2>
          {[
            ["Plan by area", "Group Walled City landmarks together and leave separate time for Mall Road, gardens or newer districts."],
            ["Allow for traffic", "Build margin around peak hours, major events and busy approaches to historic attractions."],
            ["Match transport to the day", "A driver can simplify parking and multi-stop movement, especially for families or first-time visitors."],
          ].map(([heading, copy]) => <div key={heading} className="rounded-2xl bg-white p-6 shadow-sm"><h3 className="text-xl font-bold text-[#0F2B46]">{heading}</h3><p className="mt-3 leading-7 text-slate-600">{copy}</p></div>)}
        </section>

        <section className="mt-14" aria-labelledby="lahore-guide-library">
          <h2 id="lahore-guide-library" className="text-3xl font-black text-[#0F2B46]">Lahore guide library</h2>
          {published.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {published.map((guide) => <Link key={guide.slug} href={guidePath(guide)} className="rounded-2xl bg-white p-6 shadow-sm"><h3 className="text-xl font-bold text-[#0F2B46]">{guide.title}</h3><p className="mt-3 text-slate-600">{guide.summary}</p><span className="mt-4 inline-block font-bold text-[#347A2A]">Read guide →</span></Link>)}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-950">The first Lahore guides are in editorial preparation.</p>
              <p className="mt-2 text-amber-900">They will appear here only after local review and substantive publication.</p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-amber-950">{lahoreGuides.map((guide) => <li key={guide.slug}>{guide.title}</li>)}</ul>
            </div>
          )}
        </section>

        <section className="mt-14 rounded-3xl bg-white p-8 shadow-sm" aria-labelledby="lahore-transport-links">
          <h2 id="lahore-transport-links" className="text-2xl font-bold text-[#0F2B46]">Useful Lahore transport options</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Link href="/rent-a-car-lahore" className="rounded-xl border border-slate-200 p-5 font-bold text-[#347A2A]">Car rental with driver →</Link>
            <Link href="/airport-car-rental-lahore" className="rounded-xl border border-slate-200 p-5 font-bold text-[#347A2A]">Lahore airport transfer →</Link>
            <Link href="/one-way-drop/islamabad-to-lahore" className="rounded-xl border border-slate-200 p-5 font-bold text-[#347A2A]">Islamabad to Lahore →</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
