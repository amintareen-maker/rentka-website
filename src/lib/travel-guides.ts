import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo";
import { lahoreFamilyPlacesGuide } from "@/lib/travel-guides/lahore-family-places";

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
  {
    city: "lahore",
    slug: "one-day-lahore-sightseeing-plan",
    status: "draft",
    title: "One Day Lahore Sightseeing Plan",
    seoTitle: "One Day Lahore Sightseeing Plan and Route | RentKA",
    metaDescription: "Organize one day of Lahore sightseeing with a realistic route, suggested timing, key stops and transport planning advice.",
    summary: "A realistic morning-to-evening route for visitors who have one day to explore Lahore.",
    featuredImage: "/hero-4.webp",
    featuredImageAlt: "One-day sightseeing route through Lahore",
    keywords: ["one day Lahore itinerary", "Lahore sightseeing plan", "Lahore day tour"],
    outline: ["Morning start", "Old Lahore route", "Lunch and rest window", "Afternoon and evening stops"],
    sections: [],
    commercialLinks: [
      { href: "/rent-a-car-lahore", label: "Book a Lahore car with driver", description: "Keep a multi-stop sightseeing day coordinated." },
      { href: "/one-way-drop/islamabad-to-lahore", label: "Islamabad to Lahore one-way travel", description: "Plan an intercity arrival before sightseeing." },
    ],
  },
  {
    city: "lahore",
    slug: "lahore-travel-guide-for-first-time-visitors",
    status: "draft",
    title: "Lahore Travel Guide for First-Time Visitors",
    seoTitle: "Lahore Travel Guide for First-Time Visitors | RentKA",
    metaDescription: "A practical first-time Lahore travel guide covering areas, weather, sightseeing, airport arrival and getting around the city.",
    summary: "Essential orientation for a first Lahore visit, from arrival and neighbourhoods to sightseeing and local travel.",
    featuredImage: "/hero-4.webp",
    featuredImageAlt: "First-time visitor exploring Lahore",
    keywords: ["Lahore travel guide", "first time in Lahore", "visit Lahore"],
    outline: ["When to visit", "Where major sights are", "Airport and city transport", "Local planning essentials"],
    sections: [],
    commercialLinks: [
      { href: "/airport-car-rental-lahore", label: "Lahore airport car rental", description: "Arrange a driver-led airport arrival." },
      { href: "/rent-a-car-lahore", label: "Explore Lahore with a driver", description: "Compare city and daily rental options." },
    ],
  },
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
