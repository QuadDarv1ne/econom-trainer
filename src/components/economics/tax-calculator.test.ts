import { describe, it, expect } from 'vitest'
import {
  calcNDFL,
  calcNDS,
  calcProfitTax,
} from './tax-calculator'

describe('calcNDFL', () => {
  it('calculates 13% flat tax for income within first bracket', () => {
    const result = calcNDFL(600_000, 0)
    expect(result.totalTax).toBeCloseTo(78_000, 0) // 600000 * 0.13
    expect(result.effectiveRate).toBeCloseTo(0.13, 4)
    expect(result.marginalRate).toBe(0.13)
  })

  it('applies deduction reducing taxable income', () => {
    const result = calcNDFL(600_000, 120_000)
    expect(result.taxable).toBe(480_000)
    expect(result.totalTax).toBeCloseTo(62_400, 0) // 480000 * 0.13
  })

  it('handles income spanning first two brackets', () => {
    const result = calcNDFL(3_000_000, 0)
    // First 2.4M at 13% = 312000, remaining 600K at 15% = 90000
    expect(result.totalTax).toBeCloseTo(402_000, 0)
    expect(result.marginalRate).toBe(0.15)
  })

  it('calculates tax across multiple brackets for high income', () => {
    const result = calcNDFL(25_000_000, 0)
    // 2.4M*0.13 + 2.6M*0.15 + 15M*0.18 + 5M*0.20 = 312K + 390K + 2.7M + 1M = 4.402M
    expect(result.totalTax).toBeCloseTo(4_402_000, 0)
    expect(result.marginalRate).toBe(0.20)
  })

  it('handles ultra-high income reaching 22% bracket', () => {
    const result = calcNDFL(100_000_000, 0)
    expect(result.marginalRate).toBe(0.22)
    expect(result.brackets[4].taxableInBracket).toBeGreaterThan(0)
  })

  it('returns zero tax when income equals deduction', () => {
    const result = calcNDFL(500_000, 500_000)
    expect(result.totalTax).toBe(0)
    expect(result.taxable).toBe(0)
    expect(result.effectiveRate).toBe(0)
  })

  it('returns zero tax when deduction exceeds income', () => {
    const result = calcNDFL(300_000, 500_000)
    expect(result.totalTax).toBe(0)
    expect(result.taxable).toBe(0)
    expect(result.netIncome).toBe(300_000)
  })

  it('netIncome equals income minus totalTax', () => {
    const result = calcNDFL(5_000_000, 0)
    expect(result.netIncome).toBeCloseTo(5_000_000 - result.totalTax, 0)
  })

  it('all brackets sum up to total tax', () => {
    const result = calcNDFL(10_000_000, 0)
    const sum = result.brackets.reduce((s, b) => s + b.tax, 0)
    expect(sum).toBeCloseTo(result.totalTax, 0)
  })

  it('brackets have non-negative taxableInBracket values', () => {
    const result = calcNDFL(15_000_000, 0)
    result.brackets.forEach(b => {
      expect(b.taxableInBracket).toBeGreaterThanOrEqual(0)
      expect(b.tax).toBeGreaterThanOrEqual(0)
    })
  })

  it('handles zero income', () => {
    const result = calcNDFL(0, 0)
    expect(result.totalTax).toBe(0)
    expect(result.netIncome).toBe(0)
    expect(result.marginalRate).toBe(0)
  })

  it('property deduction of 260000 reduces tax significantly', () => {
    const result = calcNDFL(2_600_000, 260_000)
    expect(result.taxable).toBe(2_340_000)
    expect(result.totalTax).toBeCloseTo(304_200, 0)
  })
})

describe('calcNDS', () => {
  it('extracts 20% VAT from price correctly', () => {
    const result = calcNDS(1200, 0.2)
    expect(result.base).toBeCloseTo(1000, 5)
    expect(result.vatAmount).toBeCloseTo(200, 5)
    expect(result.total).toBe(1200)
  })

  it('extracts 10% VAT from price correctly', () => {
    const result = calcNDS(1100, 0.1)
    expect(result.base).toBeCloseTo(1000, 5)
    expect(result.vatAmount).toBeCloseTo(100, 5)
  })

  it('handles zero price', () => {
    const result = calcNDS(0, 0.2)
    expect(result.base).toBe(0)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(0)
  })

  it('base + vatAmount equals total', () => {
    const result = calcNDS(5432, 0.2)
    expect(result.base + result.vatAmount).toBeCloseTo(result.total, 5)
  })

  it('VAT amount equals base * rate', () => {
    const result = calcNDS(1200, 0.2)
    expect(result.vatAmount).toBeCloseTo(result.base * 0.2, 5)
  })
})

describe('calcProfitTax', () => {
  it('calculates 20% profit tax correctly', () => {
    const result = calcProfitTax(10_000_000, 7_000_000, 0.03, 0.17)
    expect(result.profit).toBe(3_000_000)
    expect(result.tax).toBeCloseTo(600_000, 0) // 3M * 0.20
    expect(result.netProfit).toBeCloseTo(2_400_000, 0)
  })

  it('splits tax between federal and regional budgets', () => {
    const result = calcProfitTax(10_000_000, 7_000_000, 0.03, 0.17)
    expect(result.federalTax).toBeCloseTo(90_000, 0) // 3M * 0.03
    expect(result.regionalTax).toBeCloseTo(510_000, 0) // 3M * 0.17
    expect(result.federalTax + result.regionalTax).toBeCloseTo(result.tax, 0)
  })

  it('returns zero tax when expenses exceed revenue (loss)', () => {
    const result = calcProfitTax(5_000_000, 8_000_000, 0.03, 0.17)
    expect(result.profit).toBe(-3_000_000)
    expect(result.tax).toBe(0)
    expect(result.netProfit).toBe(-3_000_000)
  })

  it('handles break-even scenario', () => {
    const result = calcProfitTax(5_000_000, 5_000_000, 0.03, 0.17)
    expect(result.profit).toBe(0)
    expect(result.tax).toBe(0)
    expect(result.netProfit).toBe(0)
  })

  it('effectiveRate is tax divided by revenue', () => {
    const result = calcProfitTax(10_000_000, 7_000_000, 0.03, 0.17)
    expect(result.effectiveRate).toBeCloseTo(0.06, 4) // 600K / 10M
  })

  it('effectiveRate is zero when revenue is zero', () => {
    const result = calcProfitTax(0, 0, 0.03, 0.17)
    expect(result.effectiveRate).toBe(0)
  })

  it('totalRate equals federalRate + regionalRate', () => {
    const result = calcProfitTax(10_000_000, 7_000_000, 0.03, 0.17)
    expect(result.totalRate).toBe(0.20)
  })

  it('handles custom rates', () => {
    const result = calcProfitTax(1_000_000, 200_000, 0.05, 0.10)
    expect(result.totalRate).toBeCloseTo(0.15, 10)
    expect(result.tax).toBeCloseTo(120_000, 0) // 800K * 0.15
  })
})
