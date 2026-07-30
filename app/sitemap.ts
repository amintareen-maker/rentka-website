import type { MetadataRoute } from "next";

import { articles } from "./blog/data";
import { intercityRoutes } from "../src/data/intercityRoutes";
import { SITE_URL, VEHICLE_CITIES, VEHICLE_MODELS, VEHICLE_SERVICE } from "../src/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/rent-a-car-islamabad", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/rent-a-car-rawalpindi", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/airport-car-rental-islamabad", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/one-way-drop", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/cars", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/cancellation-policy", priority: 0.5, changeFrequency: "yearly" as const },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));

  const vehiclePages = VEHICLE_MODELS.flatMap((model) =>
    VEHICLE_CITIES.map((city) => ({
      url: `${SITE_URL}/cars/${model}/${city}/${VEHICLE_SERVICE}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const routePages = intercityRoutes
    .filter((route) => route.active)
    .map((route) => ({
      url: `${SITE_URL}/one-way-drop/${route.slug}`,
      changeFrequency: "weekly" as const,
      priority: route.featured ? 0.9 : 0.8,
    }));

  const articlePages = articles.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...vehiclePages, ...routePages, ...articlePages];
}
