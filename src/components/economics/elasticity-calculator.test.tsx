import { describe, it, expect } from 'vitest'
import { calcPriceElasticity, calcIncomeElasticity, calcCrossElasticity, ElasticityResult } from './elasticity-calculator'

function checkResult(r: ElasticityResult | null): asserts r is ElasticityResult {
  expect(r).not.toBeNull()
}

describe('calcPriceElasticity', () => {
  it('calculates elastic demand (|E| > 1)', () => {
    const res = calcPriceElasticity(100, 80, 50, 60)
    checkResult(res)
    expect(Math.abs(res.value)).toBeGreaterThan(1)
    expect(res.categoryKey).toBe('elasticity.category.elastic')
  })

  it('calculates inelastic demand (|E| < 1)', () => {
    const res = calcPriceElasticity(100, 95, 50, 60)
    checkResult(res)
    expect(Math.abs(res.value)).toBeLessThan(1)
    expect(res.categoryKey).toBe('elasticity.category.inelastic')
  })

  it('calculates unit elastic demand (|E| = 1)', () => {
    const res = calcPriceElasticity(100, 80, 50, 40)
    checkResult(res)
    expect(Math.abs(res.value)).toBeCloseTo(1, 1)
    expect(res.categoryKey).toBe('elasticity.category.unitary')
  })

  it('returns null when p1 === p2', () => {
    expect(calcPriceElasticity(100, 80, 50, 50)).toBeNull()
  })

  it('handles zero quantity changes (perfectly inelastic)', () => {
    const res = calcPriceElasticity(100, 100, 50, 60)
    checkResult(res)
    expect(res.value).toBe(0)
    expect(res.categoryKey).toBe('elasticity.category.perfectlyInelastic')
  })
})

describe('calcIncomeElasticity', () => {
  it('identifies luxury goods (E > 1)', () => {
    const res = calcIncomeElasticity(50, 100, 10000, 15000)
    checkResult(res)
    expect(res.value).toBeGreaterThan(1)
    expect(res.categoryKey).toBe('elasticity.category.luxury')
  })

  it('identifies normal goods (0 < E < 1)', () => {
    const res = calcIncomeElasticity(50, 60, 10000, 15000)
    checkResult(res)
    expect(res.value).toBeGreaterThan(0)
    expect(res.value).toBeLessThan(1)
    expect(res.categoryKey).toBe('elasticity.category.normal')
  })

  it('identifies inferior goods (E < 0)', () => {
    const res = calcIncomeElasticity(100, 80, 10000, 15000)
    checkResult(res)
    expect(res.value).toBeLessThan(0)
    expect(res.categoryKey).toBe('elasticity.category.inferior')
  })

  it('returns null when y1 === y2', () => {
    expect(calcIncomeElasticity(50, 100, 10000, 10000)).toBeNull()
  })
})

describe('calcCrossElasticity', () => {
  it('identifies substitutes (E > 0)', () => {
    const res = calcCrossElasticity(100, 120, 50, 60)
    checkResult(res)
    expect(res.value).toBeGreaterThan(0)
    expect(res.categoryKey).toBe('elasticity.category.substitutes')
  })

  it('identifies complements (E < 0)', () => {
    const res = calcCrossElasticity(100, 80, 50, 60)
    checkResult(res)
    expect(res.value).toBeLessThan(0)
    expect(res.categoryKey).toBe('elasticity.category.complements')
  })

  it('identifies independent goods (E = 0)', () => {
    const res = calcCrossElasticity(100, 100, 50, 60)
    checkResult(res)
    expect(res.value).toBe(0)
    expect(res.categoryKey).toBe('elasticity.category.independent')
  })

  it('returns null when px1 === px2', () => {
    expect(calcCrossElasticity(100, 120, 50, 50)).toBeNull()
  })
})
