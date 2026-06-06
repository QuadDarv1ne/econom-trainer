import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { t, getCurrentLocale, type Locale } from '@/lib/i18n'
import { generateId } from '@/lib/utils'
import { getLevelFromXP } from '@/lib/xp-utils'
import { logError } from '@/lib/log-error'
import { MAX_QUIZ_RESULTS, MAX_GDP_RESULTS, MAX_FINANCE_RESULTS, MAX_ELASTICITY_RESULTS, MAX_MODULE_INTERACTIONS, MAX_DAILY_CHALLENGES } from '@/lib/constants'

export { getLevelFromXP }

/**
 * Debounced localStorage storage for Zustand persist middleware.
 * Matches zustand/middleware's Storage interface:
 * getItem returns StateReflection | null, setItem/removeItem are void.
 */
function createDebouncedStorage<T>(delayMs: number = 500): {
  storage: {
    getItem: (name: string) => { state: T } | null
    setItem: (name: string, value: { state: T }) => void
    removeItem: (name: string) => void
  }
  cleanup: () => void
  flushSync: () => void
} {
  let pendingWrite: { key: string; value: string } | null = null
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  const flush = () => {
    if (pendingWrite) {
      if (flushTimer) clearTimeout(flushTimer)
      flushTimer = null
      try {
        localStorage.setItem(pendingWrite.key, pendingWrite.value)
      } catch (error) {
        logError('store-flush', error)
      }
      pendingWrite = null
    }
  }

  const scheduleFlush = () => {
    if (!pendingWrite) return
    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = setTimeout(() => {
      flush()
    }, delayMs)
  }

  // Flush pending writes before page unload to prevent data loss
  const cleanup = () => {
    // Flush pending writes before cleanup to prevent data loss
    flush()
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', flush)
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
  }

  return {
    storage: {
      getItem: (name: string) => {
        const item = localStorage.getItem(name)
        if (!item) return null
        try {
          return JSON.parse(item)
        } catch {
          // Corrupted data — return null to reinitialize with defaults
          // Backup corrupted data before removal, but clean up old backups to prevent storage quota issues
          const backupKey = `${name}.backup`;
          try {
            // Remove any old timestamped backup keys to prevent storage quota issues
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && key.startsWith(`${name}.backup.`)) {
                localStorage.removeItem(key);
              }
            }
            localStorage.setItem(backupKey, item);
            logError('store-corrupted-data', new Error(`Backed up corrupted data for "${name}" before removal`));
          } catch {
            logError('store-corrupted-data', new Error(`Failed to backup corrupted data for "${name}"`));
          }
          localStorage.removeItem(name)
          return null
        }
      },
      setItem: (name: string, value: { state: T }): void => {
        pendingWrite = { key: name, value: JSON.stringify(value) }
        scheduleFlush()
      },
      removeItem: (name: string): void => {
        pendingWrite = null
        if (flushTimer) clearTimeout(flushTimer)
        flushTimer = null
        try {
          localStorage.removeItem(name)
        } catch (error) {
          logError('store-remove', error)
        }
      },
    },
    cleanup,
    flushSync: flush,
  }
}

export interface QuizResult {
  id: string
  topic: string
  score: number
  total: number
  date: string
}

export interface GDPResult {
  id: string
  nominalGDP: number
  realGDP: number
  deflator: number
  inflationRate: number
  date: string
}

export interface FinanceResult {
  id: string
  problemType: string
  correct: boolean
  userAnswer: number
  correctAnswer: number
  date: string
}

export interface ElasticityResult {
  id: string
  elasticityType: string
  value: number
  interpretation: string
  category: string
  date: string
}

// Generic module interaction tracking for all 18 modules
export interface ModuleInteraction {
  id: string
  moduleId: string
  action: string // 'calculate', 'answer', 'explore', 'practice'
  xpEarned: number
  date: string
  details?: Record<string, unknown>
}

// Daily challenge tracking
export interface DailyChallenge {
  date: string // YYYY-MM-DD
  score: number
  total: number
}

// Learning streak state
export interface StreakState {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null // YYYY-MM-DD
}

// XP and Level system
export interface XPState {
  totalXP: number
  level: number
  xpToNextLevel: number
  xpInCurrentLevel: number
}

/**
 * Returns the localized level title based on user's current level.
 * Levels range from Student (1-2) to Academician (20+).
 */
export function getLevelTitle(level: number): string {
  const locale = getCurrentLocale()
  if (level >= 20) return t('level.academician', locale)
  if (level >= 15) return t('level.professor', locale)
  if (level >= 10) return t('level.associate', locale)
  if (level >= 7) return t('level.phd', locale)
  if (level >= 5) return t('level.analyst', locale)
  if (level >= 3) return t('level.specialist', locale)
  return t('level.student', locale)
}

