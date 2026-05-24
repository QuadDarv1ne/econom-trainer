'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Target, RotateCcw, Info, TrendingDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── Pure calculation functions ──────────────────────────────────────

export function calcBreakEvenUnits(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number
): number {
  const contribution = pricePerUnit - variableCostPerUnit
  if (contribution <= 0) return Infinity
  return Math.ceil(fixedCosts / contribution)
}

export function calcBreakEvenRevenue(breakEvenUnits: number, pricePerUnit: number): number {
  if (!isFinite(breakEvenUnits)) return NaN
  return breakEvenUnits * pricePerUnit
}

export function calcContributionMargin(pricePerUnit: number, variableCostPerUnit: number): number {
  if (pricePerUnit <= 0) return 0
  return ((pricePerUnit - variableCostPerUnit) / pricePerUnit) * 100
}

export function calcMarginOfSafety(maxUnits: number, breakEvenUnits: number): number {
  if (maxUnits <= 0) return 0
  return ((maxUnits - breakEvenUnits) / maxUnits) * 100
}

export interface ChartDataPoint {
  quantity: number
  revenue: number
  totalCost: number
  profit: number
  fixedCost: number
}

export function calcChartData(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number,
  maxUnits: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const step = Math.max(1, Math.floor(maxUnits / 50))
  for (let q = 0; q <= maxUnits; q += step) {
    const revenue = pricePerUnit * q
    const totalCost = fixedCosts + variableCostPerUnit * q
    const profit = revenue - totalCost
    data.push({ quantity: q, revenue, totalCost, profit, fixedCost: fixedCosts })
  }
  return data
}

export function calcProfitAtMax(
  fixedCosts: number,
  variableCostPerUnit: number,
  pricePerUnit: number,
  maxUnits: number
): number {
  return pricePerUnit * maxUnits - (fixedCosts + variableCostPerUnit * maxUnits)
}

export function isViable(pricePerUnit: number, variableCostPerUnit: number): boolean {
  return pricePerUnit > variableCostPerUnit
}

// ─── Component ────────────────────────────────────────────────────────

