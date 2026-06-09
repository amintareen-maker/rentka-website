import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    {
      url: "https://www.rentka.co/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.rentka.co/rent-a-car-islamabad",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.rentka.co/rent-a-car-rawalpindi",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.rentka.co/airport-car-rental-islamabad",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

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
        url: `https://www.rentka.co/cars/${model}/${city}/with-driver`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  });

  return pages;
}