"use client";

import { useEffect, useRef } from "react";

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
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
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
