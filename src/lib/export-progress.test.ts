import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exportToCSV, exportToJSON } from './export-progress'
import { useEconomicsStore } from '@/store/economics-store'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock store state for tests
const mockStoreState = {
  totalXP: 0,
  quizResults: [],
  gdpResults: [],
  financeResults: [],
  elasticityResults: [],
  moduleInteractions: [],
  achievements: [],
  lastResetDate: new Date().toISOString(),
}

describe('exportToCSV', () => {
  beforeEach(() => {
    localStorageMock.clear()
    // Reset store to empty state
    const state = useEconomicsStore.getState()
    state.resetProgress()
  })

  it('produces CSV with headers', () => {
    const csv = exportToCSV()
    expect(csv).toContain('Метрика,Значение')
  })

  it('includes total XP row', () => {
    const csv = exportToCSV()
    expect(csv).toContain('Общий XP')
  })

  it('includes level row', () => {
    const csv = exportToCSV()
    expect(csv).toContain('Уровень')
  })

  it('includes quiz results row', () => {
    const csv = exportToCSV()
    expect(csv).toContain('Результатов квизов')
  })

  it('includes finance tasks row', () => {
    const csv = exportToCSV()
    expect(csv).toContain('Фин. задач')
  })
})

describe('exportToJSON', () => {
  beforeEach(() => {
    localStorageMock.clear()
    const state = useEconomicsStore.getState()
    state.resetProgress()
  })

  it('produces valid JSON', () => {
    const json = exportToJSON()
    const data = JSON.parse(json)
    expect(data).toBeDefined()
  })

  it('has correct structure', () => {
    const json = exportToJSON()
    const data = JSON.parse(json)
    
    expect(data).toHaveProperty('totalXP')
    expect(data).toHaveProperty('level')
    expect(data).toHaveProperty('levelTitle')
    expect(data).toHaveProperty('moduleInteractions')
    expect(data).toHaveProperty('totalSessions')
    expect(data).toHaveProperty('quizStats')
    expect(data).toHaveProperty('financeStats')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('lastUpdated')
  })

  it('has correct quizStats structure', () => {
    const json = exportToJSON()
    const data = JSON.parse(json)
    
    expect(data.quizStats).toHaveProperty('correct')
    expect(data.quizStats).toHaveProperty('total')
    expect(data.quizStats).toHaveProperty('accuracy')
  })

  it('has correct financeStats structure', () => {
    const json = exportToJSON()
    const data = JSON.parse(json)
    
    expect(data.financeStats).toHaveProperty('correct')
    expect(data.financeStats).toHaveProperty('total')
    expect(data.financeStats).toHaveProperty('accuracy')
  })

  it('returns zero accuracy for empty state', () => {
    const json = exportToJSON()
    const data = JSON.parse(json)
    
    expect(data.quizStats.accuracy).toBe(0)
    expect(data.financeStats.accuracy).toBe(0)
  })

  it('calculates accuracy correctly with data', () => {
    const state = useEconomicsStore.getState()
    // Simulate some quiz results by directly modifying state
    state.quizResults.push({
      id: '1',
      score: 8,
      total: 10,
      date: new Date().toISOString(),
    })
    
    const json = exportToJSON()
    const data = JSON.parse(json)
    
    expect(data.quizStats.correct).toBe(8)
    expect(data.quizStats.total).toBe(10)
    expect(data.quizStats.accuracy).toBe(80)
  })
})
