'use client'

import { useState, useMemo, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
} from 'recharts'
import { TrendingDown, AlertTriangle, Info } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

export function PhillipsCurve() {
  const { t } = useI18n()
  const [expectedInflation, setExpectedInflation] = useState(5)
  const [naturalRate, setNaturalRate] = useState(5)
  const [alpha, setAlpha] = useState(0.5)
  const [supplyShock, setSupplyShock] = useState(0)
  const [actualUnemployment, setActualUnemployment] = useState(5)
  const [xpAwarded, setXpAwarded] = useState(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const awardSliderXp = useCallback(() => {
    if (!xpAwarded) {
      setXpAwarded(true)
      addModuleInteraction({ moduleId: 'phillips', action: 'calculate', xpEarned: MODULE_XP['phillips'] })
    }
  }, [xpAwarded, addModuleInteraction])

  // Generate chart data dynamically
  const chartData = useMemo(() => {
    const data: Array<{ unemployment: number; srpcInflation: number }> = []
    for (let u = 0; u <= 12; u += 0.5) {
      const srpcInflation =
        expectedInflation - alpha * (u - naturalRate) + supplyShock
      data.push({
        unemployment: u,
        srpcInflation: Math.round(srpcInflation * 100) / 100,
      })
    }
    return data
  }, [expectedInflation, naturalRate, alpha, supplyShock])

  // Equilibrium point
  const equilibriumInflation = useMemo(() => {
    return (
      expectedInflation -
      alpha * (actualUnemployment - naturalRate) +
      supplyShock
    )
  }, [expectedInflation, alpha, actualUnemployment, naturalRate, supplyShock])

  // Equilibrium scatter data
  const equilibriumPoint = useMemo(() => {
    return [
      {
        unemployment: actualUnemployment,
        inflation: Math.round(equilibriumInflation * 100) / 100,
      },
    ]
  }, [actualUnemployment, equilibriumInflation])

  // Sacrifice ratio: how much unemployment must rise to reduce inflation by 1%
  const sacrificeRatio = useMemo(() => {
    return alpha > 0 ? Math.round((1 / alpha) * 100) / 100 : Infinity
  }, [alpha])

  // Gap between actual and natural unemployment
  const unemploymentGap = actualUnemployment - naturalRate
  const isStagflation = equilibriumInflation > expectedInflation && unemploymentGap > 0

  // Compute y-axis domain
  const yMin = useMemo(() => {
    const minVal = Math.min(...chartData.map((d) => d.srpcInflation), equilibriumInflation)
    return Math.floor(minVal - 2)
  }, [chartData, equilibriumInflation])

  const yMax = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.srpcInflation), equilibriumInflation)
    return Math.ceil(maxVal + 2)
  }, [chartData, equilibriumInflation])

  // Preset scenarios
  const applyStagflationPreset = () => {
    setExpectedInflation(10)
    setNaturalRate(6)
    setAlpha(0.6)
    setSupplyShock(3)
    setActualUnemployment(8)
    addModuleInteraction({ moduleId: 'phillips', action: 'preset', xpEarned: MODULE_XP['phillips'] })
  }

  const applyDisinflationPreset = () => {
    setExpectedInflation(8)
    setNaturalRate(5)
    setAlpha(0.5)
    setSupplyShock(0)
    setActualUnemployment(8)
    addModuleInteraction({ moduleId: 'phillips', action: 'preset', xpEarned: MODULE_XP['phillips'] })
  }

  const applyDefaultPreset = () => {
    setExpectedInflation(5)
    setNaturalRate(5)
    setAlpha(0.5)
    setSupplyShock(0)
    setActualUnemployment(5)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl">{t('phillips.title')}</CardTitle>
              <CardDescription>
                {t('phillips.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main content: Chart + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('phillips.graph')}</CardTitle>
            <CardDescription>
              {t('phillips.graphDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="unemployment"
                    type="number"
                    domain={[0, 12]}
                    tickCount={13}
                    label={{
                      value: t('phillips.unemployment') + ' (%)',
                      position: 'insideBottom',
                      offset: -10,
                      style: { fontSize: 13, fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    label={{
                      value: t('phillips.inflation') + ' (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -5,
                      style: { fontSize: 13, fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'srpcInflation') {
                        return [`${value.toFixed(2)}%`, t('phillips.inflation') + ' (SRPC)']
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label: number) =>
                      `${t('phillips.unemployment')}: ${label}%`
                    }
                  />

                  {/* SRPC as Area */}
                  <Area
                    type="monotone"
                    dataKey="srpcInflation"
                    stroke="hsl(24, 95%, 53%)"
                    fill="hsl(24, 95%, 53%)"
                    fillOpacity={0.08}
                    strokeWidth={2.5}
                    dot={false}
                    name="srpcInflation"
                  />

                  {/* LRPC - vertical reference line at natural rate */}
                  <ReferenceLine
                    x={naturalRate}
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    label={{
                      value: `${t('phillips.lrpc')} (u*=${naturalRate}%)`,
                      position: 'top',
                      fill: 'hsl(142, 71%, 45%)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />

                  {/* Reference line at expected inflation */}
                  <ReferenceLine
                    y={expectedInflation}
                    stroke="hsl(221, 83%, 53%)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    label={{
                      value: `πe=${expectedInflation}%`,
                      position: 'right',
                      fill: 'hsl(221, 83%, 53%)',
                      fontSize: 11,
                    }}
                  />

                  {/* Equilibrium point */}
                  <Scatter
                    data={equilibriumPoint}
                    dataKey="inflation"
                    fill="hsl(0, 84%, 60%)"
                    stroke="hsl(0, 84%, 60%)"
                    name={t('phillips.equilibrium')}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded bg-orange-500" />
                <span className="text-muted-foreground">{t('phillips.srpc')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-green-500" />
                <span className="text-muted-foreground">{t('phillips.lrpc')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{t('phillips.equilibrium')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-blue-500" />
                <span className="text-muted-foreground">{t('phillips.expectedInflation')} (πe)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Parameter Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('phillips.params')}</CardTitle>
              <CardDescription>
                {t('phillips.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Expected Inflation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('phillips.expectedInflation')} (πe)
                  </label>
                  <Badge variant="secondary">{expectedInflation}%</Badge>
                </div>
                <Slider
                  value={[expectedInflation]}
                  min={0}
                  max={15}
                  step={0.5}
                  onValueChange={(v) => { setExpectedInflation(v[0]); awardSliderXp() }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('phillips.expectedInflation')}
                </p>
              </div>

              <Separator />

              {/* Natural Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('phillips.naturalRate')} (u*)
                  </label>
                  <Badge variant="secondary">{naturalRate}%</Badge>
                </div>
                <Slider
                  value={[naturalRate]}
                  min={2}
                  max={10}
                  step={0.5}
                  onValueChange={(v) => { setNaturalRate(v[0]); awardSliderXp() }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('phillips.naturalRate')} (NAIRU)
                </p>
              </div>

              <Separator />

              {/* Alpha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('phillips.sensitivity')} (α)
                  </label>
                  <Badge variant="secondary">{alpha.toFixed(2)}</Badge>
                </div>
                <Slider
                  value={[alpha]}
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  onValueChange={(v) => { setAlpha(v[0]); awardSliderXp() }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('phillips.sensitivity')}
                </p>
              </div>

              <Separator />

              {/* Supply Shock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('phillips.shock')} (ε)
                  </label>
                  <Badge variant={supplyShock !== 0 ? 'destructive' : 'secondary'}>
                    {supplyShock > 0 ? `+${supplyShock}` : supplyShock}
                  </Badge>
                </div>
                <Slider
                  value={[supplyShock]}
                  min={-3}
                  max={3}
                  step={0.5}
                  onValueChange={(v) => { setSupplyShock(v[0]); awardSliderXp() }}
                />
                <p className="text-xs text-muted-foreground">
                  {t('phillips.shock')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actual Unemployment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('phillips.equilibrium')}</CardTitle>
              <CardDescription>
                {t('phillips.unemployment')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t('phillips.unemployment')} (u)
                  </label>
                  <Badge variant="outline">{actualUnemployment}%</Badge>
                </div>
                <Slider
                  value={[actualUnemployment]}
                  min={0}
                  max={12}
                  step={0.5}
                  onValueChange={(v) => { setActualUnemployment(v[0]); awardSliderXp() }}
                />
              </div>

              <Separator />

              {/* Calculated values */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('phillips.inflation')} (π)</span>
                  <span className="font-semibold">{equilibriumInflation.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('phillips.unemployment')} (u − u*)</span>
                  <span className={`font-semibold ${unemploymentGap > 0 ? 'text-red-500' : unemploymentGap < 0 ? 'text-green-500' : ''}`}>
                    {unemploymentGap > 0 ? '+' : ''}
                    {unemploymentGap.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">(π − πe)</span>
                  <span className={`font-semibold ${(equilibriumInflation - expectedInflation) > 0 ? 'text-red-500' : (equilibriumInflation - expectedInflation) < 0 ? 'text-green-500' : ''}`}>
                    {(equilibriumInflation - expectedInflation) > 0 ? '+' : ''}
                    {(equilibriumInflation - expectedInflation).toFixed(2)}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('phillips.sacrificeRatio')}</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
                  </span>
                </div>
              </div>

              {isStagflation && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {t('phillips.stagflation')}: {t('phillips.inflation')} + {t('phillips.unemployment')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preset Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('phillips.scenarios')}</CardTitle>
              <CardDescription>{t('phillips.params')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyStagflationPreset}
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                {t('phillips.stagflation')} (1970s)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyDisinflationPreset}
              >
                <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
                {t('phillips.disinflation')} (Volcker)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyDefaultPreset}
              >
                <Info className="mr-2 h-4 w-4 text-blue-500" />
                {t('phillips.reset')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formula Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('phillips.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-lg font-mono font-semibold tracking-wide">
              π = πe − α(u − u*) + ε
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-orange-600 dark:text-orange-400">π</span> — {t('phillips.inflation')}
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-blue-600 dark:text-blue-400">πe</span> — {t('phillips.expectedInflation')} ({expectedInflation}%)
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-green-600 dark:text-green-400">α</span> — {t('phillips.sensitivity')} ({alpha.toFixed(2)})
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-red-600 dark:text-red-400">ε</span> — {t('phillips.shock')} ({supplyShock > 0 ? '+' : ''}{supplyShock})
            </div>
          </div>
          <Separator className="my-4" />
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">{t('phillips.params')}:</p>
            <p className="font-mono text-sm">
              π = {expectedInflation} − {alpha.toFixed(2)} × ({actualUnemployment} − {naturalRate}) + ({supplyShock > 0 ? '+' : ''}{supplyShock}) ={' '}
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {equilibriumInflation.toFixed(2)}%
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Short-run vs Long-run */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-base">{t('phillips.srpc')} / {t('phillips.lrpc')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t('phillips.theory.text')
                .replace('{shortRun}', t('phillips.srpc'))
                .replace('{longRun}', t('phillips.lrpc'))}
            </p>
          </CardContent>
        </Card>

        {/* Expectations-augmented Phillips Curve */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">{t('phillips.title')} ({t('phillips.expectedInflation')})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t('phillips.theory')}
            </p>
            <Separator />
            <p>
              <strong className="text-foreground">{t('phillips.sacrificeRatio')}</strong> = 1/α ={' '}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">
                {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Stagflation */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-base">{t('phillips.stagflation')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{t('phillips.stagflation')}</strong> — {t('phillips.inflation')} + {t('phillips.unemployment')}
            </p>
            <Separator />
            <div className="flex items-center gap-2">
              <Badge variant={isStagflation ? 'destructive' : 'secondary'}>
                {isStagflation ? t('phillips.stagflation') + '!' : t('phillips.stagflation') + ' —'}
              </Badge>
              <span className="text-xs">
                {t('phillips.params')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sacrifice Ratio Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('phillips.sacrificeRatio')}</CardTitle>
          <CardDescription>
            {t('phillips.sacrificeRatio')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="font-mono text-center text-lg font-semibold">
                  SR = 1 / α = 1 / {alpha.toFixed(2)} ={' '}
                  <span className="text-orange-600 dark:text-orange-400">
                    {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
                  </span>
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {t('phillips.sensitivity')} (α): {t('phillips.theory.text')}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">{t('phillips.calculate')}</h4>
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <p>
                  {t('phillips.sensitivity')} = <strong>{alpha.toFixed(2)}</strong>
                </p>
                <p>
                  {t('phillips.sacrificeRatio')}:{' '}
                  <strong className="text-orange-600 dark:text-orange-400">
                    {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
                  </strong>
                </p>
                <Separator />
                <p>
                  {t('phillips.params')}: u* = {naturalRate}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PhillipsCurve
