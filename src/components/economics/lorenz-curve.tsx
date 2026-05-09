'use client'

import { useState, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
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
  description: string
  min: number
  max: number
  defaultValue: number
}

const QUINTILE_CONFIG: QuintileConfig[] = [
  { key: 'q1', label: 'Q1', description: 'Беднейшие 20%', min: 0, max: 30, defaultValue: 5 },
  { key: 'q2', label: 'Q2', description: 'Вторые 20%', min: 0, max: 30, defaultValue: 10 },
  { key: 'q3', label: 'Q3', description: 'Средние 20%', min: 0, max: 30, defaultValue: 15 },
  { key: 'q4', label: 'Q4', description: 'Четвёртые 20%', min: 0, max: 30, defaultValue: 25 },
  { key: 'q5', label: 'Q5', description: 'Богатейшие 20%', min: 0, max: 50, defaultValue: 45 },
]

const COUNTRY_COMPARISON = [
  { country: 'Швеция', flag: '🇸🇪', gini: 0.27 },
  { country: 'США', flag: '🇺🇸', gini: 0.39 },
  { country: 'Россия', flag: '🇷🇺', gini: 0.41 },
  { country: 'Бразилия', flag: '🇧🇷', gini: 0.53 },
  { country: 'ЮАР', flag: '🇿🇦', gini: 0.63 },
]

function getGiniLevel(gini: number): { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (gini < 0.3) return { label: 'Низкое неравенство', color: 'text-emerald-600', variant: 'secondary' }
  if (gini < 0.5) return { label: 'Умеренное неравенство', color: 'text-amber-600', variant: 'default' }
  return { label: 'Высокое неравенство', color: 'text-red-600', variant: 'destructive' }
}

function getGiniBarColor(gini: number): string {
  if (gini < 0.3) return 'bg-emerald-500'
  if (gini < 0.5) return 'bg-amber-500'
  return 'bg-red-500'
}

