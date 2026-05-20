import { describe, it, expect } from 'vitest'
import {
  calcInflationResult,
  getInflationLevelKey,
  calcRuleOf70Years,
} from './inflation-calculator'

describe('calcInflationResult', () => {
  it('calculates real value after 5 years at 7% inflation', () => {
    const result = calcInflationResult(100000, 7, 2020, 2025)
    expect(result).not.toBeNull()
    expect(result!.realValue).toBeCloseTo(71298.6, 0)
    expect(result!.years).toBe(5)
  })

  it('calculates total inflation as decimal fraction', () => {
    const result = calcInflationResult(100000, 7, 2020, 2025)
    expect(result!.totalInflation).toBeCloseTo(0.40255, 3)
  })

  it('calculates purchasing power percentage', () => {
    const result = calcInflationResult(100000, 7, 2020, 2025)
    expect(result!.purchasingPower).toBeCloseTo(71.299, 1)
  })

  it('generates yearly data with correct number of points (years + 1)', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    expect(result!.yearlyData.length).toBe(6)
  })

  it('first yearly data point is the initial amount at start year', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    const first = result!.yearlyData[0]
    expect(first.year).toBe(2020)
    expect(first.realValue).toBe(100000)
    expect(first.lostValue).toBe(0)
    expect(first.purchasingPower).toBe(100)
  })

  it('last yearly data point matches the final year', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    const last = result!.yearlyData[5]
    expect(last.year).toBe(2025)
  })

  it('yearly data years are sequential', () => {
    const result = calcInflationResult(100000, 5, 2020, 2023)
    const years = result!.yearlyData.map(d => d.year)
    expect(years).toEqual([2020, 2021, 2022, 2023])
  })

  it('lost value increases each year', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    for (let i = 1; i < result!.yearlyData.length; i++) {
      expect(result!.yearlyData[i].lostValue).toBeGreaterThan(
        result!.yearlyData[i - 1].lostValue
      )
    }
  })

  it('real value decreases each year', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    for (let i = 1; i < result!.yearlyData.length; i++) {
      expect(result!.yearlyData[i].realValue).toBeLessThan(
        result!.yearlyData[i - 1].realValue
      )
    }
  })

  it('purchasing power decreases each year', () => {
    const result = calcInflationResult(100000, 5, 2020, 2025)
    for (let i = 1; i < result!.yearlyData.length; i++) {
      expect(result!.yearlyData[i].purchasingPower).toBeLessThan(
        result!.yearlyData[i - 1].purchasingPower
      )
    }
  })

  it('returns null when endYear <= startYear', () => {
    expect(calcInflationResult(100000, 5, 2020, 2020)).toBeNull()
    expect(calcInflationResult(100000, 5, 2020, 2019)).toBeNull()
  })

  it('returns null when initialAmount is NaN', () => {
    expect(calcInflationResult(NaN, 5, 2020, 2025)).toBeNull()
  })

  it('returns null when inflationRate is NaN', () => {
    expect(calcInflationResult(100000, NaN, 2020, 2025)).toBeNull()
  })

  it('returns null when startYear is NaN', () => {
    expect(calcInflationResult(100000, 5, NaN, 2025)).toBeNull()
  })

  it('returns null when endYear is NaN', () => {
    expect(calcInflationResult(100000, 5, 2020, NaN)).toBeNull()
  })

  it('handles zero inflation rate', () => {
    const result = calcInflationResult(100000, 0, 2020, 2025)
    expect(result!.realValue).toBe(100000)
    expect(result!.purchasingPower).toBe(100)
    expect(result!.totalInflation).toBe(0)
  })

  it('handles large time spans', () => {
    const result = calcInflationResult(100000, 3, 1990, 2025)
    expect(result!.years).toBe(35)
    expect(result!.yearlyData.length).toBe(36)
  })
})

describe('getInflationLevelKey', () => {
  it('returns low for rates below 3%', () => {
    expect(getInflationLevelKey(0)).toBe('low')
    expect(getInflationLevelKey(2.9)).toBe('low')
  })

  it('returns moderate for rates 3% to below 10%', () => {
    expect(getInflationLevelKey(3)).toBe('moderate')
    expect(getInflationLevelKey(7)).toBe('moderate')
    expect(getInflationLevelKey(9.9)).toBe('moderate')
  })

  it('returns high for rates 10% to below 50%', () => {
    expect(getInflationLevelKey(10)).toBe('high')
    expect(getInflationLevelKey(25)).toBe('high')
    expect(getInflationLevelKey(49.9)).toBe('high')
  })

  it('returns hyper for rates 50% and above', () => {
    expect(getInflationLevelKey(50)).toBe('hyper')
    expect(getInflationLevelKey(100)).toBe('hyper')
    expect(getInflationLevelKey(1000)).toBe('hyper')
  })

  it('handles negative rates as low', () => {
    expect(getInflationLevelKey(-5)).toBe('low')
  })
})

describe('calcRuleOf70Years', () => {
  it('returns correct doubling time for 7% inflation', () => {
    expect(calcRuleOf70Years(7)).toBe(10)
  })

  it('returns correct doubling time for 2% inflation', () => {
    expect(calcRuleOf70Years(2)).toBe(35)
  })

  it('returns correct doubling time for 10% inflation', () => {
    expect(calcRuleOf70Years(10)).toBe(7)
  })

  it('returns null for zero rate', () => {
    expect(calcRuleOf70Years(0)).toBeNull()
  })

  it('returns null for negative rate', () => {
    expect(calcRuleOf70Years(-5)).toBeNull()
  })

  it('returns 1 for 70% hyperinflation', () => {
    expect(calcRuleOf70Years(70)).toBe(1)
  })

  it('returns rounded value for fractional rates', () => {
    expect(calcRuleOf70Years(3)).toBe(23) // 70/3 = 23.33 -> 23
  })
})
