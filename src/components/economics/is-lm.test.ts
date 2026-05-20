import { describe, it, expect } from 'vitest'
import {
  calcISSlope,
  calcISIntercept,
  calcLMSlope,
  calcLMIntercept,
  calcISLMEquilibrium,
  calcISLMData,
  calcCrowdingOut,
  calcFiscalMultiplier,
  calcMonetaryMultiplier,
} from './is-lm'

describe('calcISSlope', () => {
  it('returns negative slope (IS curve slopes down)', () => {
    const slope = calcISSlope(0.75, 0.2, 50)
    expect(slope).toBeLessThan(0)
  })

  it('calculates correct slope: -(1-MPC(1-t))/d', () => {
    // MPC=0.75, t=0.2, d=50
    // -(1 - 0.75*(1-0.2))/50 = -(1 - 0.6)/50 = -0.4/50 = -0.008
    const slope = calcISSlope(0.75, 0.2, 50)
    expect(slope).toBeCloseTo(-0.008, 10)
  })

  it('higher investment sensitivity makes IS flatter (closer to 0)', () => {
    const slope1 = calcISSlope(0.75, 0.2, 50)
    const slope2 = calcISSlope(0.75, 0.2, 100)
    expect(Math.abs(slope2)).toBeLessThan(Math.abs(slope1))
  })

  it('higher MPC makes IS flatter (less negative slope)', () => {
    const slope1 = calcISSlope(0.6, 0.2, 50)
    const slope2 = calcISSlope(0.9, 0.2, 50)
    expect(Math.abs(slope2)).toBeLessThan(Math.abs(slope1))
  })

  it('higher tax rate makes IS steeper (more negative slope)', () => {
    const slope1 = calcISSlope(0.75, 0.1, 50)
    const slope2 = calcISSlope(0.75, 0.4, 50)
    expect(Math.abs(slope2)).toBeGreaterThan(Math.abs(slope1))
  })
})

describe('calcISIntercept', () => {
  it('calculates (I0 + G) / d', () => {
    const intercept = calcISIntercept(200, 150, 50)
    expect(intercept).toBe(7)
  })

  it('higher autonomous spending increases intercept', () => {
    const i1 = calcISIntercept(200, 150, 50)
    const i2 = calcISIntercept(300, 150, 50)
    expect(i2).toBeGreaterThan(i1)
  })

  it('higher gov spending increases intercept', () => {
    const i1 = calcISIntercept(200, 150, 50)
    const i2 = calcISIntercept(200, 250, 50)
    expect(i2).toBeGreaterThan(i1)
  })

  it('higher investment sensitivity decreases intercept', () => {
    const i1 = calcISIntercept(200, 150, 50)
    const i2 = calcISIntercept(200, 150, 100)
    expect(i2).toBeLessThan(i1)
  })
})

describe('calcLMSlope', () => {
  it('returns positive slope (LM curve slopes up)', () => {
    const slope = calcLMSlope(0.5, 100)
    expect(slope).toBeGreaterThan(0)
  })

  it('calculates k/h correctly', () => {
    const slope = calcLMSlope(0.5, 100)
    expect(slope).toBe(0.005)
  })

  it('higher money demand sensitivity increases slope', () => {
    const s1 = calcLMSlope(0.3, 100)
    const s2 = calcLMSlope(0.8, 100)
    expect(s2).toBeGreaterThan(s1)
  })

  it('higher interest sensitivity decreases slope', () => {
    const s1 = calcLMSlope(0.5, 50)
    const s2 = calcLMSlope(0.5, 200)
    expect(s2).toBeLessThan(s1)
  })
})

describe('calcLMIntercept', () => {
  it('calculates -M/h correctly', () => {
    const intercept = calcLMIntercept(1000, 100)
    expect(intercept).toBe(-10)
  })

  it('higher money supply makes intercept more negative', () => {
    const i1 = calcLMIntercept(1000, 100)
    const i2 = calcLMIntercept(1500, 100)
    expect(i2).toBeLessThan(i1)
  })

  it('higher interest sensitivity makes intercept closer to zero', () => {
    const i1 = calcLMIntercept(1000, 50)
    const i2 = calcLMIntercept(1000, 200)
    expect(i2).toBeGreaterThan(i1)
  })
})

