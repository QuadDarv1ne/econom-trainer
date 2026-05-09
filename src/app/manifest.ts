import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ЭкономТренажёр — Интерактивный тренажёр для экономистов",
    short_name: "ЭкономТренажёр",
    description:
      "Интерактивная платформа для тренировки экономического мышления: 18 модулей, квизы, финансовая математика, система XP и достижений.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity"],
    lang: "ru",
    dir: "ltr",
  };
}
