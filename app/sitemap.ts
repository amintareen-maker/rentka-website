import type { MetadataRoute } from "next";

import { articles } from "./blog/data";
import { intercityRoutes } from "../src/data/intercityRoutes";
import { SITE_URL, VEHICLE_CITIES, VEHICLE_MODELS, VEHICLE_SERVICE } from "../src/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "/", priority: 1 },
    { path: "/rent-a-car-islamabad", priority: 0.9 },
    { path: "/rent-a-car-rawalpindi", priority: 0.9 },
    { path: "/airport-car-rental-islamabad", priority: 0.9 },
    { path: "/one-way-drop", priority: 0.9 },
    { path: "/cars", priority: 0.8 },
    { path: "/blog", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.5 },
    { path: "/terms", priority: 0.5 },
    { path: "/cancellation-policy", priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
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
