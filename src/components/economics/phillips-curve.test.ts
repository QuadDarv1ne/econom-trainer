import { describe, it, expect } from 'vitest'
import {
  calcSRPCData,
  calcEquilibriumInflation,
  calcSacrificeRatio,
  isStagflation,
} from './phillips-curve'

describe('calcSRPCData', () => {
  it('generates data points from u=0 to u=12 with step 0.5', () => {
    const data = calcSRPCData(5, 0.5, 5, 0)
    expect(data.length).toBe(25) // 0, 0.5, 1, ..., 12 => 25 points
    expect(data[0].unemployment).toBe(0)
    expect(data[24].unemployment).toBe(12)
  })

  it('calculates correct inflation at u = naturalRate (should equal expectedInflation + supplyShock)', () => {
    // When u = u*, the formula gives: pi = pi_e - alpha*(u* - u*) + epsilon = pi_e + epsilon
    const data = calcSRPCData(5, 0.5, 5, 0)
    const atNatural = data.find((d) => d.unemployment === 5)
    expect(atNatural).toBeDefined()
    expect(atNatural!.srpcInflation).toBe(5)
  })

  it('SRPC has negative slope (inflation decreases as unemployment increases)', () => {
    const data = calcSRPCData(5, 0.5, 5, 0)
    expect(data[0].srpcInflation).toBeGreaterThan(data[24].srpcInflation)
  })

  it('higher alpha makes the curve steeper', () => {
    const dataLow = calcSRPCData(5, 0.3, 5, 0)
    const dataHigh = calcSRPCData(5, 0.8, 5, 0)
    const slopeLow = dataLow[0].srpcInflation - dataLow[24].srpcInflation
    const slopeHigh = dataHigh[0].srpcInflation - dataHigh[24].srpcInflation
    expect(slopeHigh).toBeGreaterThan(slopeLow)
  })

  it('positive supply shock shifts the entire curve up', () => {
    const dataNoShock = calcSRPCData(5, 0.5, 5, 0)
    const dataShock = calcSRPCData(5, 0.5, 5, 3)
    for (let i = 0; i < dataNoShock.length; i++) {
      expect(dataShock[i].srpcInflation).toBeCloseTo(dataNoShock[i].srpcInflation + 3, 2)
    }
  })

  it('higher expected inflation shifts the curve up', () => {
    const dataLow = calcSRPCData(3, 0.5, 5, 0)
    const dataHigh = calcSRPCData(8, 0.5, 5, 0)
    for (let i = 0; i < dataLow.length; i++) {
      expect(dataHigh[i].srpcInflation).toBeCloseTo(dataLow[i].srpcInflation + 5, 2)
    }
  })

  it('higher natural rate shifts the curve right', () => {
    const data1 = calcSRPCData(5, 0.5, 4, 0)
    const data2 = calcSRPCData(5, 0.5, 7, 0)
    // At u=4, data1 should have inflation=5 (u=u*), data2 should have inflation > 5
    const at4_1 = data1.find((d) => d.unemployment === 4)!
    const at4_2 = data2.find((d) => d.unemployment === 4)!
    expect(at4_1.srpcInflation).toBe(5)
    expect(at4_2.srpcInflation).toBeGreaterThan(5)
  })

  it('rounds values to 2 decimal places', () => {
    const data = calcSRPCData(5, 0.33, 5, 0)
    for (const point of data) {
      expect(Math.round(point.srpcInflation * 100) / 100).toBe(point.srpcInflation)
    }
  })
})

