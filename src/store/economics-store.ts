import { create } from 'zustand'

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

// XP and Level system
export interface XPState {
  totalXP: number
  level: number
  xpToNextLevel: number
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
  if (level >= 20) return 'Академик'
  if (level >= 15) return 'Профессор'
  if (level >= 10) return 'Доцент'
  if (level >= 7) return 'Аспирант'
  if (level >= 5) return 'Магистр'
  if (level >= 3) return 'Бакалавр'
  if (level >= 2) return 'Студент'
  return 'Новичок'
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
  'breakeven', 'tax', 'game-theory', 'market-structures', 'currency', 'quiz', 'finance',
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
  'quiz': 0, // Quiz uses its own scoring: score * 10
  'finance': 0, // Finance uses its own scoring
  'glossary': 5,
  'achievements': 0,
  'progress': 0,
}

export function getModuleInteractionCount(interactions: ModuleInteraction[], moduleId: string): number {
  return interactions.filter((i) => i.moduleId === moduleId).length
}

export function getModuleLastInteraction(interactions: ModuleInteraction[], moduleId: string): string | null {
  const moduleInteractions = interactions.filter((i) => i.moduleId === moduleId)
  if (moduleInteractions.length === 0) return null
  return moduleInteractions[0].date // Already sorted by date desc
}

export interface EconomicsState {
  quizResults: QuizResult[]
  gdpResults: GDPResult[]
  financeResults: FinanceResult[]
  elasticityResults: ElasticityResult[]
  moduleInteractions: ModuleInteraction[]
  totalXP: number
  addQuizResult: (result: QuizResult) => void
  addGDPResult: (result: GDPResult) => void
  addFinanceResult: (result: FinanceResult) => void
  addElasticityResult: (result: ElasticityResult) => void
  addModuleInteraction: (interaction: Omit<ModuleInteraction, 'id' | 'date'>) => void
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

const STORAGE_KEY = 'economics-trainer-data'

function loadFromStorage(): Partial<EconomicsState> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        quizResults: parsed.quizResults || [],
        gdpResults: parsed.gdpResults || [],
        financeResults: parsed.financeResults || [],
        elasticityResults: parsed.elasticityResults || [],
        moduleInteractions: parsed.moduleInteractions || [],
        totalXP: parsed.totalXP || 0,
      }
    }
  } catch {
    // ignore
  }
  return {}
}

function saveToStorage(state: Partial<EconomicsState>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quizResults: state.quizResults || [],
        gdpResults: state.gdpResults || [],
        financeResults: state.financeResults || [],
        elasticityResults: state.elasticityResults || [],
        moduleInteractions: state.moduleInteractions || [],
        totalXP: state.totalXP || 0,
      })
    )
  } catch {
    // ignore
  }
}

export const useEconomicsStore = create<EconomicsState>((set, get) => ({
  quizResults: [],
  gdpResults: [],
  financeResults: [],
  elasticityResults: [],
  moduleInteractions: [],
  totalXP: 0,

  addQuizResult: (result) => {
    set((state) => {
      const newResults = [result, ...state.quizResults].slice(0, 50)
      const xpEarned = result.score * 10
      const newState = { quizResults: newResults, totalXP: state.totalXP + xpEarned }
      saveToStorage({ ...state, ...newState })
      return newState
    })
  },

  addGDPResult: (result) => {
    set((state) => {
      const newResults = [result, ...state.gdpResults].slice(0, 50)
      const newState = { gdpResults: newResults, totalXP: state.totalXP + 15 }
      saveToStorage({ ...state, ...newState })
      return newState
    })
  },

  addFinanceResult: (result) => {
    set((state) => {
      const newResults = [result, ...state.financeResults].slice(0, 50)
      const xpEarned = result.correct ? 20 : 5
      const newState = { financeResults: newResults, totalXP: state.totalXP + xpEarned }
      saveToStorage({ ...state, ...newState })
      return newState
    })
  },

  addElasticityResult: (result) => {
    set((state) => {
      const newResults = [result, ...state.elasticityResults].slice(0, 50)
      const newState = { elasticityResults: newResults, totalXP: state.totalXP + 15 }
      saveToStorage({ ...state, ...newState })
      return newState
    })
  },

  addModuleInteraction: (interaction) => {
    set((state) => {
      const newInteraction: ModuleInteraction = {
        ...interaction,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      }
      const newInteractions = [newInteraction, ...state.moduleInteractions].slice(0, 500)
      const newState = {
        moduleInteractions: newInteractions,
        totalXP: state.totalXP + interaction.xpEarned,
      }
      saveToStorage({ ...state, ...newState })
      return newState
    })
  },

  addXP: (amount) => {
    set((state) => {
      const newState = { totalXP: state.totalXP + amount }
      saveToStorage({ ...state, ...newState })
      return newState
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
      totalXP: 0,
    }
    saveToStorage(newState)
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
}))

// Hydrate from localStorage on client
if (typeof window !== 'undefined') {
  const stored = loadFromStorage()
  if (stored.quizResults || stored.gdpResults || stored.financeResults || stored.elasticityResults || stored.moduleInteractions || stored.totalXP) {
    useEconomicsStore.setState({
      quizResults: stored.quizResults || [],
      gdpResults: stored.gdpResults || [],
      financeResults: stored.financeResults || [],
      elasticityResults: stored.elasticityResults || [],
      moduleInteractions: stored.moduleInteractions || [],
      totalXP: stored.totalXP || 0,
    })
  }
}
