import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Экономический тренажёр — Интерактивный тренажёр для экономистов",
    short_name: "ЭкономТренажёр",
    description:
      "Интерактивная платформа для тренировки экономического мышления: 25 модулей, квизы, финансовая математика, система XP и достижений. Полностью работает офлайн.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    scope: "/",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
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
    screenshots: [],
    prefer_related_applications: false,
  };
}
