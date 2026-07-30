import type { Metadata } from "next";

import BlogHome from "./components/BlogHome";
import { articles } from "./data";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: {
    absolute: "Car Rental & Pakistan Travel Guides | RentKA Journal",
  },
  description:
    "Explore car rental with driver guides, airport transfer advice, intercity routes, vehicle comparisons and practical travel information for Pakistan.",
  alternates: {
    canonical: "https://www.rentka.co/blog",
  },
  openGraph: {
    title: "Car Rental & Pakistan Travel Guides | RentKA Journal",
    description:
      "Explore car rental with driver guides, airport transfer advice, intercity routes, vehicle comparisons and practical travel information for Pakistan.",
    url: "https://www.rentka.co/blog",
    type: "website",
    siteName: "RentKA",
  },
};

const blogSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://www.rentka.co/blog#collection",
  url: "https://www.rentka.co/blog",
  name: "Car Rental & Pakistan Travel Guides | RentKA Journal",
  description:
    "Explore car rental with driver guides, airport transfer advice, intercity routes, vehicle comparisons and practical travel information for Pakistan.",
  isPartOf: {
    "@id": "https://www.rentka.co/#website",
  },
  publisher: {
    "@id": "https://www.rentka.co/#organization",
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: "https://www.rentka.co/blog/" + article.slug,
      name: article.title,
    })),
  },
};
const breadcrumbSchema = breadcrumbJsonLd([
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
]);

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} />
      </div>
      <BlogHome />
    </>
  );
}
