import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = BASE_URL;

  const modules = [
    "gdp",
    "supply-demand",
    "elasticity",
    "keynesian",
    "keynesian-cross",
    "inflation",
    "phillips",
    "lorenz",
    "ppf",
    "costs",
    "comparative",
    "breakeven",
    "tax",
    "game-theory",
    "market-structures",
    "price-indices",
    "economic-crises",
    "monetary-policy",
    "adas",
    "quiz",
    "finance",
    "glossary",
    "achievements",
    "progress",
    "currency",
    "is-lm",
  ];

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...modules.map((module) => ({
      url: `${baseUrl}/?tab=${module}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return routes;
}
