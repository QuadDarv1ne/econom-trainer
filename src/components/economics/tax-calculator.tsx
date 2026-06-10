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
      { name: t('tax.chart.revenue'), value: Math.round(parseFloat(profitRevenue) || 0), fill: '#22c55e' },
      { name: t('tax.chart.expenses'), value: Math.round(parseFloat(profitExpenses) || 0), fill: '#f97316' },
      { name: t('tax.chart.tax'), value: Math.round(profitResult.tax), fill: '#ef4444' },
      { name: t('tax.chart.netProfit'), value: Math.round(profitResult.netProfit), fill: '#3b82f6' },
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
            <Percent className="h-4 w-4" /> {t('tax.nds')}
          </TabsTrigger>
          <TabsTrigger value="profit" className="gap-1.5">
            <Building2 className="h-4 w-4" /> {t('tax.profit')}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* НДФЛ TAB                                                    */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="ndfl" className="space-y-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('tax.incomeTitle')}</CardTitle>
              <CardDescription>
                {t('tax.incomeDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tax.income')} ({t('common.currency.rub')})</Label>
                  <Input
                    type="number"
                    value={ndflIncome}
                    onChange={(e) => { awardXP(); setNdflIncome(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tax.deductions')} ({t('common.currency.rub')})</Label>
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
                  {t('tax.standardDeduction')}
                </Button>
                <Button
                  size="sm"
                  variant={ndflDeductionType === 'social' ? 'default' : 'outline'}
                  onClick={() => { awardXP(); handleDeductionType('social') }}
                >
                  {t('tax.socialDeduction')}
                </Button>
                <Button
                  size="sm"
                  variant={ndflDeductionType === 'property' ? 'default' : 'outline'}
                  onClick={() => { awardXP(); handleDeductionType('property') }}
                >
                  {t('tax.propertyDeduction')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tax brackets table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('tax.bracketsTitle')}</CardTitle>
              <CardDescription>{t('tax.taxableBaseAfter').replace('{amount}', fmt(ndflResult.taxable))}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t('tax.taxRate')}</th>
                      <th className="text-left p-2">{t('tax.bracket')}</th>
                      <th className="text-right p-2">{t('tax.taxableAmount')}</th>
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
                          {b.taxableInBracket > 0 ? fmt(b.taxableInBracket) : '—'} {t('common.currency.rub')}
                        </td>
                        <td className="p-2 text-right font-mono text-red-600">
                          {b.tax > 0 ? `${fmt(b.tax)} {t('common.currency.rub')}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="p-2" colSpan={2}>{t('tax.total')}</td>
                      <td className="p-2 text-right font-mono">{fmt(ndflResult.taxable)} {t('common.currency.rub')}</td>
                      <td className="p-2 text-right font-mono text-red-600">{fmt(ndflResult.totalTax)} {t('common.currency.rub')}</td>
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
                  {fmt(ndflResult.totalTax)} {t('common.currency.rub')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.ndflPayable')}</p>
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
                <p className="text-xs text-muted-foreground">{t('tax.avgRate')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.marginalRate')}</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {fmtDec(ndflResult.marginalRate * 100)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.marginalDesc')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.netIncome')}</CardDescription>
                <CardTitle className="text-xl font-mono text-green-700 dark:text-green-400">
                  {fmt(ndflResult.netIncome)} {t('common.currency.rub')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.netIncome')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {ndflChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('tax.taxByBracket')}</CardTitle>
                <CardDescription>{t('tax.bracketComparison')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ndflChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}к`} />
                      <Tooltip
                        content={<ChartTooltipContent formatter={(v) => `${fmt(v)} ${t('common.currency.rub')}`} />}
                      />
                      <Bar dataKey="tax" fill="#ef4444" radius={[4, 4, 0, 0]} name={t('tax.incomeTax')} />
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
                <strong>{t('tax.theory.flatTitle')}</strong> — {t('tax.theory.flatDesc')}
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>{t('tax.theory.progressiveTitle')}</strong> — {t('tax.theory.progressiveDesc')}
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>{t('tax.theory.lafferTitle')}</strong> — {t('tax.theory.lafferDesc')}
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
              <CardTitle className="text-lg">{t('tax.vatTitle')}</CardTitle>
              <CardDescription>
                {t('tax.ndsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('tax.vatPrice')}</Label>
                  <Input
                    type="number"
                    value={ndsPriceWithVat}
                    onChange={(e) => { awardXP(); setNdsPriceWithVat(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tax.vatRate')}</Label>
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
                <CardDescription>{t('tax.vatWithoutTax')}</CardDescription>
                <CardTitle className="text-xl font-mono">{fmt(ndsResult.base)} {t('common.currency.rub')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.vatBaseCost')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.vatAmount')}</CardDescription>
                <CardTitle className="text-xl font-mono text-red-600">{fmt(ndsResult.vatAmount)} {t('common.currency.rub')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.vatIncluded')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.vatWithTax')}</CardDescription>
                <CardTitle className="text-xl font-mono">{fmt(ndsResult.total)} {t('common.currency.rub')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.vatTotal')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Formulas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('tax.formulasCalc')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>{t('tax.formula.priceNoVat')}</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.total)} / (1 + {ndsRate}) = {fmt(ndsResult.base)} {t('common.currency.rub')}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>{t('tax.formula.vatSum')}</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.total)} − {fmt(ndsResult.base)} = {fmt(ndsResult.vatAmount)} {t('common.currency.rub')}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg font-mono space-y-1">
                <div>{t('tax.formula.priceWithVat')}</div>
                <div className="text-muted-foreground">
                  {fmt(ndsResult.base)} × {fmtDec(1 + ndsRate)} = {fmt(ndsResult.base * (1 + ndsRate))} {t('common.currency.rub')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('tax.vatComparison')}</CardTitle>
              <CardDescription>
                {t('tax.forBasePrice').replace('{amount}', fmt(ndsResult.base))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t('tax.vatRateHeader')}</th>
                      <th className="text-right p-2">{t('tax.vatWithoutTax')}</th>
                      <th className="text-right p-2">{t('tax.vatAmount')}</th>
                      <th className="text-right p-2">{t('tax.vatWithTax')}</th>
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
                        <td className="p-2 text-right font-mono">{fmt(row.base)} {t('common.currency.rub')}</td>
                        <td className="p-2 text-right font-mono text-red-600">{fmt(row.vat)} {t('common.currency.rub')}</td>
                        <td className="p-2 text-right font-mono font-medium">{fmt(row.total)} {t('common.currency.rub')}</td>
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
                {t('tax.vatMechanics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>{t('tax.whoPaysVat')}</strong> {t('tax.whoPaysVatText')}
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>{t('tax.offsetMechanism')}</strong> {t('tax.offsetMechanismText')}
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>{t('tax.regressiveNature')}</strong> {t('tax.regressiveNatureText')}
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <strong>{t('tax.reducedRates')}</strong> {t('tax.reducedRatesText')}
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
              <CardTitle className="text-lg">{t('tax.profitTitle')}</CardTitle>
              <CardDescription>
                {t('tax.profitDesc')}
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
                  <Label>{t('tax.federalRate')}</Label>
                  <Input
                    type="number"
                    value={profitFederalRate}
                    onChange={(e) => { awardXP(); setProfitFederalRate(e.target.value) }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('tax.regionalRate')}</Label>
                  <Input
                    type="number"
                    value={profitRegionalRate}
                    onChange={(e) => { awardXP(); setProfitRegionalRate(e.target.value) }}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                {t('tax.totalRate').replace('{rate}', fmtDec(profitResult.totalRate * 100)).replace('{fed}', profitFederalRate).replace('{reg}', profitRegionalRate)}
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.profit')}</CardDescription>
                <CardTitle className={`text-xl font-mono ${profitResult.profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                  {fmt(profitResult.profit)} {t('common.currency.rub')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.profitFormula')}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.incomeTax')}</CardDescription>
                <CardTitle className="text-xl font-mono text-red-600">
                  {fmt(profitResult.tax)} {t('common.currency.rub')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.profitTimesRate').replace('{rate}', fmtDec(profitResult.totalRate * 100))}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('tax.netIncome')}</CardDescription>
                <CardTitle className="text-xl font-mono text-green-700 dark:text-green-400">
                  {fmt(profitResult.netProfit)} {t('common.currency.rub')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t('tax.profitAfterTax')}</p>
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
                <p className="text-xs text-muted-foreground">{t('tax.taxOverRevenue')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Federal vs Regional breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('tax.distribution')}</CardTitle>
              <CardDescription>{t('tax.distributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                      {t('tax.federalBudget').replace('{rate}', profitFederalRate)}
                    </span>
                    <span className="font-mono font-medium">{fmt(profitResult.federalTax)} {t('common.currency.rub')}</span>
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
                      {t('tax.regionalBudget').replace('{rate}', profitRegionalRate)}
                    </span>
                    <span className="font-mono font-medium">{fmt(profitResult.regionalTax)} {t('common.currency.rub')}</span>
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
                  {t('tax.marginalEffective').replace('{rate}', fmtDec(profitResult.totalRate * 100))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('tax.structureTitle')}</CardTitle>
              <CardDescription>{t('tax.structureDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitChartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)}м`} />
                    <Tooltip
                      content={<ChartTooltipContent formatter={(v) => `${fmt(v)} {t('common.currency.rub')}`} />}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name={t('tax.chartSum')}>
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
                {t('tax.taxIncidence')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>{t('tax.taxIncidence')}</strong> {t('tax.taxIncidenceText')}
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <strong>{t('tax.fedRegSplit')}</strong> {t('tax.fedRegSplitText')}
              </div>
              <Separator />
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <strong>{t('tax.lafferCurve')}</strong> {t('tax.lafferCurveText')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
