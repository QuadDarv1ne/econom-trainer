import { describe, it, expect } from 'vitest'
import {
  calcEquilibrium,
  generateChartData,
  generatePracticeProblem,
} from './supply-demand'

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'supply-demand.practice.equilibrium': 'Qd = {a} - {b}P, Qs = {c} + {d}P. Find equilibrium price.',
    'supply-demand.practice.elasticity': 'Qd = {a} - {b}P. Find elasticity at P = {p}.',
    'supply-demand.practice.shift': 'Qd = {a} - {b}P, Qs = {c} + {d}P. Demand increases by {shift}. Find delta Q.',
  }
  return translations[key] ?? key
}

describe('calcEquilibrium', () => {
  it('calculates equilibrium correctly for standard parameters', () => {
    // P = 100 - 1*Q (demand), P = 10 + 0.8*Q (supply)
    // Equilibrium: 100 - Q = 10 + 0.8Q => 90 = 1.8Q => Q = 50, P = 50
    const eq = calcEquilibrium(100, 1, 10, 0.8, 0, 0)
    expect(eq.price).toBeCloseTo(50, 5)
    expect(eq.quantity).toBeCloseTo(50, 5)
  })

  it('handles demand shift positive (increase)', () => {
    const eq = calcEquilibrium(100, 1, 10, 0.8, 20, 0)
    expect(eq.quantity).toBeGreaterThan(50)
    expect(eq.price).toBeGreaterThan(50)
  })

  it('handles demand shift negative (decrease)', () => {
    const eq = calcEquilibrium(100, 1, 10, 0.8, -20, 0)
    expect(eq.quantity).toBeLessThan(50)
    expect(eq.price).toBeLessThan(50)
  })

  it('handles supply shift positive (increase in intercept reduces quantity)', () => {
    const eq = calcEquilibrium(100, 1, 10, 0.8, 0, 20)
    // Supply curve shifts up: P = 30 + 0.8Q, equilibrium quantity decreases
    expect(eq.quantity).toBeLessThan(50)
    expect(eq.price).toBeGreaterThan(50)
  })

  it('handles supply shift negative (decrease in intercept increases quantity)', () => {
    const eq = calcEquilibrium(100, 1, 10, 0.8, 0, -20)
    // Supply curve shifts down: P = -10 + 0.8Q, equilibrium quantity increases
    expect(eq.quantity).toBeGreaterThan(50)
    expect(eq.price).toBeLessThan(50)
  })

  it('returns non-negative price even when calculation yields negative', () => {
    const eq = calcEquilibrium(10, 1, 100, 0.8, 0, 0)
    expect(eq.price).toBeGreaterThanOrEqual(0)
    expect(eq.quantity).toBeGreaterThanOrEqual(0)
  })

  it('returns correct equilibrium with both shifts', () => {
    // Both demand and supply increase by 10
    const eq = calcEquilibrium(100, 1, 10, 0.8, 10, 10)
    // 110 - Q = 20 + 0.8Q => 90 = 1.8Q => Q = 50, P = 60
    expect(eq.quantity).toBeCloseTo(50, 5)
    expect(eq.price).toBeCloseTo(60, 5)
  })
})

describe('generateChartData', () => {
  it('generates data points starting from quantity 0', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    expect(data[0].quantity).toBe(0)
  })

  it('first point has correct demand and supply prices', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    expect(data[0].demand).toBe(100)
    expect(data[0].supply).toBe(10)
  })

  it('demand price at quantity Q equals demandIntercept - demandSlope * Q', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    const pointAt50 = data.find(d => d.quantity === 50)
    expect(pointAt50).toBeDefined()
    expect(pointAt50!.demand).toBeCloseTo(50, 5) // 100 - 1*50 = 50
    expect(pointAt50!.supply).toBeCloseTo(50, 5) // 10 + 0.8*50 = 50
  })

  it('applies demand shift correctly', () => {
    const data = generateChartData(100, 1, 10, 0.8, 10, 0)
    expect(data[0].demand).toBe(110) // 100 + 10
  })

  it('applies supply shift correctly', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 10)
    expect(data[0].supply).toBe(20) // 10 + 10
  })

  it('quantity values increment by 2', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].quantity - data[i - 1].quantity).toBe(2)
    }
  })

  it('all demand prices are non-negative', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    data.forEach(point => {
      expect(point.demand).toBeGreaterThanOrEqual(0)
    })
  })

  it('all supply prices are <= 150', () => {
    const data = generateChartData(100, 1, 10, 0.8, 0, 0)
    data.forEach(point => {
      expect(point.supply).toBeLessThanOrEqual(150)
    })
  })

  it('generates data with shifted parameters', () => {
    const data = generateChartData(100, 1, 10, 0.8, 20, -10)
    expect(data.length).toBeGreaterThan(0)
  })
})

describe('generatePracticeProblem', () => {
  it('returns a problem with valid structure', () => {
    const problem = generatePracticeProblem(mockT)
    expect(problem).toHaveProperty('type')
    expect(problem).toHaveProperty('question')
    expect(problem).toHaveProperty('answer')
    expect(problem).toHaveProperty('tolerance')
  })

  it('type is one of equilibrium, elasticity, shift', () => {
    const problem = generatePracticeProblem(mockT)
    expect(['equilibrium', 'elasticity', 'shift']).toContain(problem.type)
  })

  it('question is a non-empty string', () => {
    const problem = generatePracticeProblem(mockT)
    expect(typeof problem.question).toBe('string')
    expect(problem.question.length).toBeGreaterThan(0)
  })

  it('answer is a number', () => {
    const problem = generatePracticeProblem(mockT)
    expect(typeof problem.answer).toBe('number')
  })

  it('tolerance is positive', () => {
    const problem = generatePracticeProblem(mockT)
    expect(problem.tolerance).toBeGreaterThan(0)
  })

  it('generates different problems on subsequent calls (randomness)', () => {
    // Run many times to check that we get variety
    const types = new Set<string>()
    for (let i = 0; i < 30; i++) {
      types.add(generatePracticeProblem(mockT).type)
    }
    // Should eventually see all 3 types
    expect(types.size).toBe(3)
  })
})
