import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = BASE_URL;

  const modules = [
    "gdp",
    "supply-demand",
    "elasticity",
    "keynesian",
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
      lastModified: new Date("2025-01-01"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...modules.map((module) => ({
      url: `${baseUrl}/?tab=${module}`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return routes;
}