describe('calcISLMEquilibrium', () => {
  it('calculates equilibrium Y and r correctly', () => {
    // IS: r = 7 - 0.008Y, LM: r = -10 + 0.005Y
    // 7 - 0.008Y = -10 + 0.005Y => 17 = 0.013Y => Y = 1307.69...
    const eq = calcISLMEquilibrium(7, -0.008, -10, 0.005)
    expect(eq.y).toBeCloseTo(17 / 0.013, 5)
    expect(eq.r).toBeCloseTo(7 - 0.008 * eq.y, 10)
  })

  it('returns {y:0, r:0} when slopes are nearly equal (no intersection)', () => {
    const eq = calcISLMEquilibrium(5, 0.005, -3, 0.005)
    expect(eq.y).toBe(0)
    expect(eq.r).toBe(0)
  })

  it('equilibrium Y is positive when IS intercept > LM intercept and lmSlope > isSlope', () => {
    const eq = calcISLMEquilibrium(10, -0.01, -5, 0.01)
    expect(eq.y).toBeGreaterThan(0)
    expect(eq.r).toBeGreaterThan(0)
  })

  it('expansionary fiscal policy (higher G) increases equilibrium Y and r', () => {
    const eq1 = calcISLMEquilibrium(7, -0.008, -10, 0.005)
    const eq2 = calcISLMEquilibrium(9, -0.008, -10, 0.005)
    expect(eq2.y).toBeGreaterThan(eq1.y)
    expect(eq2.r).toBeGreaterThan(eq1.r)
  })

  it('expansionary monetary policy (higher M -> more negative intercept) increases Y but decreases r', () => {
    // More negative LM intercept = higher money supply
    const eq1 = calcISLMEquilibrium(7, -0.008, -10, 0.005)
    const eq2 = calcISLMEquilibrium(7, -0.008, -15, 0.005)
    expect(eq2.y).toBeGreaterThan(eq1.y)
    expect(eq2.r).toBeLessThan(eq1.r)
  })
})

describe('calcISLMData', () => {
  it('generates data points from Y=0 to maxY', () => {
    const data = calcISLMData(7, -0.008, -10, 0.005, 1307.69)
    expect(data.length).toBe(61) // 0 to maxY in 60 steps
    expect(data[0].income).toBe(0)
  })

  it('IS rate decreases with income (negative slope)', () => {
    const data = calcISLMData(7, -0.008, -10, 0.005, 1307.69)
    const validIs = data.filter((d) => d.isRate !== null)
    expect(validIs[0].isRate!).toBeGreaterThan(validIs[validIs.length - 1].isRate!)
  })

  it('LM rate increases with income (positive slope)', () => {
    // Use params where LM is visible: intercept=-2, slope=0.01 => at Y=200, r=0; at Y=1000, r=8
    const data = calcISLMData(8, -0.01, -2, 0.01, 400)
    const validLm = data.filter((d) => d.lmRate !== null)
    expect(validLm.length).toBeGreaterThan(1)
    const first = validLm[0].lmRate!
    const last = validLm[validLm.length - 1].lmRate!
    expect(last).toBeGreaterThan(first)
  })

  it('filters out rates outside [0, 20] range', () => {
    const data = calcISLMData(7, -0.008, -10, 0.005, 1307.69)
    for (const point of data) {
      if (point.isRate !== null) {
        expect(point.isRate).toBeGreaterThanOrEqual(0)
        expect(point.isRate).toBeLessThanOrEqual(20)
      }
      if (point.lmRate !== null) {
        expect(point.lmRate).toBeGreaterThanOrEqual(0)
        expect(point.lmRate).toBeLessThanOrEqual(20)
      }
    }
  })

  it('rounds values to 2 decimal places', () => {
    const data = calcISLMData(7, -0.008, -10, 0.005, 1307.69)
    for (const point of data) {
      if (point.isRate !== null) {
        expect(Math.round(point.isRate * 100) / 100).toBe(point.isRate)
      }
      if (point.lmRate !== null) {
        expect(Math.round(point.lmRate * 100) / 100).toBe(point.lmRate)
      }
    }
  })
})

