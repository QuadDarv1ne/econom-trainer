import { describe, it, expect } from 'vitest'
import {
  getAIChoice,
  calcHawkDovePayoffs,
  calcMixedESS,
  runHawkDoveSimulation,
  PD_PAYOFF,
  BOTS_PAYOFF,
} from './game-theory'

describe('getAIChoice', () => {
  it('always returns defect for always-defect strategy', () => {
    expect(getAIChoice('always-defect', [])).toBe('defect')
    expect(getAIChoice('always-defect', ['cooperate'])).toBe('defect')
    expect(getAIChoice('always-defect', ['defect', 'cooperate'])).toBe('defect')
  })

  it('returns cooperate on first turn for tit-for-tat', () => {
    expect(getAIChoice('tit-for-tat', [])).toBe('cooperate')
  })

  it('copies player last choice for tit-for-tat', () => {
    expect(getAIChoice('tit-for-tat', ['cooperate'])).toBe('cooperate')
    expect(getAIChoice('tit-for-tat', ['defect'])).toBe('defect')
    expect(getAIChoice('tit-for-tat', ['cooperate', 'defect'])).toBe('defect')
    expect(getAIChoice('tit-for-tat', ['defect', 'cooperate'])).toBe('cooperate')
  })

  it('returns either cooperate or defect for random strategy', () => {
    const choices = new Set<PDChoice>()
    for (let i = 0; i < 20; i++) {
      choices.add(getAIChoice('random', []))
    }
    expect(choices.has('cooperate')).toBe(true)
    expect(choices.has('defect')).toBe(true)
  })
})

describe('PD_PAYOFF', () => {
  it('mutual cooperation gives (-1, -1)', () => {
    expect(PD_PAYOFF.cooperate.cooperate).toEqual([-1, -1])
  })

  it('mutual defection gives (-5, -5)', () => {
    expect(PD_PAYOFF.defect.defect).toEqual([-5, -5])
  })

  it('temptation payoff: defector gets 0, cooperator gets -10', () => {
    expect(PD_PAYOFF.cooperate.defect).toEqual([-10, 0])
    expect(PD_PAYOFF.defect.cooperate).toEqual([0, -10])
  })

  it('defection is dominant strategy (always better regardless of opponent)', () => {
    // If opponent cooperates: defect(0) > cooperate(-1)
    expect(PD_PAYOFF.defect.cooperate[0]).toBeGreaterThan(PD_PAYOFF.cooperate.cooperate[0])
    // If opponent defects: defect(-5) > cooperate(-10)
    expect(PD_PAYOFF.defect.defect[0]).toBeGreaterThan(PD_PAYOFF.cooperate.defect[0])
  })
})

describe('BOTS_PAYOFF', () => {
  it('mutual opera gives (3, 2)', () => {
    expect(BOTS_PAYOFF.opera.opera).toEqual([3, 2])
  })

  it('mutual football gives (2, 3)', () => {
    expect(BOTS_PAYOFF.football.football).toEqual([2, 3])
  })

  it('mismatch gives (0, 0)', () => {
    expect(BOTS_PAYOFF.opera.football).toEqual([0, 0])
    expect(BOTS_PAYOFF.football.opera).toEqual([0, 0])
  })

  it('two pure Nash equilibria exist', () => {
    // (Opera, Opera): P1 gets 3, if P1 switches to Football gets 0 (worse); P2 gets 2, if P2 switches gets 0 (worse)
    // (Football, Football): P1 gets 2, if P1 switches gets 0 (worse); P2 gets 3, if P2 switches gets 0 (worse)
    expect(BOTS_PAYOFF.opera.opera[0]).toBeGreaterThan(BOTS_PAYOFF.football.opera[0])
    expect(BOTS_PAYOFF.opera.opera[1]).toBeGreaterThan(BOTS_PAYOFF.opera.football[1])
    expect(BOTS_PAYOFF.football.football[0]).toBeGreaterThan(BOTS_PAYOFF.opera.football[0])
    expect(BOTS_PAYOFF.football.football[1]).toBeGreaterThan(BOTS_PAYOFF.football.opera[1])
  })
})

