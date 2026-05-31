"use client";

import type React from "react";
import { ThemeProvider } from "next-themes";
import { OnlineStatusIndicator } from "@/components/economics/online-status";
import { Toaster } from "@/components/ui/toaster";
import { I18nProvider } from "@/lib/i18n-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { ServiceWorkerUpdatePrompt } from "@/components/pwa/sw-update-prompt";
import { InstallPWAButton } from "@/components/pwa/install-pwa-button";

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="econom-trainer-theme"
    >
      <I18nProvider>
        <AuthProvider>
          {children}
          <OnlineStatusIndicator />
          <InstallPWAButton />
        </AuthProvider>
      </I18nProvider>
      <Toaster />
      <ServiceWorkerUpdatePrompt />
    </ThemeProvider>
  );
}