describe('calcCrowdingOut', () => {
  it('crowding out is positive (IS-LM equilibrium < goods-only equilibrium)', () => {
    // Goods-only Y = (1/(1-0.75*0.8))*(200+150) = 875
    // With IS-LM, equilibrium Y is typically less due to interest rate effect
    const co = calcCrowdingOut(0.75, 0.2, 200, 150, 600)
    expect(co).toBeGreaterThan(0)
  })

  it('lower equilibrium Y (from monetary tightening) increases crowding out', () => {
    const co1 = calcCrowdingOut(0.75, 0.2, 200, 150, 700)
    const co2 = calcCrowdingOut(0.75, 0.2, 200, 150, 500)
    expect(co2).toBeGreaterThan(co1)
  })

  it('zero crowding out when equilibrium Y >= goods-only equilibrium', () => {
    const goodsOnlyY = (1 / (1 - 0.75 * 0.8)) * (200 + 150)
    const co = calcCrowdingOut(0.75, 0.2, 200, 150, goodsOnlyY + 1000)
    expect(co).toBe(0)
  })

  it('higher MPC increases goods-only equilibrium (more to crowd out)', () => {
    const co1 = calcCrowdingOut(0.6, 0.2, 200, 150, 800)
    const co2 = calcCrowdingOut(0.85, 0.2, 200, 150, 800)
    expect(co2).toBeGreaterThan(co1)
  })
})

describe('calcFiscalMultiplier', () => {
  it('returns positive multiplier', () => {
    const m = calcFiscalMultiplier(0.75, 0.2, 50, 0.5, 100, 1307.69)
    expect(m).toBeGreaterThan(0)
  })

  it('fiscal multiplier < simple Keynesian multiplier (due to crowding out)', () => {
    const m = calcFiscalMultiplier(0.75, 0.2, 50, 0.5, 100, 1307.69)
    const simpleK = 1 / (1 - 0.75 * 0.8)
    expect(m).toBeLessThan(simpleK)
  })

  it('returns 0 when equilibrium Y <= 0', () => {
    const m = calcFiscalMultiplier(0.75, 0.2, 50, 0.5, 100, -100)
    expect(m).toBe(0)
  })

  it('lower investment sensitivity increases fiscal multiplier (less crowding out)', () => {
    const m1 = calcFiscalMultiplier(0.75, 0.2, 30, 0.5, 100, 600)
    const m2 = calcFiscalMultiplier(0.75, 0.2, 80, 0.5, 100, 600)
    expect(m1).toBeGreaterThan(m2)
  })
})

describe('calcMonetaryMultiplier', () => {
  it('returns positive multiplier', () => {
    const m = calcMonetaryMultiplier(0.75, 0.2, 50, 0.5, 100, 1307.69)
    expect(m).toBeGreaterThan(0)
  })

  it('returns 0 when equilibrium Y <= 0', () => {
    const m = calcMonetaryMultiplier(0.75, 0.2, 50, 0.5, 100, 0)
    expect(m).toBe(0)
  })

  it('lower interest sensitivity increases monetary multiplier', () => {
    const m1 = calcMonetaryMultiplier(0.75, 0.2, 50, 0.5, 50, 600)
    const m2 = calcMonetaryMultiplier(0.75, 0.2, 50, 0.5, 200, 600)
    expect(m1).toBeGreaterThan(m2)
  })

  it('money demand sensitivity: higher k decreases monetary multiplier', () => {
    const m1 = calcMonetaryMultiplier(0.75, 0.2, 50, 0.2, 100, 1307.69)
    const m2 = calcMonetaryMultiplier(0.75, 0.2, 50, 0.8, 100, 1307.69)
    expect(m2).toBeLessThan(m1)
  })
})
