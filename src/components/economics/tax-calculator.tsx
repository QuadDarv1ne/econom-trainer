'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumberLocale } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Calculator, Receipt, Building2, Percent, Info } from 'lucide-react'

// ─── Formatting helpers ───────────────────────────────────────────────
const fmtRaw = (n: number) => Math.round(n).toLocaleString('en-US')
const fmtDec = (n: number, d = 2) => n.toFixed(d)

// ─── Types ────────────────────────────────────────────────────────────

export interface NDFLBracket {
  min: number
  max: number
  rate: number
  label: string
  taxableInBracket: number
  tax: number
  width: number
}

export interface NDFLResult {
  brackets: NDFLBracket[]
  totalTax: number
  effectiveRate: number
  marginalRate: number
  netIncome: number
  taxable: number
}

export interface NDSResult {
  base: number
  vatAmount: number
  total: number
}

export interface ProfitTaxResult {
  profit: number
  tax: number
  federalTax: number
  regionalTax: number
  netProfit: number
  effectiveRate: number
  totalRate: number
}

// ─── НДФЛ progressive brackets (Russia 2025) ─────────────────────────
const NDFL_BRACKETS = [
  { min: 0, max: 2_400_000, rate: 0.13, label: '0 – 2,4 млн' },
  { min: 2_400_000, max: 5_000_000, rate: 0.15, label: '2,4 – 5 млн' },
  { min: 5_000_000, max: 20_000_000, rate: 0.18, label: '5 – 20 млн' },
  { min: 20_000_000, max: 50_000_000, rate: 0.20, label: '20 – 50 млн' },
  { min: 50_000_000, max: Infinity, rate: 0.22, label: '50 млн +' },
]

export function calcNDFL(income: number, deduction: number): NDFLResult {
  const taxable = Math.max(0, income - deduction)
  let remaining = taxable
  const brackets = NDFL_BRACKETS.map((b) => {
    const width = b.max === Infinity ? remaining : b.max - b.min
    const taxableInBracket = Math.min(Math.max(0, remaining), width)
    const tax = taxableInBracket * b.rate
    remaining = Math.max(0, remaining - taxableInBracket)
    return { ...b, taxableInBracket, tax, width }
  })
  const totalTax = brackets.reduce((s, b) => s + b.tax, 0)
  const effectiveRate = taxable > 0 ? totalTax / taxable : 0
  const marginalBracket = [...brackets].reverse().find((b) => b.taxableInBracket > 0)
  const marginalRate = marginalBracket ? marginalBracket.rate : 0
  const netIncome = income - totalTax
  return { brackets, totalTax, effectiveRate, marginalRate, netIncome, taxable }
}

// ─── НДС calculations ────────────────────────────────────────────────
export function calcNDS(priceWithVAT: number, vatRate: number): NDSResult {
  const base = priceWithVAT / (1 + vatRate)
  const vatAmount = priceWithVAT - base
  return { base, vatAmount, total: priceWithVAT }
}

// ─── Налог на прибыль ────────────────────────────────────────────────
export function calcProfitTax(revenue: number, expenses: number, federalRate: number, regionalRate: number): ProfitTaxResult {
  const profit = revenue - expenses
  const totalRate = federalRate + regionalRate
  const tax = Math.max(0, profit) * totalRate
  const federalTax = Math.max(0, profit) * federalRate
  const regionalTax = Math.max(0, profit) * regionalRate
  const netProfit = revenue - expenses - tax
  const effectiveRate = revenue > 0 ? tax / revenue : 0
  return { profit, tax, federalTax, regionalTax, netProfit, effectiveRate, totalRate }
}

