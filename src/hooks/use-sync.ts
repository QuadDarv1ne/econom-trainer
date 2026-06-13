"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { logError } from "@/lib/log-error";
import { useEconomicsStore, type SyncConflict, type ModuleInteraction, type QuizResult, type GDPResult, type FinanceResult, type ElasticityResult } from "@/store/economics-store";

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
  const syncingRef = useRef(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const lastSnapshotRef = useRef<unknown>(null);

  const performSync = useCallback(async () => {
    if (syncingRef.current) return;
    if (!navigator.onLine) return;
    if (useEconomicsStore.getState()._isResetting) return;

    syncingRef.current = true;

    try {
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
    const state = {
      totalXP: store.totalXP,
      quizResults: store.quizResults,
      moduleInteractions: store.moduleInteractions,
      unlockedAchievements: store.unlockedAchievements,
      gdpResults: store.gdpResults,
      financeResults: store.financeResults,
      elasticityResults: store.elasticityResults,
      dailyChallenges: store.dailyChallenges,
      streakState: store.streakState,
    };

    // Save complete snapshot for potential rollback (all persisted fields)
    lastSnapshotRef.current = {
      totalXP: state.totalXP,
      quizResults: state.quizResults,
      moduleInteractions: state.moduleInteractions,
      unlockedAchievements: state.unlockedAchievements,
      gdpResults: state.gdpResults,
      financeResults: state.financeResults,
      elasticityResults: state.elasticityResults,
      dailyChallenges: state.dailyChallenges,
      streakState: state.streakState,
    };

    // Mark sync as in-progress
    useEconomicsStore.setState((s) => ({ syncStatus: { ...s.syncStatus, status: 'syncing' as const } }));

    // Encode GDP/finance/elasticity results as module interactions so they sync via moduleHistory
    const resultInteractions = [
      ...state.gdpResults.map((r) => ({
        moduleId: 'gdp' as const,
        action: 'calculate' as const,
        xpEarned: 0,
        date: r.date,
        details: { type: 'gdp', nominalGDP: r.nominalGDP, realGDP: r.realGDP, deflator: r.deflator, inflationRate: r.inflationRate },
      })),
      ...state.financeResults.map((r) => ({
        moduleId: 'finance' as const,
        action: 'answer' as const,
        xpEarned: 0,
        date: r.date,
        details: { type: 'finance', problemType: r.problemType, correct: r.correct, userAnswer: r.userAnswer, correctAnswer: r.correctAnswer },
      })),
      ...state.elasticityResults.map((r) => ({
        moduleId: 'elasticity' as const,
        action: 'calculate' as const,
        xpEarned: 0,
        date: r.date,
        details: { type: 'elasticity', elasticityType: r.elasticityType, value: r.value, interpretation: r.interpretation, category: r.category },
      })),
    ];

    const allModuleHistory = [...state.moduleInteractions, ...resultInteractions];

    const payload = {
      totalXP: state.totalXP,
      quizResults: state.quizResults,
      moduleHistory: allModuleHistory,
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
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Track pending changes - increment when user makes progress
  useEffect(() => {
    const unsubscribe = useEconomicsStore.subscribe((state, prevState) => {
      if (state.totalXP !== prevState.totalXP) {
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

  const resolveConflict = useCallback(async (choice: 'keep-client' | 'keep-server') => {
    setConflict(null);
    useEconomicsStore.getState().setSyncConflict(null);
    if (choice === 'keep-server') {
      try {
        const res = await fetch('/api/progress/sync');
        if (res.ok) {
          const serverData = await res.json();

          // Convert server QuizAttempt[] → client QuizResult[]
          const serverQuizResults: QuizResult[] = (serverData.quizAttempts || []).map((qa: { topic: string; score: number; total: number; date: string }) => ({
            id: crypto.randomUUID?.() ?? `${qa.topic}-${qa.date}-${Math.random().toString(36).slice(2)}`,
            topic: qa.topic,
            score: qa.score,
            total: qa.total,
            date: typeof qa.date === 'string' ? qa.date.split('T')[0] : qa.date,
          }));

          // Convert server ModuleSession[] → client ModuleInteraction[]
          interface ServerModuleInteraction extends ModuleInteraction {
            details?: Record<string, unknown>
            score?: number
            duration?: number
          }
          const serverModuleInteractions: ServerModuleInteraction[] = (serverData.moduleSessions || []).map((ms: { moduleId: string; action: string; xpEarned: number; date: string; score?: number; duration?: number; details?: string }) => {
            let parsedDetails: Record<string, unknown> | undefined;
            if (ms.details) {
              try { parsedDetails = JSON.parse(ms.details); } catch { /* ignore */ }
            }
            return {
              id: crypto.randomUUID?.() ?? `${ms.moduleId}-${ms.date}-${Math.random().toString(36).slice(2)}`,
              moduleId: ms.moduleId,
              action: ms.action,
              xpEarned: ms.xpEarned,
              date: typeof ms.date === 'string' ? ms.date.split('T')[0] : ms.date,
              ...(parsedDetails ? { details: parsedDetails } : {}),
            };
          });

          // Reconstruct result arrays from module interactions with type markers
          const gdpResults: GDPResult[] = serverModuleInteractions
            .filter((mi) => mi.details?.type === 'gdp')
            .map((mi) => ({
              id: mi.id,
              nominalGDP: Number((mi.details as Record<string, number>).nominalGDP ?? 0),
              realGDP: Number((mi.details as Record<string, number>).realGDP ?? 0),
              deflator: Number((mi.details as Record<string, number>).deflator ?? 0),
              inflationRate: Number((mi.details as Record<string, number>).inflationRate ?? 0),
              date: mi.date,
            }));
          const financeResults: FinanceResult[] = serverModuleInteractions
            .filter((mi) => mi.details?.type === 'finance')
            .map((mi) => ({
              id: mi.id,
              problemType: String((mi.details as Record<string, unknown>).problemType ?? ''),
              correct: Boolean((mi.details as Record<string, unknown>).correct),
              userAnswer: Number((mi.details as Record<string, number>).userAnswer ?? 0),
              correctAnswer: Number((mi.details as Record<string, number>).correctAnswer ?? 0),
              date: mi.date,
            }));
          const elasticityResults: ElasticityResult[] = serverModuleInteractions
            .filter((mi) => mi.details?.type === 'elasticity')
            .map((mi) => ({
              id: mi.id,
              elasticityType: String((mi.details as Record<string, unknown>).elasticityType ?? ''),
              value: Number((mi.details as Record<string, number>).value ?? 0),
              interpretation: String((mi.details as Record<string, unknown>).interpretation ?? ''),
              category: String((mi.details as Record<string, unknown>).category ?? ''),
              date: mi.date,
            }));
          // Filter out result-encoded interactions from the main list
          const cleanModuleInteractions = serverModuleInteractions.filter(
            (mi) => !mi.details?.type || !['gdp', 'finance', 'elasticity'].includes(mi.details.type as string)
          );

          // Convert server UserAchievement[] → client unlockedAchievements string[]
          const serverAchievements = (serverData.achievementsList || []).map((a: { name: string }) => a.name);

          useEconomicsStore.setState({
            totalXP: serverData.totalXP ?? 0,
            quizResults: serverQuizResults,
            moduleInteractions: cleanModuleInteractions,
            unlockedAchievements: serverAchievements,
            gdpResults,
            financeResults,
            elasticityResults,
          });
        }
      } catch {
        // Silent — user can manually resolve later
      }
    }
  }, []);

  return { hasSynced, conflict, resolveConflict };
}