describe('calcEquilibriumInflation', () => {
  it('calculates pi = pi_e when u = u* and epsilon = 0', () => {
    const result = calcEquilibriumInflation(5, 0.5, 5, 5, 0)
    expect(result).toBe(5)
  })

  it('calculates correct inflation with unemployment above natural rate', () => {
    // pi = 5 - 0.5*(7 - 5) + 0 = 5 - 1 = 4
    const result = calcEquilibriumInflation(5, 0.5, 7, 5, 0)
    expect(result).toBe(4)
  })

  it('calculates correct inflation with unemployment below natural rate', () => {
    // pi = 5 - 0.5*(3 - 5) + 0 = 5 + 1 = 6
    const result = calcEquilibriumInflation(5, 0.5, 3, 5, 0)
    expect(result).toBe(6)
  })

  it('accounts for supply shock', () => {
    // pi = 5 - 0.5*(5 - 5) + 3 = 8
    const result = calcEquilibriumInflation(5, 0.5, 5, 5, 3)
    expect(result).toBe(8)
  })

  it('negative supply shock reduces inflation', () => {
    // pi = 5 - 0.5*(5 - 5) - 2 = 3
    const result = calcEquilibriumInflation(5, 0.5, 5, 5, -2)
    expect(result).toBe(3)
  })

  it('combined effect: all parameters', () => {
    // pi = 8 - 0.6*(8 - 6) + 3 = 8 - 1.2 + 3 = 9.8
    const result = calcEquilibriumInflation(8, 0.6, 8, 6, 3)
    expect(result).toBeCloseTo(9.8, 10)
  })

  it('works with zero alpha', () => {
    // pi = 5 - 0*(5 - 5) + 0 = 5
    const result = calcEquilibriumInflation(5, 0, 5, 5, 0)
    expect(result).toBe(5)
  })
})

describe('calcSacrificeRatio', () => {
  it('returns 1/alpha for positive alpha', () => {
    expect(calcSacrificeRatio(0.5)).toBe(2)
  })

  it('returns correct ratio for alpha=0.25', () => {
    expect(calcSacrificeRatio(0.25)).toBe(4)
  })

  it('returns correct ratio for alpha=1', () => {
    expect(calcSacrificeRatio(1)).toBe(1)
  })

  it('returns correct ratio for alpha=0.6', () => {
    expect(calcSacrificeRatio(0.6)).toBeCloseTo(1.67, 2)
  })

  it('returns null for alpha=0', () => {
    expect(calcSacrificeRatio(0)).toBeNull()
  })

  it('returns null for negative alpha', () => {
    expect(calcSacrificeRatio(-0.5)).toBeNull()
  })

  it('larger alpha means smaller sacrifice ratio (easier to reduce inflation)', () => {
    const sr1 = calcSacrificeRatio(0.3)!
    const sr2 = calcSacrificeRatio(0.8)!
    expect(sr2).toBeLessThan(sr1)
  })
})

describe('isStagflation', () => {
  it('returns true when inflation > expected AND unemployment gap > 0', () => {
    expect(isStagflation(12, 10, 2)).toBe(true)
  })

  it('returns false when inflation <= expected (even with positive unemployment gap)', () => {
    expect(isStagflation(8, 10, 2)).toBe(false)
  })

  it('returns false when unemployment gap <= 0 (even with high inflation)', () => {
    expect(isStagflation(12, 10, 0)).toBe(false)
    expect(isStagflation(12, 10, -1)).toBe(false)
  })

  it('returns false when both conditions are not met', () => {
    expect(isStagflation(5, 5, 0)).toBe(false)
    expect(isStagflation(3, 5, 2)).toBe(false)
    expect(isStagflation(8, 5, -1)).toBe(false)
  })

  it('returns true with exact boundary: inflation strictly greater', () => {
    expect(isStagflation(10.01, 10, 0.1)).toBe(true)
  })

  it('returns false at exact equality for inflation', () => {
    expect(isStagflation(10, 10, 2)).toBe(false)
  })

  it('returns false at exact equality for unemployment gap', () => {
    expect(isStagflation(12, 10, 0)).toBe(false)
  })

  it('stagflation scenario from preset: pi_e=10, u*=6, alpha=0.6, eps=3, u=8', () => {
    // pi = 10 - 0.6*(8-6) + 3 = 10 - 1.2 + 3 = 11.8
    // pi > pi_e (11.8 > 10) AND u - u* = 2 > 0 => stagflation
    const pi = calcEquilibriumInflation(10, 0.6, 8, 6, 3)
    expect(isStagflation(pi, 10, 8 - 6)).toBe(true)
  })
})
