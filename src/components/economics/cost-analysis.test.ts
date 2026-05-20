import { describe, it, expect } from 'vitest'
import {
  calcCostData,
  calcMinATC,
  calcCostsAtQ,
  calcTableData,
  calcDecisionStatus,
} from './cost-analysis'

describe('calcCostData', () => {
  it('generates data points from Q=1 to maxQ', () => {
    const data = calcCostData(200, 5, 0.1, 10)
    expect(data.length).toBe(10)
    expect(data[0].quantity).toBe(1)
    expect(data[9].quantity).toBe(10)
  })

  it('calculates correct values at Q=1', () => {
    const data = calcCostData(200, 5, 0.1, 10)
    const first = data[0]
    // FC=200, VC=5*1+0.1*1=5.1, TC=205.1
    // ATC=205.1, AVC=5.1, MC=5+0.2=5.2, AFC=200
    expect(first.atc).toBeCloseTo(205.1, 1)
    expect(first.avc).toBeCloseTo(5.1, 1)
    expect(first.mc).toBeCloseTo(5.2, 1)
    expect(first.afc).toBe(200)
  })

  it('MC increases linearly with Q', () => {
    const data = calcCostData(200, 5, 0.1, 10)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].mc).toBeGreaterThan(data[i - 1].mc)
    }
  })

  it('AFC decreases as Q increases', () => {
    const data = calcCostData(200, 5, 0.1, 10)
    for (let i = 1; i < data.length; i++) {
      expect(data[i].afc).toBeLessThan(data[i - 1].afc)
    }
  })

  it('ATC first decreases then increases (U-shaped)', () => {
    const data = calcCostData(200, 5, 0.1, 50)
    let minIdx = 0
    let minVal = Infinity
    data.forEach((d, i) => {
      if (d.atc < minVal) { minVal = d.atc; minIdx = i }
    })
    expect(minIdx).toBeGreaterThan(0)
    expect(minIdx).toBeLessThan(data.length - 1)
  })

  it('MC crosses ATC near minimum', () => {
    const data = calcCostData(200, 5, 0.1, 50)
    // Find where MC goes from below ATC to above
    let crossoverIdx = -1
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].mc < data[i - 1].atc && data[i].mc >= data[i].atc) {
        crossoverIdx = i
        break
      }
    }
    expect(crossoverIdx).toBeGreaterThan(0)
  })
})

describe('calcMinATC', () => {
  it('calculates Q for min ATC: sqrt(FC/q_coef)', () => {
    expect(calcMinATC(200, 0.1)).toBeCloseTo(44.72, 2)
  })

  it('returns null when quadCoef <= 0', () => {
    expect(calcMinATC(200, 0)).toBeNull()
    expect(calcMinATC(200, -0.1)).toBeNull()
  })

  it('larger FC increases optimal Q', () => {
    expect(calcMinATC(800, 0.1)!).toBeGreaterThan(calcMinATC(200, 0.1)!)
  })

  it('larger quadCoef decreases optimal Q', () => {
    expect(calcMinATC(200, 0.4)!).toBeLessThan(calcMinATC(200, 0.1)!)
  })
})

describe('calcCostsAtQ', () => {
  it('calculates costs correctly at Q=10', () => {
    const c = calcCostsAtQ(10, 200, 5, 0.1, 20)
    expect(c.fc).toBe(200)
    expect(c.vc).toBeCloseTo(60, 0) // 5*10 + 0.1*100 = 60
    expect(c.tc).toBeCloseTo(260, 0)
    expect(c.atc).toBeCloseTo(26, 0)
    expect(c.revenue).toBe(200)
    expect(c.profit).toBeCloseTo(-60, 0)
  })

  it('profit is positive when price > ATC', () => {
    const c = calcCostsAtQ(10, 200, 5, 0.1, 30)
    expect(c.profit).toBeGreaterThan(0)
  })

  it('revenue equals price * quantity', () => {
    const c = calcCostsAtQ(15, 100, 3, 0.05, 25)
    expect(c.revenue).toBe(375)
  })

  it('mc = varCost + 2*quadCoef*Q', () => {
    const c = calcCostsAtQ(20, 200, 5, 0.1, 20)
    expect(c.mc).toBeCloseTo(9, 0) // 5 + 2*0.1*20 = 9
  })
})

describe('calcTableData', () => {
  it('generates rows for standard quantities up to maxQ', () => {
    const data = calcTableData(200, 5, 0.1, 30)
    expect(data.length).toBe(7) // 1,5,10,15,20,25,30
    expect(data.map(d => d.q)).toEqual([1, 5, 10, 15, 20, 25, 30])
  })

  it('filters quantities above maxQ', () => {
    const data = calcTableData(200, 5, 0.1, 12)
    expect(data.map(d => d.q)).toEqual([1, 5, 10])
  })

  it('each row has consistent cost calculations', () => {
    const data = calcTableData(200, 5, 0.1, 20)
    data.forEach(row => {
      expect(row.tc).toBeCloseTo(row.fc + row.vc, 0)
    })
  })
})

describe('calcDecisionStatus', () => {
  it('returns profitable when price >= breakeven', () => {
    const ds = calcDecisionStatus(25, 20, 5, { profitable: 'P', lossContinue: 'L', shutdown: 'S' })
    expect(ds.kind).toBe('profitable')
  })

  it('returns lossContinue when price between shutdown and breakeven', () => {
    const ds = calcDecisionStatus(15, 20, 5, { profitable: 'P', lossContinue: 'L', shutdown: 'S' })
    expect(ds.kind).toBe('lossContinue')
  })

  it('returns shutdown when price < shutdown', () => {
    const ds = calcDecisionStatus(3, 20, 5, { profitable: 'P', lossContinue: 'L', shutdown: 'S' })
    expect(ds.kind).toBe('shutdown')
  })

  it('handles null breakeven (treats as Infinity)', () => {
    const ds = calcDecisionStatus(15, null, 5, { profitable: 'P', lossContinue: 'L', shutdown: 'S' })
    expect(ds.kind).toBe('lossContinue')
  })

  it('correct labels are used', () => {
    const ds = calcDecisionStatus(25, 20, 5, { profitable: 'Win', lossContinue: 'Lose', shutdown: 'Stop' })
    expect(ds.label).toBe('Win')
  })
})
