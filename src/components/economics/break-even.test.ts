import { describe, it, expect } from 'vitest'
import {
  calcBreakEvenUnits,
  calcBreakEvenRevenue,
  calcContributionMargin,
  calcMarginOfSafety,
  calcChartData,
  calcProfitAtMax,
  isViable,
} from './break-even'

describe('calcBreakEvenUnits', () => {
  it('calculates BEP units correctly', () => {
    expect(calcBreakEvenUnits(100000, 300, 500)).toBe(500)
  })

  it('returns Infinity when contribution <= 0', () => {
    expect(calcBreakEvenUnits(100000, 500, 500)).toBe(Infinity)
    expect(calcBreakEvenUnits(100000, 600, 500)).toBe(Infinity)
  })

  it('rounds up to nearest integer', () => {
    expect(calcBreakEvenUnits(1000, 300, 500)).toBe(5)
  })

  it('handles zero fixed costs', () => {
    expect(calcBreakEvenUnits(0, 300, 500)).toBe(0)
  })
})

describe('calcBreakEvenRevenue', () => {
  it('calculates BEP revenue correctly', () => {
    expect(calcBreakEvenRevenue(500, 500)).toBe(250000)
  })

  it('returns NaN when breakEvenUnits is Infinity', () => {
    expect(calcBreakEvenRevenue(Infinity, 500)).toBeNaN()
  })

  it('returns 0 when price is 0', () => {
    expect(calcBreakEvenRevenue(500, 0)).toBe(0)
  })
})

describe('calcContributionMargin', () => {
  it('calculates contribution margin percentage', () => {
    expect(calcContributionMargin(500, 300)).toBe(40)
  })

  it('returns 0 when pricePerUnit <= 0', () => {
    expect(calcContributionMargin(0, 300)).toBe(0)
    expect(calcContributionMargin(-10, 300)).toBe(0)
  })

  it('handles zero variable costs (100% margin)', () => {
    expect(calcContributionMargin(500, 0)).toBe(100)
  })

  it('handles loss scenario (negative margin)', () => {
    expect(calcContributionMargin(500, 600)).toBe(-20)
  })
})

describe('calcMarginOfSafety', () => {
  it('calculates margin of safety percentage', () => {
    expect(calcMarginOfSafety(1000, 500)).toBe(50)
  })

  it('returns 0 when maxUnits <= 0', () => {
    expect(calcMarginOfSafety(0, 500)).toBe(0)
    expect(calcMarginOfSafety(-100, 500)).toBe(0)
  })

  it('returns negative when BEP exceeds max capacity', () => {
    expect(calcMarginOfSafety(200, 500)).toBe(-150)
  })

  it('returns 0 when BEP equals max capacity', () => {
    expect(calcMarginOfSafety(500, 500)).toBe(0)
  })

  it('handles Infinity BEP', () => {
    expect(calcMarginOfSafety(1000, Infinity)).toBeCloseTo(-Infinity)
  })
})

describe('calcChartData', () => {
  it('generates correct number of data points', () => {
    const data = calcChartData(100000, 300, 500, 1000)
    expect(data.length).toBeGreaterThan(0)
    expect(data[0].quantity).toBe(0)
    expect(data[data.length - 1].quantity).toBe(1000)
  })

  it('first point has no revenue and negative profit', () => {
    const data = calcChartData(100000, 300, 500, 1000)
    expect(data[0].revenue).toBe(0)
    expect(data[0].totalCost).toBe(100000)
    expect(data[0].profit).toBe(-100000)
  })

  it('calculates correct values at BEP', () => {
    const data = calcChartData(100000, 300, 500, 1000)
    const bepPoint = data.find(d => d.quantity === 500)
    expect(bepPoint).toBeDefined()
    expect(bepPoint!.revenue).toBe(250000)
    expect(bepPoint!.totalCost).toBe(250000)
    expect(bepPoint!.profit).toBe(0)
  })

  it('fixedCost is constant across all points', () => {
    const data = calcChartData(100000, 300, 500, 1000)
    data.forEach(point => {
      expect(point.fixedCost).toBe(100000)
    })
  })
})

describe('calcProfitAtMax', () => {
  it('calculates profit at maximum capacity', () => {
    expect(calcProfitAtMax(100000, 300, 500, 1000)).toBe(100000)
  })

  it('handles loss scenario', () => {
    expect(calcProfitAtMax(100000, 400, 300, 1000)).toBe(-200000)
  })
})

describe('isViable', () => {
  it('returns true when price > variable cost', () => {
    expect(isViable(500, 300)).toBe(true)
  })

  it('returns false when price <= variable cost', () => {
    expect(isViable(300, 300)).toBe(false)
    expect(isViable(200, 300)).toBe(false)
  })
})
