import type { MetadataRoute } from "next";
import { intercityRoutes } from "../src/data/intercityRoutes";
import { articles } from "./blog/data";

const BASE_URL = "https://www.rentka.co";
const LAST_MODIFIED = new Date("2026-07-12");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    { path: "/", priority: 1.0 },
    { path: "/rent-a-car-islamabad", priority: 0.9 },
    { path: "/rent-a-car-rawalpindi", priority: 0.9 },
    { path: "/airport-car-rental-islamabad", priority: 0.9 },
    { path: "/one-way-drop", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/privacy", priority: 0.5 },
    { path: "/terms", priority: 0.5 },
    { path: "/cancellation-policy", priority: 0.5 },
    { path: "/review", priority: 0.6 },
  ];

  staticPages.forEach((page) => {
    pages.push({
      url: `${BASE_URL}${page.path}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: page.priority,
    });
  });

  // Vehicle pages
  const models = [
    "toyota-corolla",
    "honda-civic",
    "toyota-prado",
    "toyota-hiace",
    "honda-br-v",
    "toyota-hilux",
    "honda-city",
    "suzuki-wagon-r",
    "toyota-yaris",
    "suzuki-alto",
  ];

  const cities = [
    "islamabad",
    "rawalpindi",
  ];

  models.forEach((model) => {
    cities.forEach((city) => {
      pages.push({
        url: `${BASE_URL}/cars/${model}/${city}/with-driver`,
        lastModified: LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  });

  // One-way routes
  intercityRoutes
    .filter((route) => route.active)
    .forEach((route) => {
      pages.push({
        url: `${BASE_URL}/one-way-drop/${route.slug}`,
        lastModified: LAST_MODIFIED,
        changeFrequency: "weekly",
        priority: route.featured ? 0.9 : 0.8,
      });
    });

  // Blog articles
  articles.forEach((article) => {
    pages.push({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  return pages;
}
