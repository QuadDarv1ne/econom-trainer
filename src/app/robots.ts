import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = BASE_URL.startsWith("http://localhost")
    ? "https://econom-trainer.vercel.app"
    : BASE_URL;

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${sitemapUrl}/sitemap.xml`,
  };
}