/**
 * Returns the Tailwind CSS color class for a given level.
 * Higher levels get more prestigious colors (yellow > purple > blue > etc.).
 */
export function getLevelColor(level: number): string {
  if (level >= 20) return 'text-yellow-500'
  if (level >= 15) return 'text-purple-500'
  if (level >= 10) return 'text-blue-500'
  if (level >= 7) return 'text-emerald-500'
  if (level >= 5) return 'text-teal-500'
  if (level >= 3) return 'text-cyan-500'
  if (level >= 2) return 'text-green-500'
  return 'text-muted-foreground'
}

// All module IDs for tracking
export const MODULE_IDS = [
  'gdp', 'supply-demand', 'elasticity', 'keynesian', 'inflation',
  'phillips', 'lorenz', 'is-lm', 'ppf', 'costs', 'comparative',
  'breakeven', 'tax', 'game-theory', 'market-structures', 'currency', 'price-indices',
  'economic-crises', 'monetary-policy', 'adas',
  'quiz', 'finance',
  'glossary', 'achievements', 'progress',
] as const

export type ModuleId = typeof MODULE_IDS[number]

// XP rewards per module interaction
export const MODULE_XP: Record<ModuleId, number> = {
  'gdp': 15,
  'supply-demand': 15,
  'elasticity': 15,
  'keynesian': 20,
  'inflation': 15,
  'phillips': 20,
  'lorenz': 20,
  'is-lm': 25,
  'ppf': 15,
  'costs': 20,
  'comparative': 15,
  'breakeven': 15,
  'tax': 20,
  'game-theory': 20,
  'market-structures': 25,
  'currency': 15,
  'price-indices': 15,
  'economic-crises': 25,
  'monetary-policy': 25,
  'adas': 20,
  'quiz': 0, // Quiz uses its own scoring: score * 10
  'finance': 0, // Finance uses its own scoring
  'glossary': 5,
  'achievements': 0,
  'progress': 0,
}

/**
 * Counts the number of interactions for a specific module.
 * Used to track user progress and completion percentage.
 */
export function getModuleInteractionCount(interactions: ModuleInteraction[], moduleId: string): number {
  return interactions.filter((i) => i.moduleId === moduleId).length
}

/** Shared stats computation — used by store methods, export-progress, and progress-tracker */
export function computeQuizAndFinanceStats(
  quizResults: QuizResult[],
  financeResults: FinanceResult[]
) {
  const quizCorrect = quizResults.reduce((sum, r) => sum + r.score, 0)
  const quizTotal = quizResults.reduce((sum, r) => sum + r.total, 0)
  const financeCorrect = financeResults.filter((r) => r.correct).length
  const financeTotal = financeResults.length
  return { quizCorrect, quizTotal, financeCorrect, financeTotal }
}

export function getModuleDisplayName(moduleId: string, locale: Locale): string {
  const nameMap: Record<string, string> = {
    'gdp': 'module.gdp.title',
    'supply-demand': 'module.supply-demand.title',
    'elasticity': 'module.elasticity.title',
    'keynesian': 'module.keynesian.title',
    'inflation': 'module.inflation.title',
    'phillips': 'module.phillips.title',
    'lorenz': 'module.lorenz.title',
    'is-lm': 'module.is-lm.title',
    'ppf': 'module.ppf.title',
    'costs': 'module.costs.title',
    'comparative': 'module.comparative.title',
    'breakeven': 'module.breakeven.title',
    'tax': 'module.tax.title',
    'game-theory': 'module.game-theory.title',
    'market-structures': 'module.market-structures.title',
    'price-indices': 'module.price-indices.title',
    'economic-crises': 'module.economic-crises.title',
    'monetary-policy': 'module.monetary-policy.title',
    'adas': 'module.adas.title',
    'currency': 'module.currency.title',
    'quiz': 'module.quiz.title',
    'finance': 'module.finance.title',
    'glossary': 'module.glossary.title',
    'achievements': 'module.achievements.title',
    'progress': 'module.progress.title',
  }
  const key = nameMap[moduleId]
  if (!key) return moduleId
  return t(key, locale)
}

/**
 * Calculate updated streak state based on activity today.
 * Returns unchanged state if already active today, otherwise:
 * - Increments streak if last activity was yesterday
 * - Resets to 1 if gap > 1 day or first activity
 */
function updateStreakState(streakState: StreakState, today: string): StreakState {
  if (streakState.lastActiveDate === today) return streakState;

  const { currentStreak, longestStreak, lastActiveDate } = streakState;
  let newStreak = currentStreak;

  if (lastActiveDate) {
    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    newStreak = diffDays === 1 ? currentStreak + 1 : 1;
  } else {
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    lastActiveDate: today,
  };
}

