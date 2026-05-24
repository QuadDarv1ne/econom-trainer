"use client";

import { useEffect, useRef } from "react";
import { logError } from "@/lib/log-error";

/**
 * Hook that registers the service worker for PWA/offline support.
 * Only runs in browser environment and checks for SW support.
 */
export function useServiceWorker() {
  const registeredRef = useRef(false);

  useEffect(() => {
    // Skip if already registered or no SW support
    if (registeredRef.current || !("serviceWorker" in navigator)) {
      return;
    }

    // Wait for page load to not block initial render
    const registerSW = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          registeredRef.current = true;
          // SW registered successfully
        })
        .catch((error) => {
          logError('service-worker', error);
        });
    };

    // Register after initial load to not block first paint
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW);
      return () => window.removeEventListener("load", registerSW);
    }
  }, []);
}