export function LorenzCurve() {
  const [q1, setQ1] = useState(5)
  const [q2, setQ2] = useState(10)
  const [q3, setQ3] = useState(15)
  const [q4, setQ4] = useState(25)
  const [q5, setQ5] = useState(45)
  const [xpAwarded, setXpAwarded] = useState(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const awardXp = useCallback(() => {
    if (!xpAwarded) {
      setXpAwarded(true)
      addModuleInteraction({ moduleId: 'lorenz', action: 'calculate', xpEarned: MODULE_XP['lorenz'] })
    }
  }, [xpAwarded, addModuleInteraction])

  const setters = [setQ1, setQ2, setQ3, setQ4, setQ5]
  const rawValues = [q1, q2, q3, q4, q5]

  const totalRaw = rawValues.reduce((sum, v) => sum + v, 0)

  const normalizedQuintiles = totalRaw === 0
    ? [20, 20, 20, 20, 20]
    : rawValues.map(v => (v / totalRaw) * 100)

  const [nq1, nq2, nq3, nq4] = normalizedQuintiles
  const cum1 = nq1
  const cum2 = cum1 + nq2
  const cum3 = cum2 + nq3
  const cum4 = cum3 + nq4

  const cumulativeData = [
    { population: 0, equality: 0, lorenz: 0, inequalityGap: 0 },
    { population: 20, equality: 20, lorenz: cum1, inequalityGap: Math.max(0, 20 - cum1) },
    { population: 40, equality: 40, lorenz: cum2, inequalityGap: Math.max(0, 40 - cum2) },
    { population: 60, equality: 60, lorenz: cum3, inequalityGap: Math.max(0, 60 - cum3) },
    { population: 80, equality: 80, lorenz: cum4, inequalityGap: Math.max(0, 80 - cum4) },
    { population: 100, equality: 100, lorenz: 100, inequalityGap: 0 },
  ]

  const cumValues = [0, nq1, nq1 + nq2, nq1 + nq2 + nq3, nq1 + nq2 + nq3 + nq4, 100]
  const popValues = [0, 20, 40, 60, 80, 100]
  const x = popValues.map(v => v / 100)
  const y = cumValues.map(v => v / 100)

  let areaB = 0
  for (let i = 0; i < x.length - 1; i++) {
    areaB += (x[i + 1] - x[i]) * (y[i] + y[i + 1]) / 2
  }
  const gini = Math.max(0, Math.min(1, 1 - 2 * areaB))

  const giniLevel = getGiniLevel(gini)

  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      lorenz: 'Кривая Лоренца',
      equality: 'Линия равенства',
      inequalityGap: 'Область неравенства',
    }
    return [`${value.toFixed(1)}%`, labels[name] || name]
  }

  const formatLegend = (value: string) => {
    const labels: Record<string, string> = {
      lorenz: 'Кривая Лоренца',
      equality: 'Линия равенства',
      inequalityGap: 'Область неравенства (A)',
    }
    return labels[value] || value
  }

  return (
    <div className="space-y-6">
      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Кривая Лоренца и коэффициент Джини
          </CardTitle>
          <CardDescription>
            Визуализация распределения доходов. Изменяйте доли дохода квинтильных групп и наблюдайте, как меняется кривая Лоренца и коэффициент Джини.
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
                  label={{ value: 'Доля населения (%)', position: 'insideBottom', offset: -10, fontSize: 12 }}
                  fontSize={11}
                />
                <YAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: 'Доля дохода (%)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 12 }}
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
                  labelFormatter={(label) => `Население: ${label}%`}
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
              <span className="text-muted-foreground">Область A — неравенство</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm bg-amber-500/30 border border-amber-500/50" />
              <span className="text-muted-foreground">Область B — фактическое распределение</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--muted-foreground))' }} />
              <span className="text-muted-foreground">Линия абсолютного равенства</span>
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
              Распределение дохода по квинтилям
            </CardTitle>
            <CardDescription>
              Укажите долю дохода (%) для каждой группы. Значения автоматически нормализуются, если сумма ≠ 100%.
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
                      <span className="text-sm text-muted-foreground">{config.description}</span>
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
                  Сумма долей: {totalRaw}% (≠ 100%). Значения нормализованы пропорционально.
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
                Коэффициент Джини
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
                    <span>Равенство (0)</span>
                    <span>Неравенство (1)</span>
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
                  <div className="font-medium">Формула расчёта</div>
                  <div className="font-mono text-base">
                    G = A / (A + B) = 1 − 2B
                  </div>
                  <div className="text-xs">
                    где A — площадь между кривыми, B — площадь под кривой Лоренца
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Country Comparison Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Сравнение со странами мира</CardTitle>
              <CardDescription>
                Реальные значения коэффициента Джини (оценка)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {COUNTRY_COMPARISON.map(({ country, flag, gini: countryGini }) => {
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
                              ≈ ваша
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
                          title={`Ваш G = ${gini.toFixed(2)}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-3 bg-foreground" />
                <span>— ваше значение (G = {gini.toFixed(2)})</span>
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
            Теория: Кривая Лоренца и коэффициент Джини
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Кривая Лоренца</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Кривая Лоренца — это графическое представление распределения доходов (или богатства) в обществе.
                На оси X откладывается кумулятивная доля населения (от беднейших к богатейшим),
                а на оси Y — кумулятивная доля дохода, которую получает это население.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Линия абсолютного равенства</strong> (диагональ) означает, что каждый процент населения
                получает такой же процент дохода. Чем больше кривая Лоренца отклоняется от диагонали,
                тем выше неравенство в обществе.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Линия абсолютного неравенства</strong> — это ось X и вертикальная линия при 100% населения,
                означающая, что один человек получает весь доход, а остальные — ничего.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-base">Коэффициент Джини</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Коэффициент Джини — это числовая мера неравенства, равная отношению площади между
                линией равенства и кривой Лоренца (область A) к сумме площадей A и B:
              </p>
              <div className="p-3 rounded-lg bg-muted/50 text-center font-mono text-base">
                G = A / (A + B)
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Коэффициент принимает значения от 0 до 1:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">0–0.3</Badge>
                  <span className="text-muted-foreground">Низкое неравенство — доходы распределены относительно равномерно (скандинавские страны)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="default" className="mt-0.5 text-[10px] px-1.5 py-0">0.3–0.5</Badge>
                  <span className="text-muted-foreground">Умеренное неравенство — характерно для большинства развитых стран (Россия, США)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-[10px] px-1.5 py-0">{'>'} 0.5</Badge>
                  <span className="text-muted-foreground">Высокое неравенство — значительный разрыв между богатыми и бедными (ЮАР, Бразилия)</span>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Ограничения коэффициента Джини
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Коэффициент Джини не учитывает структуру неравенства — две страны с одинаковым G
              могут иметь разное распределение дохода (например, разный размер среднего класса).
              Также он чувствителен к изменениям в середине распределения и менее чувствителен
              к изменениям на крайних полюсах. Для более полной картины используют дополнительные
              показатели: децильный коэффициент, индекс Палма, долю дохода_top-10% и другие.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
