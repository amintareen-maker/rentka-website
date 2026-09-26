import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo";
import { lahoreFamilyPlacesGuide } from "@/lib/travel-guides/lahore-family-places";
import { lahoreFirstTimeVisitorsGuide } from "@/lib/travel-guides/lahore-first-time-visitors";
import { lahoreOneDayPlanGuide } from "@/lib/travel-guides/lahore-one-day-plan";

export const GUIDE_CITIES = {
  lahore: {
    name: "Lahore",
    description: "Practical planning guides for family visits, first trips and sightseeing days in Lahore.",
    href: "/travel-guides/lahore",
  },
} as const;

export type GuideCitySlug = keyof typeof GUIDE_CITIES;
export type GuideStatus = "draft" | "published";

export type TravelGuide = {
  city: GuideCitySlug;
  slug: string;
  status: GuideStatus;
  title: string;
  seoTitle: string;
  metaDescription: string;
  summary: string;
  featuredImage: string;
  featuredImageAlt: string;
  datePublished?: string;
  dateModified?: string;
  readTime?: string;
  keywords: string[];
  outline: string[];
  sections: Array<{ id: string; heading: string; paragraphs: string[] }>;
  commercialLinks: Array<{ href: string; label: string; description: string }>;
};

export const travelGuides: TravelGuide[] = [
  lahoreFamilyPlacesGuide,
  lahoreOneDayPlanGuide,
  lahoreFirstTimeVisitorsGuide,
];

export const publishedTravelGuides = travelGuides.filter((guide) => guide.status === "published" && guide.sections.length > 0);

export function guidePath(guide: Pick<TravelGuide, "city" | "slug">) {
  return `/travel-guides/${guide.city}/${guide.slug}`;
}

export function getPublishedGuide(city: string, slug: string) {
  return publishedTravelGuides.find((guide) => guide.city === city && guide.slug === slug);
}

export function buildGuideArticleSchema(guide: TravelGuide) {
  const url = `${SITE_URL}${guidePath(guide)}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: guide.title,
    description: guide.metaDescription,
    image: new URL(guide.featuredImage, SITE_URL).toString(),
    datePublished: guide.datePublished,
    dateModified: guide.dateModified ?? guide.datePublished,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: `${GUIDE_CITIES[guide.city].name} Travel Guides`,
    keywords: guide.keywords.join(", "),
  };
}
