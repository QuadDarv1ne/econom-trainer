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
import { EnhancedToastProvider } from "@/components/shared/enhanced-toast";
import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { KeyboardShortcutsDialog } from "@/components/shared/keyboard-shortcuts";

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      storageKey="econom-trainer-theme"
    >
      <I18nProvider>
        <AuthProvider>
          <EnhancedToastProvider>
            {children}
            <OnlineStatusIndicator />
            <InstallPWAButton />
            <ServiceWorkerUpdatePrompt />
            <ScrollToTop />
            <KeyboardShortcutsDialog />
          </EnhancedToastProvider>
        </AuthProvider>
      </I18nProvider>
      <Toaster />
    </ThemeProvider>
  );
}