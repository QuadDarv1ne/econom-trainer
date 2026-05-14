import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { t, getCurrentLocale } from '@/lib/i18n'

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

const XP_PER_LEVEL = 500
const LEVEL_MULTIPLIER = 1.2

export function getLevelFromXP(totalXP: number): { level: number; xpInCurrentLevel: number; xpToNextLevel: number } {
  let level = 1
  let xpNeeded = XP_PER_LEVEL
  let remaining = totalXP

  while (remaining >= xpNeeded) {
    remaining -= xpNeeded
    level++
    xpNeeded = Math.round(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1))
  }

  return {
    level,
    xpInCurrentLevel: remaining,
    xpToNextLevel: xpNeeded,
  }
}

export function getLevelTitle(level: number): string {
  const locale = getCurrentLocale()
  if (level >= 20) return t('level.academician', locale)
  if (level >= 15) return t('level.professor', locale)
  if (level >= 10) return t('level.associate', locale)
  if (level >= 7) return t('level.phd', locale)
  if (level >= 5) return t('level.master', locale)
  if (level >= 3) return t('level.bachelor', locale)
  if (level >= 2) return t('level.student', locale)
  return t('level.novice', locale)
}

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
export const MODULE_XP: Record<string, number> = {
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

export function getModuleInteractionCount(interactions: ModuleInteraction[], moduleId: string): number {
  return interactions.filter((i) => i.moduleId === moduleId).length
}

export function getModuleDisplayName(moduleId: string, locale: string): string {
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
    'price-indices': 'price-indices.title',
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
  return t(key, locale as 'ru' | 'en')
}

export function getModuleMostRecentInteraction(interactions: ModuleInteraction[], moduleId: string): string | null {
  const moduleInteractions = interactions.filter((i) => i.moduleId === moduleId)
  if (moduleInteractions.length === 0) return null
  return moduleInteractions[0].date // Newest first (prepended on add)
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
  getTotalScore: () => { quizzes: number; gdp: number; finance: number; elasticity: number }
  getStreak: () => number
  getXPState: () => XPState
  resetProgress: () => void
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
}

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

      addQuizResult: (result) => {
        set((state) => {
          const newResults = [result, ...state.quizResults].slice(0, 50)
          const xpEarned = result.score * 10
          return { quizResults: newResults, totalXP: state.totalXP + xpEarned }
        })
        get().recordActivity()
      },

      addGDPResult: (result) => {
        set((state) => {
          const newResults = [result, ...state.gdpResults].slice(0, 50)
          return { gdpResults: newResults, totalXP: state.totalXP + 15 }
        })
        get().recordActivity()
      },

      addFinanceResult: (result) => {
        set((state) => {
          const newResults = [result, ...state.financeResults].slice(0, 50)
          const xpEarned = result.correct ? 20 : 5
          return { financeResults: newResults, totalXP: state.totalXP + xpEarned }
        })
        get().recordActivity()
      },

      addElasticityResult: (result) => {
        set((state) => {
          const newResults = [result, ...state.elasticityResults].slice(0, 50)
          return { elasticityResults: newResults, totalXP: state.totalXP + 15 }
        })
        get().recordActivity()
      },

      addModuleInteraction: (interaction) => {
        set((state) => {
          const newInteraction: ModuleInteraction = {
            ...interaction,
            id: Date.now().toString(),
            date: new Date().toISOString(),
          }
          const newInteractions = [newInteraction, ...state.moduleInteractions].slice(0, 500)
          return {
            moduleInteractions: newInteractions,
            totalXP: state.totalXP + interaction.xpEarned,
          }
        })
        get().recordActivity()
      },

      completeDailyChallenge: (result) => {
        set((state) => {
          const xpEarned = 30 + result.score * 10
          const newChallenges = [result, ...state.dailyChallenges].slice(0, 30)
          return { dailyChallenges: newChallenges, totalXP: state.totalXP + xpEarned }
        })
        get().recordActivity()
      },

      recordActivity: () => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => {
          const { currentStreak, longestStreak, lastActiveDate } = state.streakState
          if (lastActiveDate === today) return state // Already recorded today

          let newStreak: number
          if (lastActiveDate) {
            const last = new Date(lastActiveDate)
            const now = new Date(today)
            const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
            if (diffDays === 1) {
              newStreak = currentStreak + 1
            } else {
              newStreak = 1
            }
          } else {
            newStreak = 1
          }

          return {
            streakState: {
              currentStreak: newStreak,
              longestStreak: Math.max(longestStreak, newStreak),
              lastActiveDate: today,
            },
          }
        })
      },

      addXP: (amount) => {
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
        const quizCorrect = state.quizResults.reduce((sum, r) => sum + r.score, 0)
        const quizTotal = state.quizResults.reduce((sum, r) => sum + r.total, 0)
        const gdpTotal = state.gdpResults.length
        const financeCorrect = state.financeResults.filter((r) => r.correct).length
        const financeTotal = state.financeResults.length
        const elasticityTotal = state.elasticityResults.length
        return {
          quizzes: quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0,
          gdp: gdpTotal,
          finance: financeTotal > 0 ? Math.round((financeCorrect / financeTotal) * 100) : 0,
          elasticity: elasticityTotal,
        }
      },

      getStreak: () => {
        const state = get()
        const allResults = [
          ...state.quizResults.map((r) => ({ date: r.date, success: r.score > r.total / 2 })),
          ...state.financeResults.map((r) => ({ date: r.date, success: r.correct })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        let streak = 0
        for (const result of allResults) {
          if (result.success) streak++
          else break
        }
        return streak
      },

      getXPState: () => {
        const state = get()
        const { level, xpInCurrentLevel, xpToNextLevel } = getLevelFromXP(state.totalXP)
        return { totalXP: state.totalXP, level, xpToNextLevel, xpInCurrentLevel }
      },

      resetProgress: () => {
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
        }
        set(newState)
      },

      getFullProgress: () => {
        const state = get()
        const { level } = getLevelFromXP(state.totalXP)
        const levelTitle = getLevelTitle(level)

        const quizCorrect = state.quizResults.reduce((sum, r) => sum + r.score, 0)
        const quizTotal = state.quizResults.reduce((sum, r) => sum + r.total, 0)
        const financeCorrect = state.financeResults.filter((r) => r.correct).length
        const financeTotal = state.financeResults.length

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
      }),
    },
  ),
)
