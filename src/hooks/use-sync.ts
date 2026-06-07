"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { logError } from "@/lib/log-error";
import { useEconomicsStore, type SyncConflict } from "@/store/economics-store";

const SYNC_DEBOUNCE_MS = 3000;
const XP_CONFLICT_THRESHOLD = 100;

/**
 * Hook that automatically syncs progress when the user comes back online.
 * Uses debouncing to prevent excessive sync requests.
 * Implements optimistic UI with rollback on sync failure.
 * Detects and reports sync conflicts when server data significantly differs.
 */
export function useAutoSync() {
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasSynced, setHasSynced] = useState(false);
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const lastSnapshotRef = useRef<unknown>(null);

  const performSync = useCallback(async () => {
    if (!navigator.onLine) return;

    let session;
    try {
      const response = await fetch("/api/auth/session");
      if (!response.ok) return;
      session = await response.json();
    } catch {
      return;
    }

    if (!session?.user?.id) return;

    const store = useEconomicsStore.getState();
    const state = store as unknown as {
      totalXP: number;
      quizResults: unknown[];
      moduleInteractions: unknown[];
      unlockedAchievements: string[];
      gdpResults: unknown[];
      financeResults: unknown[];
      elasticityResults: unknown[];
      dailyChallenges: unknown[];
      streakState: unknown;
    };

    // Save snapshot for potential rollback
    lastSnapshotRef.current = {
      totalXP: state.totalXP,
      quizResults: state.quizResults,
      moduleInteractions: state.moduleInteractions,
      unlockedAchievements: state.unlockedAchievements,
    };

    // Mark sync as in-progress
    useEconomicsStore.setState((s) => ({ syncStatus: { ...s.syncStatus, status: 'syncing' as const } }));

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
        // Rollback on failure
        if (lastSnapshotRef.current) {
          useEconomicsStore.setState(lastSnapshotRef.current as Parameters<typeof useEconomicsStore.setState>[0]);
        }
        useEconomicsStore.getState().markSyncError(`Sync failed with status ${response.status}`);
        return;
      }

      const serverData = await response.json();

      // Check for significant XP discrepancy (potential conflict)
      const serverXP = serverData.totalXP ?? 0;
      const clientXP = state.totalXP;
      const discrepancy = Math.abs(serverXP - clientXP);

      if (discrepancy > XP_CONFLICT_THRESHOLD) {
        const conflictData: SyncConflict = {
          serverXP,
          clientXP,
          serverLevel: serverData.level ?? 1,
          clientLevel: useEconomicsStore.getState().getXPState().level,
          discrepancy,
        };
        setConflict(conflictData);
        useEconomicsStore.getState().setSyncConflict(conflictData);
      } else {
        setConflict(null);
        useEconomicsStore.getState().setSyncConflict(null);
      }

      useEconomicsStore.getState().markSynced();
      setHasSynced(true);
    } catch (error) {
      // Rollback on failure
      if (lastSnapshotRef.current) {
        useEconomicsStore.setState(lastSnapshotRef.current as Parameters<typeof useEconomicsStore.setState>[0]);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      useEconomicsStore.getState().markSyncError(errorMessage);
    }
  }, []);

  // Track pending changes - increment when user makes progress
  useEffect(() => {
    const unsubscribe = useEconomicsStore.subscribe((state, prevState) => {
      const stateTyped = state as unknown as { totalXP: number };
      const prevStateTyped = prevState as unknown as { totalXP: number };
      if (stateTyped.totalXP !== prevStateTyped.totalXP) {
        useEconomicsStore.getState().incrementPendingChanges();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      syncTimerRef.current = setTimeout(() => {
        performSync().catch((error) => {
          // Log sync failure for debugging, will retry on next online event
          logError('auto-sync', error);
        });
      }, SYNC_DEBOUNCE_MS);
    };

    window.addEventListener("online", handleOnline);

    // Also sync on initial mount if online
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [performSync]);

  const resolveConflict = useCallback((choice: 'keep-client' | 'keep-server') => {
    setConflict(null);
    useEconomicsStore.getState().setSyncConflict(null);
    if (choice === 'keep-server') {
      // Server data is already authoritative, just clear conflict
      // User would need to manually fetch server data to fully resolve
    }
  }, []);

  return { hasSynced, conflict, resolveConflict };
}
