import type { Metadata } from "next";

import BlogHome from "./components/BlogHome";
import { articles } from "./data";

export const metadata: Metadata = {
  title: {
    absolute: "Car Rental & Pakistan Travel Guides | RentKA Journal",
  },
  description:
    "Explore chauffeur-driven car rental guides, intercity routes, airport transfers, vehicle advice and Pakistan travel information from RentKA.",
  alternates: {
    canonical: "https://rentka.co/blog",
  },
  openGraph: {
    title: "Car Rental & Pakistan Travel Guides | RentKA Journal",
    description:
      "Explore chauffeur-driven car rental guides, intercity routes, airport transfers, vehicle advice and Pakistan travel information from RentKA.",
    url: "https://rentka.co/blog",
    type: "website",
    siteName: "RentKA",
  },
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://rentka.co/blog#collection",
  url: "https://rentka.co/blog",
  name: "Car Rental & Pakistan Travel Guides | RentKA Journal",
  description:
    "Explore chauffeur-driven car rental guides, intercity routes, airport transfers, vehicle advice and Pakistan travel information from RentKA.",
  isPartOf: {
    "@id": "https://rentka.co/#website",
  },
  publisher: {
    "@id": "https://rentka.co/#organization",
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: "https://rentka.co/blog/" + article.slug,
      name: article.title,
    })),
  },
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <BlogHome />
    </>
  );
}
