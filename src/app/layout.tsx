import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
    "Интерактивная платформа для тренировки экономического мышления: 18 модулей, расчёт ВВП, спрос и предложение, квизы, финансовая математика, система XP и достижений.",
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
    title: "ЭкономТренажёр",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Экономический тренажёр",
    description: "Интерактивный тренажёр для экономистов — 18 модулей, квизы, XP-система",
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[SW] Registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[SW] Registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
