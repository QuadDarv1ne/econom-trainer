'use client'

import { useState, useCallback, useRef, useMemo, memo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
} from 'recharts'
import { Scale, Info, AlertTriangle } from 'lucide-react'

interface QuintileConfig {
  key: string
  label: string
  min: number
  max: number
  defaultValue: number
}

const QUINTILE_CONFIG: QuintileConfig[] = [
  { key: 'q1', label: 'Q1', min: 0, max: 30, defaultValue: 5 },
  { key: 'q2', label: 'Q2', min: 0, max: 30, defaultValue: 10 },
  { key: 'q3', label: 'Q3', min: 0, max: 30, defaultValue: 15 },
  { key: 'q4', label: 'Q4', min: 0, max: 30, defaultValue: 25 },
  { key: 'q5', label: 'Q5', min: 0, max: 50, defaultValue: 45 },
]

const COUNTRY_GINI = [
  { key: 'sweden', flag: '🇸🇪', gini: 0.27 },
  { key: 'usa', flag: '🇺🇸', gini: 0.39 },
  { key: 'russia', flag: '🇷🇺', gini: 0.41 },
  { key: 'brazil', flag: '🇧🇷', gini: 0.53 },
  { key: 'southAfrica', flag: '🇿🇦', gini: 0.63 },
]

function getGiniLevel(gini: number, t: (key: string) => string): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (gini < 0.3) return { label: t('lorenz.lowInequality'), color: 'text-emerald-600', variant: 'secondary' }
  if (gini < 0.5) return { label: t('lorenz.moderateInequality'), color: 'text-amber-600', variant: 'default' }
  return { label: t('lorenz.highInequality'), color: 'text-red-600', variant: 'destructive' }
}

function getGiniBarColor(gini: number): string {
  if (gini < 0.3) return 'bg-emerald-500'
  if (gini < 0.5) return 'bg-amber-500'
  return 'bg-red-500'
}

