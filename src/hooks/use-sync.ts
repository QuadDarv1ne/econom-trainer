"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEconomicsStore } from "@/store/economics-store";

const SYNC_DEBOUNCE_MS = 3000;

/**
 * Hook that automatically syncs progress when the user comes back online.
 * Uses debouncing to prevent excessive sync requests.
 */
export function useAutoSync() {
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSyncedRef = useRef(false);

  const performSync = useCallback(async () => {
    if (!navigator.onLine) return;

    const session = await fetch("/api/auth/session").then((r) => r.json());
    if (!session?.user?.id) return;

    const state = useEconomicsStore.getState();
    const payload = {
      totalXP: state.totalXP,
      quizResults: state.quizResults,
      moduleHistory: state.moduleInteractions,
      achievements: state.unlockedAchievements,
    };

    try {
      const response = await fetch("/api/progress/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Auto-sync failed:", response.status);
        return;
      }

      hasSyncedRef.current = true;
      console.log("Auto-sync completed successfully");
    } catch (error) {
      console.error("Auto-sync error:", error);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(() => {
        performSync();
      }, SYNC_DEBOUNCE_MS);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [performSync]);

  return { hasSynced: hasSyncedRef.current };
}