export function BreakEvenAnalysis() {
  const [fixedCosts, setFixedCosts] = useState(100000)
  const [variableCostPerUnit, setVariableCostPerUnit] = useState(300)
  const [pricePerUnit, setPricePerUnit] = useState(500)
  const [maxUnits, setMaxUnits] = useState(1000)

  // XP tracking — award once per session on first interaction
  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = useCallback(() => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({
        moduleId: 'breakeven',
        action: 'calculate',
        xpEarned: MODULE_XP['breakeven'],
      })
    }
  }, [addModuleInteraction])

  const { toast } = useToast()
  const { t, locale } = useI18n()

  const formatNum = (n: number) => n.toLocaleString(locale)

  const breakEvenUnits = useMemo(
    () => calcBreakEvenUnits(fixedCosts, variableCostPerUnit, pricePerUnit),
    [fixedCosts, variableCostPerUnit, pricePerUnit]
  )
  const breakEvenRevenue = useMemo(
    () => calcBreakEvenRevenue(breakEvenUnits, pricePerUnit),
    [breakEvenUnits, pricePerUnit]
  )
  const contributionMargin = useMemo(
    () => calcContributionMargin(pricePerUnit, variableCostPerUnit),
    [pricePerUnit, variableCostPerUnit]
  )
  const marginOfSafety = useMemo(
    () => calcMarginOfSafety(maxUnits, breakEvenUnits),
    [maxUnits, breakEvenUnits]
  )
  const chartData = useMemo(
    () => calcChartData(fixedCosts, variableCostPerUnit, pricePerUnit, maxUnits),
    [fixedCosts, variableCostPerUnit, pricePerUnit, maxUnits]
  )
  const profitAtMax = calcProfitAtMax(fixedCosts, variableCostPerUnit, pricePerUnit, maxUnits)

  const reset = useCallback(() => {
    setFixedCosts(100000)
    setVariableCostPerUnit(300)
    setPricePerUnit(500)
    setMaxUnits(1000)
    toast({ title: t('common.reset'), description: t('breakeven.resetToastDescription') })
  }, [t, toast])

  const viable = isViable(pricePerUnit, variableCostPerUnit)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('module.breakeven.title')}
          </CardTitle>
          <CardDescription>{t('module.breakeven.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.fixedCosts')}</Label>
                <span className="font-mono text-muted-foreground">
                  {formatNum(fixedCosts)} {t('breakeven.rub')}
                </span>
              </div>
              <Slider
                aria-label={t('breakeven.fixedCosts')}
                value={[fixedCosts]}
                onValueChange={([v]) => {
                  awardXP()
                  setFixedCosts(v)
                }}
                min={10000}
                max={1000000}
                step={10000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.variableCosts')}</Label>
                <span className="font-mono text-muted-foreground">
                  {formatNum(variableCostPerUnit)} {t('breakeven.rub')}
                </span>
              </div>
              <Slider
                aria-label={t('breakeven.variableCosts')}
                value={[variableCostPerUnit]}
                onValueChange={([v]) => {
                  awardXP()
                  setVariableCostPerUnit(v)
                }}
                min={10}
                max={2000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.pricePerUnit')}</Label>
                <span className="font-mono text-muted-foreground">
                  {formatNum(pricePerUnit)} {t('breakeven.rub')}
                </span>
              </div>
              <Slider
                aria-label={t('breakeven.pricePerUnit')}
                value={[pricePerUnit]}
                onValueChange={([v]) => {
                  awardXP()
                  setPricePerUnit(v)
                }}
                min={10}
                max={5000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.maxUnits')}</Label>
                <span className="font-mono text-muted-foreground">
                  {maxUnits} {t('breakeven.units')}
                </span>
              </div>
              <Slider
                aria-label={t('breakeven.maxUnits')}
                value={[maxUnits]}
                onValueChange={([v]) => {
                  awardXP()
                  setMaxUnits(v)
                }}
                min={100}
                max={5000}
                step={100}
              />
            </div>
          </div>

          <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('breakeven.resetButton')}
          </Button>
        </CardContent>
      </Card>

      {!viable && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <div className="font-semibold text-red-600">{t('breakeven.notViable.title')}</div>
              <div className="text-sm text-muted-foreground">
                {t('breakeven.notViable.description')
                  .replace('{price}', formatNum(pricePerUnit))
                  .replace('{variableCost}', formatNum(variableCostPerUnit))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viable && (
        <>
          <div aria-live="polite" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">{t('breakeven.breakEvenUnits')}</div>
                <div className="text-xl font-mono font-bold">
                  {isFinite(breakEvenUnits)
                    ? `${formatNum(breakEvenUnits)} ${t('breakeven.units')}`
                    : '—'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">
                  {t('breakeven.breakEvenRevenue')}
                </div>
                <div className="text-xl font-mono font-bold">
                  {isFinite(breakEvenRevenue) ? formatNum(breakEvenRevenue) : '—'}
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">
                  {t('breakeven.contributionMargin')}
                </div>
                <div className="text-xl font-mono font-bold">{contributionMargin.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">{t('breakeven.marginOfSafety')}</div>
                <div
                  className={`text-xl font-mono font-bold ${marginOfSafety < 20 ? 'text-red-500' : marginOfSafety < 40 ? 'text-yellow-500' : 'text-green-500'}`}
                >
                  {marginOfSafety.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('breakeven.chartTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="quantity"
                      label={{
                        value: t('chart.quantityLabel'),
                        position: 'insideBottom',
                        offset: -5,
                      }}
                      fontSize={11}
                    />
                    <YAxis
                      label={{ value: t('chart.amountLabel'), angle: -90, position: 'insideLeft' }}
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        formatNum(value) + ' ' + t('breakeven.rub'),
                        name,
                      ]}
                    />
                    <Legend />
                    <ReferenceLine
                      x={breakEvenUnits}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      label={{ value: `BEP: ${breakEvenUnits}`, position: 'top', fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="fixedCost"
                      stroke={CHART_COLORS.neutral}
                      fill={CHART_COLORS.neutral}
                      fillOpacity={0.1}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name={t('legend.fixedCosts')}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      stroke={CHART_COLORS.danger}
                      strokeWidth={2}
                      dot={false}
                      name={t('legend.totalCost')}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.success}
                      strokeWidth={2}
                      dot={false}
                      name={t('legend.revenue')}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('breakeven.profitAtMax')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4">
                  <div
                    className={`text-3xl font-mono font-bold ${profitAtMax > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {profitAtMax > 0 ? '+' : ''}
                    {formatNum(profitAtMax)} {t('breakeven.rub')}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('card.profitAtMaxDescription')
                      .replace('{maxUnits}', String(maxUnits))
                      .replace('{pricePerUnit}', formatNum(pricePerUnit))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {t('breakeven.analysis')}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{t('breakeven.profitPerUnit')}</strong>{' '}
                  {formatNum(pricePerUnit - variableCostPerUnit)} {t('breakeven.rub')}
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{t('breakeven.marginOfSafetyLabel')}</strong> {marginOfSafety.toFixed(1)}%
                  —{' '}
                  {marginOfSafety < 20
                    ? t('analysis.marginOfSafetyLow')
                    : marginOfSafety < 40
                      ? t('analysis.marginOfSafetyMedium')
                      : t('analysis.marginOfSafetyHigh')}
                </div>
                <div className="p-2 bg-primary/5 rounded">
                  <strong>{t('breakeven.payoff')}</strong>{' '}
                  {t('analysis.payoffDescription').replace(
                    '{breakEvenUnits}',
                    isFinite(breakEvenUnits) ? String(breakEvenUnits) : '—'
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