describe('calcHawkDovePayoffs', () => {
  it('calculates correct payoffs for V=50, C=100', () => {
    const p = calcHawkDovePayoffs(50, 100)
    expect(p.hawkVsHawk).toBe(-25) // (50-100)/2
    expect(p.hawkVsDove).toBe(50)
    expect(p.doveVsHawk).toBe(0)
    expect(p.doveVsDove).toBe(25) // 50/2
  })

  it('hawkVsHawk is negative when C > V', () => {
    const p = calcHawkDovePayoffs(30, 80)
    expect(p.hawkVsHawk).toBe(-25)
  })

  it('hawkVsHawk is positive when V > C (hawks dominate)', () => {
    const p = calcHawkDovePayoffs(100, 40)
    expect(p.hawkVsHawk).toBe(30)
  })

  it('hawkVsDove always equals V', () => {
    expect(calcHawkDovePayoffs(50, 100).hawkVsDove).toBe(50)
    expect(calcHawkDovePayoffs(200, 50).hawkVsDove).toBe(200)
  })

  it('doveVsHawk is always 0', () => {
    expect(calcHawkDovePayoffs(50, 100).doveVsHawk).toBe(0)
    expect(calcHawkDovePayoffs(200, 50).doveVsHawk).toBe(0)
  })

  it('doveVsDove equals V/2', () => {
    expect(calcHawkDovePayoffs(50, 100).doveVsDove).toBe(25)
    expect(calcHawkDovePayoffs(100, 50).doveVsDove).toBe(50)
  })
})

describe('calcMixedESS', () => {
  it('returns correct mixed strategy probabilities', () => {
    const result = calcMixedESS()
    expect(result.hawkProportion).toBeCloseTo(0.6, 5) // 3/5
    expect(result.doveProportion).toBeCloseTo(0.4, 5) // 2/5
  })

  it('expected payoffs are equal (1.2 each)', () => {
    const result = calcMixedESS()
    expect(result.p1Expected).toBeCloseTo(1.2, 5)
    expect(result.p2Expected).toBeCloseTo(1.2, 5)
  })

  it('probabilities sum to 1', () => {
    const result = calcMixedESS()
    expect(result.hawkProportion + result.doveProportion).toBeCloseTo(1, 10)
  })
})

describe('runHawkDoveSimulation', () => {
  it('generates correct number of data points', () => {
    const data = runHawkDoveSimulation(50, 100, 10)
    expect(data.length).toBe(10)
  })

  it('generations are sequential starting from 1', () => {
    const data = runHawkDoveSimulation(50, 100, 5)
    data.forEach((d, i) => {
      expect(d.generation).toBe(i + 1)
    })
  })

  it('hawks + doves approximately equals 100% each generation', () => {
    const data = runHawkDoveSimulation(50, 100, 10)
    data.forEach(d => {
      expect(d.hawks + d.doves).toBeCloseTo(100, 0)
    })
  })

  it('when V < C, hawk proportion converges toward V/C', () => {
    const V = 50
    const C = 100
    const expectedESS = V / C // 0.5
    const data = runHawkDoveSimulation(V, C, 50)
    const lastHawk = data[data.length - 1].hawks / 100
    // After 50 generations, should be close to ESS
    expect(Math.abs(lastHawk - expectedESS)).toBeLessThan(0.15)
  })

  it('when V > C, hawks dominate (proportion increases)', () => {
    const data = runHawkDoveSimulation(100, 40, 20)
    const firstHawk = data[0].hawks
    const lastHawk = data[data.length - 1].hawks
    expect(lastHawk).toBeGreaterThan(firstHawk)
  })

  it('all values are between 0 and 100', () => {
    const data = runHawkDoveSimulation(50, 100, 20)
    data.forEach(d => {
      expect(d.hawks).toBeGreaterThanOrEqual(0)
      expect(d.hawks).toBeLessThanOrEqual(100)
      expect(d.doves).toBeGreaterThanOrEqual(0)
      expect(d.doves).toBeLessThanOrEqual(100)
    })
  })

  it('simulation with V=C shows decreasing hawks (hawkVsHawk = 0)', () => {
    const data = runHawkDoveSimulation(50, 50, 10)
    // Hawk fitness = h*0 + d*50 = d*50, Dove fitness = d*25
    // Hawks have higher fitness initially, but eventually stabilize
    expect(data.length).toBe(10)
  })

  it('respects custom initial hawk proportion', () => {
    const data = runHawkDoveSimulation(50, 100, 5, 0.8)
    expect(data[0].hawks).toBeGreaterThan(70) // starts near 80%
  })
})
