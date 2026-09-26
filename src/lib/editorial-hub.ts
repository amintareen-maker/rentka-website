import type { EditorialHubItem } from "../../app/blog/components/BlogHome";
import { articles } from "../../app/blog/data";
import { guidePath, publishedTravelGuides } from "@/lib/travel-guides";

const routeCategories = new Set([
  "Azad Kashmir Travel Guide",
  "Hill Station Travel Guide",
  "Intercity Travel Guide",
  "Northern Areas Travel Guide",
  "One-Way Travel Guide",
  "Road Trip Guide",
  "Travel Guide",
]);

export const editorialDestinations = [
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Murree",
  "Faisalabad",
  "Swat",
  "Naran",
  "Hunza",
  "Skardu",
];

function matchingDestinations(...values: string[]) {
  const copy = values.join(" ").toLowerCase();
  return editorialDestinations.filter((destination) => copy.includes(destination.toLowerCase()));
}

const blogItems: EditorialHubItem[] = articles.map((article) => ({
  id: `blog:${article.slug}`,
  title: article.title,
  description: article.description,
  image: article.image,
  imageAlt: `${article.title} travel guide`,
  href: `/blog/${article.slug}`,
  readTime: article.readTime,
  category: article.category,
  section: article.category === "Airport Transfer Guide"
    ? "airport"
    : routeCategories.has(article.category)
      ? "routes"
      : "car-rental",
  destinations: matchingDestinations(article.title, article.description, article.keywords.join(" ")),
  accent: article.accent,
}));

const cityItems: EditorialHubItem[] = publishedTravelGuides.map((guide) => ({
  id: `guide:${guide.slug}`,
  title: guide.title,
  description: guide.summary,
  image: guide.featuredImage,
  imageAlt: guide.featuredImageAlt,
  href: guidePath(guide),
  readTime: guide.readTime ?? "Travel guide",
  category: "City Guide",
  section: "city",
  destinations: [guide.city.charAt(0).toUpperCase() + guide.city.slice(1)],
  accent: "bg-[#E9F4E6] text-[#347A2A]",
}));

export const editorialHubItems = [...cityItems, ...blogItems];
