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

export const metadata: Metadata = {
  title: {
    default: "Экономический тренажёр — Интерактивный тренажёр для экономистов",
    template: "%s | Экономический тренажёр",
  },
  description:
    "Интерактивная платформа для тренировки экономического мышления: 25 модулей, расчёт ВВП, спрос и предложение, квизы, финансовая математика, система XP и достижений.",
  keywords: [
    "экономика",
    "тренажёр",
    "ВВП",
    "макроэкономика",
    "микроэкономика",
    "финансовая математика",
    "NPV",
    "образование",
    "квиз",
    "эластичность",
  ],
  authors: [{ name: "Дуплей Максим Игоревич", url: "https://github.com/QuadDarv1ne" }],
  creator: "Дуплей Максим Игоревич",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Экономический тренажёр",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Экономический тренажёр",
    description: "Интерактивный тренажёр для экономистов — 25 модулей, квизы, XP-система",
    type: "website",
    locale: "ru_RU",
    siteName: "Экономический тренажёр",
  },
  twitter: {
    card: "summary_large_image",
    title: "Экономический тренажёр",
    description: "Интерактивный тренажёр для экономистов",
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