/** Sync status for tracking delta sync and conflict resolution */
export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error' | 'conflict'
  lastSyncAt: string | null
  error: string | null
  pendingChanges: number
}

/** Sync conflict data when server data significantly differs from client */
export interface SyncConflict {
  serverXP: number
  clientXP: number
  serverLevel: number
  clientLevel: number
  discrepancy: number
}

export interface EconomicsState {
  quizResults: QuizResult[]
  gdpResults: GDPResult[]
  financeResults: FinanceResult[]
  elasticityResults: ElasticityResult[]
  moduleInteractions: ModuleInteraction[]
  unlockedAchievements: string[]
  totalXP: number
  dailyChallenges: DailyChallenge[]
  streakState: StreakState
  addQuizResult: (result: QuizResult) => void
  addGDPResult: (result: GDPResult) => void
  addFinanceResult: (result: FinanceResult) => void
  addElasticityResult: (result: ElasticityResult) => void
  addModuleInteraction: (interaction: Omit<ModuleInteraction, 'id' | 'date'>) => void
  completeDailyChallenge: (result: DailyChallenge) => void
  recordActivity: () => void
  unlockAchievement: (id: string, xpReward?: number) => void
  addXP: (amount: number) => void
  getTotalScore: () => { quizAccuracy: number; gdpCount: number; financeAccuracy: number; elasticityCount: number }
  computeStats: () => { quizCorrect: number; quizTotal: number; financeCorrect: number; financeTotal: number }
  getXPState: () => XPState
  resetProgress: () => Promise<void>
  getFullProgress: () => {
    totalXP: number
    level: number
    levelTitle: string
    totalSessions: number
    moduleCounts: Record<string, number>
    quizStats: { correct: number; total: number; accuracy: number }
    financeStats: { correct: number; total: number; accuracy: number }
    gdpCount: number
    elasticityCount: number
  }
  syncStatus: SyncStatus
  markSynced: () => void
  markSyncError: (error: string) => void
  setSyncConflict: (conflict: SyncConflict | null) => void
  incrementPendingChanges: () => void
}

const debouncedStorage = createDebouncedStorage<EconomicsState>(300)

