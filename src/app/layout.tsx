import type React from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerLocale, t as serverT } from '@/lib/server-locale';
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "dark light",
};

const siteTitle = "Экономический тренажёр";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLocale();
  const title = lang === 'en' ? 'EconTrainer — Interactive Economics Trainer'
    : lang === 'zh' ? 'EconTrainer — 互动经济学训练器'
    : `${siteTitle} — Интерактивный тренажёр для экономистов`;
  const description = lang === 'en'
    ? 'Interactive platform for training economic thinking: 25 modules, GDP calculation, supply and demand, quizzes, financial math, XP and achievements system.'
    : lang === 'zh'
      ? '训练经济思维的互动平台：25个模块、GDP计算、供需、测验、金融数学、XP和成就系统。'
      : 'Интерактивная платформа для тренировки экономического мышления: 25 модулей, расчёт ВВП, спрос и предложение, квизы, финансовая математика, система XP и достижений.';
  return {
    title: {
      default: title,
      template: `%s | ${siteTitle}`,
    },
    description,
    keywords: [
      "экономика", "тренажёр", "ВВП", "макроэкономика", "микроэкономика",
      "финансовая математика", "NPV", "образование", "квиз", "эластичность",
    ],
    authors: [{ name: "Дуплей Максим Игоревич", url: "https://github.com/QuadDarv1ne" }],
    creator: "Дуплей Максим Игоревич",
    icons: {
      icon: "/logo.svg",
      apple: "/logo.svg",
    },
    appleWebApp: {
      capable: true,
      title: siteTitle,
      statusBarStyle: "black-translucent",
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU',
      siteName: siteTitle,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@QuadDarv1ne",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (process.env.NODE_ENV === 'production') {
    const { validateEnv } = await import('@/lib/env-check');
    const issues = validateEnv();
    for (const issue of issues) {
      // eslint-disable-next-line no-console
      console.warn(`[env-check] ${issue.key}: ${issue.message}`);
    }
  }

  const lang = await getServerLocale();
  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:border-2 focus:border-primary focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          {serverT('common.skipToContent', lang)}
        </a>
          <Providers>
            <div id="main-content">{children}</div>
          </Providers>
      </body>
    </html>
  );
}
