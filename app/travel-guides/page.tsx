import type { Metadata } from "next";

import BlogHome from "../blog/components/BlogHome";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { editorialHubItems } from "@/lib/editorial-hub";
import { SITE_URL, WEBSITE_ID } from "@/lib/seo";

const title = "Pakistan Travel Guides, Routes and Car Rental Advice | RentKA";
const description = "Browse every published RentKA guide for Pakistan, including city itineraries, airport travel, road trips, northern routes and practical car-rental advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${SITE_URL}/travel-guides` },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: `${SITE_URL}/travel-guides`, type: "website", siteName: "RentKA", locale: "en_PK" },
};

const breadcrumbs = [{ name: "Home", href: "/" }, { name: "Travel Guides", href: "/travel-guides" }];
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
    numberOfItems: editorialHubItems.length,
    itemListElement: editorialHubItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${SITE_URL}${item.href}` })),
  },
};

export default function TravelGuidesPage() {
  return (
    <>
      <JsonLd id="travel-guides-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <JsonLd id="travel-guides-breadcrumb-schema" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(breadcrumbs)) }} />
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"><Breadcrumbs items={breadcrumbs} /></div>

      <BlogHome items={editorialHubItems} />
    </>
  );
}