export const useEconomicsStore = create<EconomicsState>()(
  persist(
    (set, get) => ({
      quizResults: [],
      gdpResults: [],
      financeResults: [],
      elasticityResults: [],
      moduleInteractions: [],
      unlockedAchievements: [],
      totalXP: 0,
      dailyChallenges: [],
      streakState: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
      syncStatus: { status: 'idle' as const, lastSyncAt: null, error: null, pendingChanges: 0 },

      addQuizResult: (result) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        const xpEarned = result.score * 10
        set((state) => ({
          quizResults: [result, ...state.quizResults].slice(0, MAX_QUIZ_RESULTS),
          totalXP: state.totalXP + xpEarned,
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      addGDPResult: (result) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        set((state) => ({
          gdpResults: [result, ...state.gdpResults].slice(0, MAX_GDP_RESULTS),
          totalXP: state.totalXP + MODULE_XP['gdp'],
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      addFinanceResult: (result) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        const xpEarned = result.correct ? 20 : 5
        set((state) => ({
          financeResults: [result, ...state.financeResults].slice(0, MAX_FINANCE_RESULTS),
          totalXP: state.totalXP + xpEarned,
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      addElasticityResult: (result) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        set((state) => ({
          elasticityResults: [result, ...state.elasticityResults].slice(0, MAX_ELASTICITY_RESULTS),
          totalXP: state.totalXP + MODULE_XP['elasticity'],
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      addModuleInteraction: (interaction) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        const newInteraction: ModuleInteraction = {
          ...interaction,
          id: generateId(),
          date: new Date().toISOString(),
        }
        set((state) => ({
          moduleInteractions: [newInteraction, ...state.moduleInteractions].slice(0, MAX_MODULE_INTERACTIONS),
          totalXP: state.totalXP + interaction.xpEarned,
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      completeDailyChallenge: (result) => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        const xpEarned = 30 + result.score * 10
        set((state) => ({
          dailyChallenges: [result, ...state.dailyChallenges].slice(0, MAX_DAILY_CHALLENGES),
          totalXP: state.totalXP + xpEarned,
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      recordActivity: () => {
        const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local timezone
        set((state) => ({
          streakState: updateStreakState(state.streakState, today),
        }))
      },

      addXP: (amount) => {
        if (amount < 0) return
        set((state) => ({ totalXP: state.totalXP + amount }))
      },

      unlockAchievement: (id, xpReward = 0) => {
        set((state) => {
          if (state.unlockedAchievements.includes(id)) return state
          return {
            unlockedAchievements: [...state.unlockedAchievements, id],
            totalXP: state.totalXP + xpReward,
          }
        })
      },

      getTotalScore: () => {
        const state = get()
        const { quizCorrect, quizTotal, financeCorrect, financeTotal } = computeQuizAndFinanceStats(state.quizResults, state.financeResults)
        const gdpTotal = state.gdpResults.length
        const elasticityTotal = state.elasticityResults.length
        return {
          quizAccuracy: quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0,
          gdpCount: gdpTotal,
          financeAccuracy: financeTotal > 0 ? Math.round((financeCorrect / financeTotal) * 100) : 0,
          elasticityCount: elasticityTotal,
        }
      },

      computeStats: () => {
        const state = get()
        const { quizCorrect, quizTotal, financeCorrect, financeTotal } = computeQuizAndFinanceStats(state.quizResults, state.financeResults)
        return { quizCorrect, quizTotal, financeCorrect, financeTotal }
      },

      getXPState: () => {
        const state = get()
        const { level, xpInCurrentLevel, xpToNextLevel } = getLevelFromXP(state.totalXP)
        return { totalXP: state.totalXP, level, xpToNextLevel, xpInCurrentLevel }
      },

      markSynced: () => {
        set(() => ({
          syncStatus: { status: 'success', lastSyncAt: new Date().toISOString(), error: null, pendingChanges: 0 },
        }))
      },

      markSyncError: (error) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, status: 'error', error, lastSyncAt: new Date().toISOString() },
        }))
      },

      setSyncConflict: (conflict) => {
        set((state) => ({
          syncStatus: {
            status: conflict ? 'conflict' : 'idle',
            lastSyncAt: state.syncStatus.lastSyncAt,
            error: conflict ? `XP discrepancy: ${conflict.discrepancy}` : null,
            pendingChanges: state.syncStatus.pendingChanges,
          },
        }))
      },

      incrementPendingChanges: () => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, pendingChanges: state.syncStatus.pendingChanges + 1 },
        }))
      },

      resetProgress: async () => {
        // First, try to reset server-side progress
        try {
          const response = await fetch('/api/progress/reset', {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!response.ok && response.status !== 401) {
            // Log error but continue with client reset
            const errorData = await response.json().catch(() => null);
            logError('reset-progress-api', new Error(`Failed to reset server progress: ${response.status} ${JSON.stringify(errorData)}`));
          }
        } catch (error) {
          // Network error � continue with client reset anyway
          logError('reset-progress-api', error);
        }

        // Then reset client-side state
        const newState = {
          quizResults: [],
          gdpResults: [],
          financeResults: [],
          elasticityResults: [],
          moduleInteractions: [],
          unlockedAchievements: [],
          totalXP: 0,
          dailyChallenges: [],
          streakState: { currentStreak: 0, longestStreak: 0, lastActiveDate: null },
          syncStatus: { status: 'idle' as const, lastSyncAt: null, error: null, pendingChanges: 0 },
        }
        debouncedStorage.flushSync()
        set(newState)
      },

      getFullProgress: () => {
        const state = get()
        const { level } = getLevelFromXP(state.totalXP)
        const levelTitle = getLevelTitle(level)

        const { quizCorrect, quizTotal, financeCorrect, financeTotal } = computeQuizAndFinanceStats(state.quizResults, state.financeResults)

        const moduleCounts: Record<string, number> = {}
        MODULE_IDS.forEach((id) => {
          moduleCounts[id] = getModuleInteractionCount(state.moduleInteractions, id)
        })

        const totalSessions = state.quizResults.length + state.gdpResults.length + state.financeResults.length + state.elasticityResults.length

        return {
          totalXP: state.totalXP,
          level,
          levelTitle,
          totalSessions,
          moduleCounts,
          quizStats: {
            correct: quizCorrect,
            total: quizTotal,
            accuracy: quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0,
          },
          financeStats: {
            correct: financeCorrect,
            total: financeTotal,
            accuracy: financeTotal > 0 ? Math.round((financeCorrect / financeTotal) * 100) : 0,
          },
          gdpCount: state.gdpResults.length,
          elasticityCount: state.elasticityResults.length,
        }
      },
    }),
    {
      name: 'economics-trainer-data',
      storage: debouncedStorage.storage,
      partialize: (state) => ({
        quizResults: state.quizResults,
        gdpResults: state.gdpResults,
        financeResults: state.financeResults,
        elasticityResults: state.elasticityResults,
        moduleInteractions: state.moduleInteractions,
        unlockedAchievements: state.unlockedAchievements,
        totalXP: state.totalXP,
        dailyChallenges: state.dailyChallenges,
        streakState: state.streakState,
      }      ) as unknown as EconomicsState,
    },
  ),
)