// ─── Custom tooltip for charts ────────────────────────────────────────
function ChartTooltipContent({ active, payload, formatter }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{formatter ? formatter(p.value, p.name) : `${p.name}: ${fmtRaw(p.value)}`}</span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════
export function TaxCalculator() {
  const { t, locale } = useI18n()
  const fmt = useCallback((n: number) => formatNumberLocale(locale, Math.round(n)), [locale])
  // ── НДФЛ state ──────────────────────────────────────────────────────
  const [ndflIncome, setNdflIncome] = useState('600000')
  const [ndflDeduction, setNdflDeduction] = useState('0')
  const [ndflDeductionType, setNdflDeductionType] = useState<'standard' | 'social' | 'property'>('standard')

  // ── НДС state ───────────────────────────────────────────────────────
  const [ndsPriceWithVat, setNdsPriceWithVat] = useState('1200')
  const [ndsRate, setNdsRate] = useState<0.1 | 0.2>(0.2)

  // ── Налог на прибыль state ──────────────────────────────────────────
  const [profitRevenue, setProfitRevenue] = useState('10000000')
  const [profitExpenses, setProfitExpenses] = useState('7000000')
  const [profitFederalRate, setProfitFederalRate] = useState('3')
  const [profitRegionalRate, setProfitRegionalRate] = useState('17')

  // XP tracking — award once per session on first interaction
  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = useCallback(() => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({ moduleId: 'tax', action: 'calculate', xpEarned: MODULE_XP['tax'] })
    }
  }, [addModuleInteraction])

  // ── НДФЛ computations ───────────────────────────────────────────────
  const ndflResult = useMemo(() => {
    const income = parseFloat(ndflIncome) || 0
    const deduction = parseFloat(ndflDeduction) || 0
    return calcNDFL(income, deduction)
  }, [ndflIncome, ndflDeduction])

  const ndflChartData = useMemo(
    () =>
      ndflResult.brackets
        .filter((b) => b.taxableInBracket > 0)
        .map((b) => ({
          name: b.label,
          tax: Math.round(b.tax),
          taxable: Math.round(b.taxableInBracket),
        })),
    [ndflResult],
  )

  // ── НДС computations ────────────────────────────────────────────────
  const ndsResult = useMemo(() => {
    const price = parseFloat(ndsPriceWithVat) || 0
    return calcNDS(price, ndsRate)
  }, [ndsPriceWithVat, ndsRate])

  const ndsComparison = useMemo(() => {
    const base = ndsResult.base
    return [0, 0.1, 0.2].map((rate) => ({
      rate: `${(rate * 100).toFixed(0)}%`,
      base: Math.round(base),
      vat: Math.round(base * rate),
      total: Math.round(base * (1 + rate)),
    }))
  }, [ndsResult])

  // ── Налог на прибыль computations ───────────────────────────────────
  const profitResult = useMemo(() => {
    const rev = parseFloat(profitRevenue) || 0
    const exp = parseFloat(profitExpenses) || 0
    const fed = (parseFloat(profitFederalRate) || 0) / 100
    const reg = (parseFloat(profitRegionalRate) || 0) / 100
    return calcProfitTax(rev, exp, fed, reg)
  }, [profitRevenue, profitExpenses, profitFederalRate, profitRegionalRate])

  const profitChartData = useMemo(
    () => [
      { name: 'Выручка', value: Math.round(parseFloat(profitRevenue) || 0), fill: '#22c55e' },
      { name: 'Расходы', value: Math.round(parseFloat(profitExpenses) || 0), fill: '#f97316' },
      { name: 'Налог', value: Math.round(profitResult.tax), fill: '#ef4444' },
      { name: 'Чистая прибыль', value: Math.round(profitResult.netProfit), fill: '#3b82f6' },
    ],
    [profitRevenue, profitExpenses, profitResult],
  )

  // ── Deduction preset handler ────────────────────────────────────────
  const handleDeductionType = useCallback(
    (type: 'standard' | 'social' | 'property') => {
      setNdflDeductionType(type)
      if (type === 'standard') setNdflDeduction('0')
      else if (type === 'social') setNdflDeduction('120000')
      else setNdflDeduction('260000')
    },
    [],
  )

  // ═══════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('tax.title')}
          </CardTitle>
          <CardDescription>
            {t('tax.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <Tabs defaultValue="ndfl" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ndfl" className="gap-1.5">
            <Receipt className="h-4 w-4" /> {t('tax.incomeTax')}
          </TabsTrigger>
          <TabsTrigger value="nds" className="gap-1.5">
            <Percent className="h-4 w-4" /> НДС
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5">
            <Building2 className="h-4 w-4" /> Налог на прибыль
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* НДФЛ TAB                                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="ndfl" className="space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">НДФЛ — Налог на доходы физических лиц</CardTitle>
              <CardDescription>
                Прогрессивная шкала с 2025 года: чем выше доход, тем выше ставка
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tax.income')} (руб.)</Label>
                  <Input
                    type="number"
                    value={ndflIncome}
                    onChange={(e) => { awardXP(); setNdflIncome(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tax.deductions')} (руб.)</Label>
                  <Input
                    type="number"
                    value={ndflDeduction}
                    onChange={(e) => { awardXP(); setNdflDeduction(e.target.value) }}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Deduction presets */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={ndflDeductionType === 'standard' ? 'default' : 'outline'}
                  onClick={() => { awardXP(); handleDeductionType('standard') }}
                >
                  Стандартный (0 ₽)
                </Button>
                <Button
                  size="sm"
                  variant={ndflDeductionType === 'social' ? 'default' : 'outline'}
                  onClick={() => { awardXP(); handleDeductionType('social') }}
                >
                  Социальный (до 120 000 ₽)
                </Button>
                <Button
                  size="sm"
                  variant={ndflDeductionType === 'property' ? 'default' : 'outline'}
                  onClick={() => { awardXP(); handleDeductionType('property') }}
                >
                  Имущественный (до 260 000 ₽)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax brackets table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Расчёт по прогрессивным ставкам</CardTitle>
              <CardDescription>Налоговая база после вычета: {fmt(ndflResult.taxable)} ₽</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t('tax.taxRate')}</th>
                      <th className="text-left p-2">Диапазон</th>
                      <th className="text-right p-2">Облагаемая сумма</th>
                      <th className="text-right p-2">{t('tax.incomeTax')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ndflResult.brackets.map((b, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">
                          <Badge variant={b.taxableInBracket > 0 ? 'default' : 'secondary'}>
                            {(b.rate * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="p-2">{b.label}</td>
                        <td className="p-2 text-right font-mono">
                          {b.taxableInBracket > 0 ? fmt(b.taxableInBracket) : '—'} ₽
                        </td>
                        <td className="p-2 text-right font-mono text-red-600">
                          {b.tax > 0 ? `${fmt(b.tax)} ₽` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="p-2" colSpan={2}>Итого</td>
                      <td className="p-2 text-right font-mono">{fmt(ndflResult.taxable)} ₽</td>
                      <td className="p-2 text-right font-mono text-red-600">{fmt(ndflResult.totalTax)} ₽</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.totalTax')}</CardDescription>
                <CardTitle className="text-xl font-mono text-red-600">
                  {fmt(ndflResult.totalTax)} ₽
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Сумма НДФЛ к уплате</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.effectiveRate')}</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {fmtDec(ndflResult.effectiveRate * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Средняя ставка по всему доходу</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Предельная ставка</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {fmtDec(ndflResult.marginalRate * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Ставка на следующий рубль дохода</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.netIncome')}</CardDescription>
                <CardTitle className="text-xl font-mono text-green-700 dark:text-green-400">
                  {fmt(ndflResult.netIncome)} ₽
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Доход после уплаты НДФЛ</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {ndflChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Налог по каждой ставке</CardTitle>
                <CardDescription>Сравнение суммы налога, начисленного в каждой налоговой bracket</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ndflChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}к`} />
                      <Tooltip
                        content={<ChartTooltipContent formatter={(v) => `${fmt(v)} ₽`} />}
                      />
                      <Bar dataKey="tax" fill="#ef4444" radius={[4, 4, 0, 0]} name="Налог" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theory: Progressive vs Flat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {t('tax.theory')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Плоская шкала</strong> — единая ставка для всех уровней дохода (в России до 2021 года — 13%
                для любого дохода). Просто в администрировании, но регрессивна: нагрузка на
                низкодоходных граждан относительно выше.
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>Прогрессивная шкала</strong> — ставка растёт с доходом. Обеспечивает
                вертикальное равенство: кто получает больше, платит больше не только в абсолютном,
                но и в относительном выражении. С 2025 года в России введена 5-ступенчатая
                прогрессия.
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>Кривая Лаффера</strong> — графическая зависимость между ставкой налога и
                поступлениями в бюджет. При нулевой и 100%-ной ставке доходы бюджета = 0.
                Оптимальная ставка максимизирует сборы, не уничтожая стимул к работе.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* НДС TAB                                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="nds" className="space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">НДС — Налог на добавленную стоимость</CardTitle>
              <CardDescription>
                Косвенный налог, который включается в цену товара и фактически оплачивается покупателем
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цена с НДС (руб.)</Label>
                  <Input
                    type="number"
                    value={ndsPriceWithVat}
                    onChange={(e) => { awardXP(); setNdsPriceWithVat(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ставка НДС</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={ndsRate === 0.1 ? 'default' : 'outline'}
                      onClick={() => { awardXP(); setNdsRate(0.1) }}
                      className="flex-1"
                    >
                      10%
                    </Button>
                    <Button
                      size="sm"
                      variant={ndsRate === 0.2 ? 'default' : 'outline'}
                      onClick={() => { awardXP(); setNdsRate(0.2) }}
                      className="flex-1"
                    >
                      20%
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Цена без НДС</CardDescription>
                <CardTitle className="text-xl font-mono">{fmt(ndsResult.base)} ₽</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Базовая стоимость товара / услуги</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription>Сумма НДС</CardDescription>
                <CardTitle className="text-xl font-mono text-red-600">{fmt(ndsResult.vatAmount)} ₽</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Налог, включённый в цену</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Цена с НДС</CardDescription>
                <CardTitle className="text-xl font-mono">{fmt(ndsResult.total)} ₽</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Итоговая сумма к оплате</p>
              </CardContent>
            </Card>
          </div>

          {/* Formulas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Формулы расчёта</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>Цена без НДС = Цена с НДС / (1 + Ставка)</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.total)} / (1 + {ndsRate}) = {fmt(ndsResult.base)} ₽
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>Сумма НДС = Цена с НДС − Цена без НДС</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.total)} − {fmt(ndsResult.base)} = {fmt(ndsResult.vatAmount)} ₽
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>Цена с НДС = Цена без НДС × (1 + Ставка)</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.base)} × {fmtDec(1 + ndsRate)} = {fmt(ndsResult.base * (1 + ndsRate))} ₽
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Сравнение ставок НДС</CardTitle>
              <CardDescription>
                Для базовой цены {fmt(ndsResult.base)} ₽
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ставка</th>
                      <th className="text-right p-2">Цена без НДС</th>
                      <th className="text-right p-2">Сумма НДС</th>
                      <th className="text-right p-2">Цена с НДС</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ndsComparison.map((row) => (
                      <tr key={row.rate} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-2">
                          <Badge variant={row.rate === `${ndsRate * 100}%` ? 'default' : 'secondary'}>
                            {row.rate}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-mono">{fmt(row.base)} ₽</td>
                        <td className="p-2 text-right font-mono text-red-600">{fmt(row.vat)} ₽</td>
                        <td className="p-2 text-right font-mono font-medium">{fmt(row.total)} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Theory: VAT mechanics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Механика НДС и экономические эффекты
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Кто платит НДС?</strong> Формально налогоплательщик — продавец, но фактически
                НДС оплачивает покупатель, так как налог включён в цену. Продавец является лишь
                налоговым агентом, перечисляющим НДС в бюджет.
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>Механика зачёта:</strong> Продавец уплачивает в бюджет разницу между
                НДС, полученным от покупателей (исходящий НДС), и НДС, уплаченным поставщикам
                (входящий НДС). Это избегает каскадного эффекта — налог взимается только с
                добавленной стоимости на каждом этапе.
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>Регрессивный характер НДС:</strong> Чем ниже доход, тем большую долю
                расходования составляет потребление, а значит — уплата НДС. Для
                низкодоходных групп НДС составляет более значительную часть дохода, чем для
                высокодоходных, которые могут сберегать значительную часть заработка.
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <strong>Льготные ставки:</strong> Ставка 10% применяется к социально значимым
                товарам (продукты питания, детские товары, медикаменты, печатная продукция).
                Ставка 0% — при экспорте для обеспечения конкурентоспособности на мировых рынках.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* НАЛОГ НА ПРИБЫЛЬ TAB                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="profit" className="space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Налог на прибыль организаций</CardTitle>
              <CardDescription>
                Базовая ставка 20%: 3% — федеральный бюджет, 17% — бюджет субъекта РФ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tax.businessRevenue')} (руб.)</Label>
                  <Input
                    type="number"
                    value={profitRevenue}
                    onChange={(e) => { awardXP(); setProfitRevenue(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tax.businessExpenses')} (руб.)</Label>
                  <Input
                    type="number"
                    value={profitExpenses}
                    onChange={(e) => { awardXP(); setProfitExpenses(e.target.value) }}
                    className="font-mono"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Федеральная ставка (%)</Label>
                  <Input
                    type="number"
                    value={profitFederalRate}
                    onChange={(e) => { awardXP(); setProfitFederalRate(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Региональная ставка (%)</Label>
                  <Input
                    type="number"
                    value={profitRegionalRate}
                    onChange={(e) => { awardXP(); setProfitRegionalRate(e.target.value) }}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                Общая ставка: <strong>{fmtDec(profitResult.totalRate * 100)}%</strong> (
                {profitFederalRate}% фед. + {profitRegionalRate}% рег.)
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Прибыль</CardDescription>
                <CardTitle className={`text-xl font-mono ${profitResult.profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                  {fmt(profitResult.profit)} ₽
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Выручка − Расходы</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.incomeTax')}</CardDescription>
                <CardTitle className="text-xl font-mono text-red-600">
                  {fmt(profitResult.tax)} ₽
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Прибыль × {fmtDec(profitResult.totalRate * 100)}%</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.netIncome')}</CardDescription>
                <CardTitle className="text-xl font-mono text-green-700 dark:text-green-400">
                  {fmt(profitResult.netProfit)} ₽
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Прибыль после уплаты налога</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.effectiveRate')}</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {fmtDec(profitResult.effectiveRate * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Налог / Выручка</p>
              </CardContent>
            </Card>
          </div>

          {/* Federal vs Regional breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Распределение по бюджетам</CardTitle>
              <CardDescription>Разбивка налога между федеральным и региональным бюджетами</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                      Федеральный бюджет ({profitFederalRate}%)
                    </span>
                    <span className="font-mono font-medium">{fmt(profitResult.federalTax)} ₽</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${profitResult.tax > 0 ? (profitResult.federalTax / profitResult.tax) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
                      Региональный бюджет ({profitRegionalRate}%)
                    </span>
                    <span className="font-mono font-medium">{fmt(profitResult.regionalTax)} ₽</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${profitResult.tax > 0 ? (profitResult.regionalTax / profitResult.tax) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Marginal effective rate */}
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <strong>Маржинальная эффективная ставка:</strong> на каждый дополнительный рубль
                  прибыли компания платит {fmtDec(profitResult.totalRate * 100)}% налога. С учётом
                  расходов эффективная ставка по выручке составляет{' '}
                  <strong>{fmtDec(profitResult.effectiveRate * 100)}%</strong>.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Структура доходов и расходов</CardTitle>
              <CardDescription>Сравнение выручки, расходов, налога и чистой прибыли</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}м`} />
                    <Tooltip
                      content={<ChartTooltipContent formatter={(v) => `${fmt(v)} ₽`} />}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Сумма">
                      {profitChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Theory: Corporate tax incidence */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Переложение налога на прибыль и Кривая Лаффера
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Переложение налога на прибыль (tax incidence):</strong> Хотя номинальным
                плательщиком выступает компания, фактически часть налога может перекладываться на:
                работников (через более низкую зарплату), потребителей (через более высокие цены),
                или собственников капитала (через более низкую доходность). Распределение
                налогового бремени зависит от эластичности спроса и предложения.
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>Федеральная + региональная часть:</strong> Разделение ставки обеспечивает
                поступления как в федеральный, так и в региональный бюджет. Субъекты РФ могут
                снижать региональную ставку для отдельных категорий налогоплательщиков (не ниже
                13,5% в 2025 году), стимулируя инвестиции.
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>Кривая Лаффера для налога на прибыль:</strong> При чрезмерно высокой
                ставке компании теряют стимулы к инвестициям, а при слишком низкой — бюджет не
                получает достаточно средств. Оптимальная ставка зависит от экономической
                конъюнктуры, но обычно для налога на прибыль она оценивается в диапазоне 20–30%.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
