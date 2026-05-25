import type { MetadataRoute } from "next";
import { cookies } from "next/headers";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let locale = "ru";
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("locale")?.value;
    if (cookieLocale === "en" || cookieLocale === "zh") locale = cookieLocale;
  } catch {
    // cookies() may not be available in all contexts
  }

  const descriptions = {
    ru: "Интерактивная платформа для тренировки экономического мышления: 25 модулей, квизы, финансовая математика, система XP и достижений. Полностью работает офлайн.",
    en: "Interactive platform for economic thinking practice: 25 modules, quizzes, financial mathematics, XP and achievement system. Works fully offline.",
    zh: "经济思维训练互动平台：25个模块、测验、金融数学、经验和成就系统。完全离线运行。",
  };

  const names = {
    ru: "Экономический тренажёр — Интерактивный тренажёр для экономистов",
    en: "EconTrainer — Interactive Platform for Economic Thinking",
    zh: "经济训练器 — 经济思维互动平台",
  };

  const shortNames = {
    ru: "ЭкономТренажёр",
    en: "EconTrainer",
    zh: "经济训练器",
  };

  return {
    name: names[locale as keyof typeof names],
    short_name: shortNames[locale as keyof typeof shortNames],
    description: descriptions[locale as keyof typeof descriptions],
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
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity"],
    lang: locale,
    dir: "ltr",
    screenshots: [
      {
        src: "/screenshots/home-desktop.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Home page with module grid",
      },
      {
        src: "/screenshots/home-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Mobile home page",
      },
    ],
    prefer_related_applications: false,
  };
}