export const LorenzCurve = memo(function LorenzCurve() {
  const { t } = useI18n()
  const [q1, setQ1] = useState(5)
  const [q2, setQ2] = useState(10)
  const [q3, setQ3] = useState(15)
  const [q4, setQ4] = useState(25)
  const [q5, setQ5] = useState(45)
  const xpAwardedRef = useRef(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const quintileDescriptions = useMemo(() => [
    t('lorenz.quintile.poorest'),
    t('lorenz.quintile.second'),
    t('lorenz.quintile.middle'),
    t('lorenz.quintile.fourth'),
    t('lorenz.quintile.richest'),
  ], [t])

  const countryComparison = useMemo(() => COUNTRY_GINI.map(c => ({
    country: t(`lorenz.country.${c.key}`),
    flag: c.flag,
    gini: c.gini,
  })), [t])

  const awardXp = useCallback(() => {
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true
      addModuleInteraction({ moduleId: 'lorenz', action: 'calculate', xpEarned: MODULE_XP['lorenz'] })
    }
  }, [addModuleInteraction])

  const setters = [setQ1, setQ2, setQ3, setQ4, setQ5]
  const rawValues = useMemo(() => [q1, q2, q3, q4, q5], [q1, q2, q3, q4, q5])

  const totalRaw = rawValues.reduce((sum, v) => sum + v, 0)

  const normalizedQuintiles = useMemo(() => totalRaw === 0
    ? [20, 20, 20, 20, 20]
    : rawValues.map(v => (v / totalRaw) * 100), [rawValues, totalRaw])

  const [nq1, nq2, nq3, nq4] = normalizedQuintiles
  const cum1 = nq1
  const cum2 = cum1 + nq2
  const cum3 = cum2 + nq3
  const cum4 = cum3 + nq4

  const cumulativeData = useMemo(() => [
    { population: 0, equality: 0, lorenz: 0, inequalityGap: 0 },
    { population: 20, equality: 20, lorenz: cum1, inequalityGap: Math.max(0, 20 - cum1) },
    { population: 40, equality: 40, lorenz: cum2, inequalityGap: Math.max(0, 40 - cum2) },
    { population: 60, equality: 60, lorenz: cum3, inequalityGap: Math.max(0, 60 - cum3) },
    { population: 80, equality: 80, lorenz: cum4, inequalityGap: Math.max(0, 80 - cum4) },
    { population: 100, equality: 100, lorenz: 100, inequalityGap: 0 },
  ], [cum1, cum2, cum3, cum4])

  const gini = useMemo(() => {
    const cumValues = [0, nq1, nq1 + nq2, nq1 + nq2 + nq3, nq1 + nq2 + nq3 + nq4, 100]
    const popValues = [0, 20, 40, 60, 80, 100]
    const x = popValues.map(v => v / 100)
    const y = cumValues.map(v => v / 100)
    let areaB = 0
    for (let i = 0; i < x.length - 1; i++) {
      areaB += (x[i + 1] - x[i]) * (y[i] + y[i + 1]) / 2
    }
    return Math.max(0, Math.min(1, 1 - 2 * areaB))
  }, [nq1, nq2, nq3, nq4])

  const giniLevel = getGiniLevel(gini, t)

  const formatTooltip = useCallback((value: number, name: string) => {
    const labels: Record<string, string> = {
      lorenz: t('lorenz.graph'),
      equality: t('lorenz.lineOfEquality'),
      inequalityGap: t('lorenz.inequalityGap'),
    }
    return [`${value.toFixed(1)}%`, labels[name] || name]
  }, [t])

  const formatLegend = useCallback((value: string) => {
    const labels: Record<string, string> = {
      lorenz: t('lorenz.graph'),
      equality: t('lorenz.lineOfEquality'),
      inequalityGap: `${t('lorenz.inequalityGap')} (A)`,
    }
    return labels[value] || value
  }, [t])

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            {t('lorenz.title')}
          </CardTitle>
          <CardDescription>
            {t('lorenz.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] sm:h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cumulativeData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="population"
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: t('lorenz.population'), position: 'insideBottom', offset: -10, fontSize: 12 }}
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: t('lorenz.income'), angle: -90, position: 'insideLeft', offset: 5, fontSize: 12 }}
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={formatTooltip}
                  labelFormatter={(label) => `${t('lorenz.population')}: ${label}%`}
                />
                <Legend formatter={formatLegend} />
                {/* Area B - under Lorenz curve */}
                <Area
                  type="monotone"
                  dataKey="lorenz"
                  stackId="lorenzStack"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="rgba(245, 158, 11, 0.2)"
                  name="lorenz"
                  dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                />
                {/* Area A - inequality gap (stacked on top of Lorenz) */}
                <Area
                  type="monotone"
                  dataKey="inequalityGap"
                  stackId="lorenzStack"
                  stroke="none"
                  fill="rgba(239, 68, 68, 0.25)"
                  name="inequalityGap"
                  dot={false}
                />
                {/* Perfect equality line */}
                <Line
                  type="linear"
                  dataKey="equality"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  name="equality"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Area labels below chart */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-red-500/30 border border-red-500/50" />
              <span className="text-muted-foreground">{t('lorenz.interpretation')} A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-amber-500/30 border border-amber-500/50" />
              <span className="text-muted-foreground">{t('lorenz.graphDesc')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--muted-foreground))' }} />
              <span className="text-muted-foreground">{t('lorenz.lineOfEquality')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls + Gini Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sliders Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {t('lorenz.incomeShare').replace('{pct}', '100')}
            </CardTitle>
            <CardDescription>
              {t('lorenz.customData')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {QUINTILE_CONFIG.map((config, index) => {
              const normalizedValue = normalizedQuintiles[index]
              return (
                <div key={config.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold bg-primary/10 text-primary">
                        {config.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{quintileDescriptions[index]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono text-muted-foreground">{rawValues[index]}%</span>
                      {totalRaw !== 100 && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono font-medium">{normalizedValue.toFixed(1)}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Slider
                    value={[rawValues[index]]}
                    onValueChange={([v]) => { setters[index](v); awardXp() }}
                    min={config.min}
                    max={config.max}
                    step={1}
                  />
                </div>
              )
            })}

            {totalRaw !== 100 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {t('lorenz.sumWarning').replace('{total}', String(totalRaw))}
                </span>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {QUINTILE_CONFIG.map((config, index) => (
                <div key={config.key} className="p-2 rounded bg-muted/50">
                  <div className="font-bold text-muted-foreground">{config.label}</div>
                  <div className="text-base font-mono font-semibold mt-0.5">
                    {normalizedQuintiles[index].toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gini Result + Comparison */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-4 w-4" />
                {t('lorenz.gini')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold tracking-tight">
                    {gini.toFixed(3)}
                  </div>
                  <Badge variant={giniLevel.variant} className="mt-3 text-sm px-3 py-1">
                    {giniLevel.label}
                  </Badge>
                </div>

                <Separator />

                {/* Visual Gini bar */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('lorenz.lineOfEquality')} (0)</span>
                    <span>{t('lorenz.interpretation')} (1)</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getGiniBarColor(gini)}`}
                      style={{ width: `${gini * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-emerald-600">{'< 0.3'}</span>
                    <span className="text-amber-600">0.3–0.5</span>
                    <span className="text-red-600">{'> 0.5'}</span>
                  </div>
                </div>

                <Separator />

                {/* Formula */}
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <div className="font-medium">{t('lorenz.theory.title')}</div>
                  <div className="font-mono text-base">
                    G = A / (A + B) = 1 − 2B
                  </div>
                  <div className="text-xs">
                    {t('lorenz.gini')}: A = {t('lorenz.interpretation')}, B = {t('lorenz.graph')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('lorenz.tab.countries')}</CardTitle>
              <CardDescription>
                {t('lorenz.gini')} ({t('lorenz.interpretation')})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countryComparison.map(({ country, flag, gini: countryGini }) => {
                  const diff = gini - countryGini
                  const isClose = Math.abs(diff) < 0.03
                  return (
                    <div key={country} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{flag}</span>
                          <span className="font-medium">{country}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{countryGini.toFixed(2)}</span>
                          {isClose && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {t('lorenz.interp.perfect').split(':')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full ${getGiniBarColor(countryGini)}`}
                          style={{ width: `${countryGini * 100}%` }}
                        />
                        {/* Marker for user's Gini */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                          style={{ left: `${gini * 100}%` }}
                          title={`${t('lorenz.gini')} = ${gini.toFixed(2)}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-3 bg-foreground" />
                <span>— {t('lorenz.gini')} (G = {gini.toFixed(2)})</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Theory Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('lorenz.theory.title')}: {t('lorenz.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">{t('lorenz.graph')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('lorenz.theory.lorenzCurve')}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>{t('lorenz.equalityLine')}</strong> {t('lorenz.theory.equalityLine')}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>{t('lorenz.inequality')}</strong> {t('lorenz.theory.inequalityLine')}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">{t('lorenz.gini')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('lorenz.giniExplanation')}
              </p>
              <div className="p-3 rounded-lg bg-muted/50 text-center font-mono text-base">
                G = A / (A + B)
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('lorenz.giniRange')}
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">0–0.3</Badge>
                  <span className="text-muted-foreground">{t('lorenz.giniLow')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="default" className="mt-0.5 text-[10px] px-1.5 py-0">0.3–0.5</Badge>
                  <span className="text-muted-foreground">{t('lorenz.giniModerate')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-[10px] px-1.5 py-0">{'>'} 0.5</Badge>
                  <span className="text-muted-foreground">{t('lorenz.giniHigh')}</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t('lorenz.gini')} {t('lorenz.interpretation').toLowerCase()}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('lorenz.giniLimitation')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
});
