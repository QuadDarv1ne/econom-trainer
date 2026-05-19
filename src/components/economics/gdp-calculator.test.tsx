import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GDPCalculator, calculateGDP } from './gdp-calculator'

const mockAddGDPResult = vi.fn()
const mockToast = vi.fn()

interface GDPStore {
  addGDPResult: typeof mockAddGDPResult
}

vi.mock('@/store/economics-store', () => ({
  useEconomicsStore: <T,>(selector?: (s: GDPStore) => T) => {
    const state: GDPStore = {
      addGDPResult: mockAddGDPResult,
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('@/lib/i18n-provider', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'gdp.title': 'ВВП и макропоказатели',
        'gdp.description': 'Расчёт номинального и реального ВВП',
        'gdp.component': 'Компонент',
        'gdp.currentPrices': 'Текущие цены',
        'gdp.basePrices': 'Базовые цены',
        'gdp.component.consumption': 'Потребление (C)',
        'gdp.component.investment': 'Инвестиции (I)',
        'gdp.component.government': 'Гос. расходы (G)',
        'gdp.component.export': 'Экспорт (X)',
        'gdp.component.import': 'Импорт (M)',
        'gdp.calculate': 'Рассчитать',
        'gdp.reset': 'Сбросить',
        'gdp.nominal': 'Номинальный ВВП',
        'gdp.real': 'Реальный ВВП',
        'gdp.deflator': 'Дефлятор ВВП',
        'gdp.inflation': 'Инфляция',
        'gdp.toast.title': 'ВВП рассчитан',
        'gdp.toast.description': 'Дефлятор:',
        'gdp.inflation.high': 'Высокая',
        'gdp.inflation.moderate': 'Умеренная',
        'gdp.inflation.low': 'Низкая',
        'gdp.inflation.stable': 'Стабильность',
        'gdp.inflation.deflation': 'Дефляция',
        'gdp.tooltip.nominal': 'ВВП в текущих ценах',
        'gdp.tooltip.real': 'ВВП в базовых ценах',
        'gdp.tooltip.deflator': 'Общий уровень цен',
        'gdp.tooltip.inflation': 'Темп инфляции',
        'gdp.formulas': 'Формулы',
        'gdp.formula.expenses': 'Y = C + I + G + X - M',
        'gdp.formula.deflator': 'Дефлятор = (Номин / Реал) × 100',
        'gdp.formula.inflation': 'Инфляция = ((Номин - Реал) / Реал) × 100',
      }
      return map[key] || key
    },
    locale: 'ru',
  }),
}))

describe('calculateGDP (pure function)', () => {
  const makeComponents = (current: number[], base: number[]) =>
    ['consumption', 'investment', 'government', 'export', 'import'].map((name, i) => ({
      name: `gdp.component.${name}`,
      currentValue: current[i] ?? 0,
      baseValue: base[i] ?? 0,
    }))

  it('calculates nominal GDP as C + I + G + X - M', () => {
    const components = makeComponents([100, 50, 30, 20, 10], [0, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(190)
    expect(result.realGDP).toBe(0)
  })

  it('calculates real GDP from base values', () => {
    const components = makeComponents([0, 0, 0, 0, 0], [80, 40, 25, 15, 8])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(0)
    expect(result.realGDP).toBe(152)
  })

  it('calculates deflator correctly', () => {
    const components = makeComponents([200, 0, 0, 0, 0], [100, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.deflator).toBe(200)
    expect(result.inflationRate).toBe(100)
  })

  it('handles real GDP = 0 (deflator=0, inflation=0)', () => {
    const components = makeComponents([100, 0, 0, 0, 0], [0, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.deflator).toBe(0)
    expect(result.inflationRate).toBe(0)
  })

  it('handles nominal GDP = 0 with real > 0 (deflator=0, inflation=-100)', () => {
    const components = makeComponents([0, 0, 0, 0, 0], [100, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(0)
    expect(result.realGDP).toBe(100)
    expect(result.deflator).toBe(0)
    expect(result.inflationRate).toBe(-100)
  })

  it('handles all zeros gracefully', () => {
    const components = makeComponents([0, 0, 0, 0, 0], [0, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(0)
    expect(result.realGDP).toBe(0)
    expect(result.deflator).toBe(0)
    expect(result.inflationRate).toBe(0)
  })

  it('handles negative values (imports > sum of other components)', () => {
    const components = makeComponents([100, 0, 0, 0, 200], [0, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(-100)
  })

  it('calculates full GDP correctly', () => {
    const components = makeComponents([100, 50, 30, 20, 10], [80, 40, 25, 15, 8])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(190)
    expect(result.realGDP).toBe(152)
    expect(result.deflator).toBeCloseTo(125, 0)
    expect(result.inflationRate).toBeCloseTo(25, 0)
  })

  it('handles large numbers without overflow', () => {
    const components = makeComponents([1e9, 2e9, 3e9, 1e9, 0.5e9], [0, 0, 0, 0, 0])
    const result = calculateGDP(components)
    expect(result.nominalGDP).toBe(6.5e9)
  })
})

describe('GDPCalculator (rendering)', () => {
  beforeEach(() => {
    mockAddGDPResult.mockClear()
    mockToast.mockClear()
  })

  it('renders the component with title and description', () => {
    render(<GDPCalculator />)
    expect(screen.getByText('ВВП и макропоказатели')).toBeDefined()
    expect(screen.getByText('Расчёт номинального и реального ВВП')).toBeDefined()
  })

  it('renders all 5 GDP component inputs', () => {
    render(<GDPCalculator />)
    expect(screen.getByText('Потребление (C)')).toBeDefined()
    expect(screen.getByText('Инвестиции (I)')).toBeDefined()
    expect(screen.getByText('Гос. расходы (G)')).toBeDefined()
    expect(screen.getByText('Экспорт (X)')).toBeDefined()
    expect(screen.getByText('Импорт (M)')).toBeDefined()
  })

  it('displays formulas section', () => {
    render(<GDPCalculator />)
    expect(screen.getByText('Формулы')).toBeDefined()
    expect(screen.getByText('Y = C + I + G + X - M')).toBeDefined()
  })

  it('has calculate and reset buttons', () => {
    render(<GDPCalculator />)
    expect(screen.getByText('Рассчитать')).toBeDefined()
    expect(screen.getByText('Сбросить')).toBeDefined()
  })

  it('renders with default empty inputs', () => {
    render(<GDPCalculator />)
    const inputs = screen.getAllByRole('spinbutton')
    inputs.forEach((input) => {
      expect((input as HTMLInputElement).value).toBe('0')
    })
  })

  it('calls addGDPResult on calculate', async () => {
    const user = userEvent.setup()
    render(<GDPCalculator />)

    await user.click(screen.getByText('Рассчитать'))

    expect(mockAddGDPResult).toHaveBeenCalledTimes(1)
    const result = mockAddGDPResult.mock.calls[0][0]
    expect(result.nominalGDP).toBe(0)
    expect(result.realGDP).toBe(0)
    expect(result.deflator).toBe(0)
    expect(result.inflationRate).toBe(0)
  })
})
