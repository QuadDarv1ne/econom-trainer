"use client";

import { ThemeProvider } from "next-themes";
import { OnlineStatusIndicator } from "@/components/economics/online-status";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
        <OnlineStatusIndicator />
      </I18nProvider>
      <Toaster />
    </ThemeProvider>
  );
}