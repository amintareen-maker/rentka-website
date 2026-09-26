import type { Metadata } from "next";
import Link from "next/link";

import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { GUIDE_CITIES, publishedTravelGuides } from "@/lib/travel-guides";
import { SITE_URL, WEBSITE_ID } from "@/lib/seo";

const title = "Pakistan Travel Guides and City Planning | RentKA";
const description = "Plan city visits and road journeys in Pakistan with practical RentKA guides covering sightseeing, arrival, timing and travel with a professional driver.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/travel-guides` },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: `${SITE_URL}/travel-guides`, type: "website", siteName: "RentKA", locale: "en_PK" },
};

const breadcrumbs = [{ name: "Home", href: "/" }, { name: "Travel Guides", href: "/travel-guides" }];
const cityEntries = Object.entries(GUIDE_CITIES);
const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE_URL}/travel-guides#collection`,
  url: `${SITE_URL}/travel-guides`,
  name: title,
  description,
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: cityEntries.length,
    itemListElement: cityEntries.map(([slug, city], index) => ({ "@type": "ListItem", position: index + 1, name: `${city.name} Travel Guides`, url: `${SITE_URL}/travel-guides/${slug}` })),
  },
};

export default function TravelGuidesPage() {
  return (
    <main className="bg-slate-50 pb-16">
      <JsonLd id="travel-guides-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <JsonLd id="travel-guides-breadcrumb-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }} />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"><Breadcrumbs items={breadcrumbs} /></div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="font-bold uppercase tracking-wider text-[#347A2A]">RentKA travel planning</p>
          <h1 className="mt-3 text-4xl font-black text-[#0F2B46] sm:text-6xl">Practical travel guides for exploring Pakistan</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">Use our city guides to plan realistic sightseeing days, understand where major attractions sit, and coordinate airport, city and intercity travel. Every published guide is reviewed for local usefulness before it appears here.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {cityEntries.map(([slug, city]) => {
            const publishedCount = publishedTravelGuides.filter((guide) => guide.city === slug).length;
            return (
              <Link key={slug} href={city.href} className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="text-sm font-bold uppercase tracking-wider text-[#347A2A]">City guide</p>
                <h2 className="mt-2 text-3xl font-black text-[#0F2B46]">{city.name}</h2>
                <p className="mt-4 leading-7 text-slate-600">{city.description}</p>
                <p className="mt-6 font-bold text-[#347A2A]">Explore {city.name}{publishedCount ? ` · ${publishedCount} published guides` : " planning"} →</p>
              </Link>
            );
          })}
        </div>

        <section className="mt-14 rounded-3xl bg-[#0F2B46] p-8 text-white" aria-labelledby="travel-options">
          <h2 id="travel-options" className="text-2xl font-bold">Need transport for the itinerary?</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-200">RentKA provides cars with professional drivers for city travel, airport transfers and one-way intercity journeys. Guide content remains informational; availability and quotations are confirmed separately.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/rent-a-car-lahore" className="rounded-xl bg-[#5BAE4A] px-5 py-3 font-bold text-white">Lahore car rental</Link>
            <Link href="/one-way-drop" className="rounded-xl border border-white/40 px-5 py-3 font-bold">One-way travel</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
