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
  Line,
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

export function PhillipsCurve() {
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
    const data = []
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
              <CardTitle className="text-xl">Кривая Филлипса</CardTitle>
              <CardDescription>
                Интерактивная модель взаимосвязи инфляции и безработицы
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
            <CardTitle className="text-base">График кривой Филлипса</CardTitle>
            <CardDescription>
              Краткосрочная (SRPC) и долгосрочная (LRPC) кривые Филлипса
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
                      value: 'Безработица (%)',
                      position: 'insideBottom',
                      offset: -10,
                      style: { fontSize: 13, fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    label={{
                      value: 'Инфляция (%)',
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
                        return [`${value.toFixed(2)}%`, 'Инфляция (SRPC)']
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label: number) =>
                      `Безработица: ${label}%`
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
                      value: `LRPC (u*=${naturalRate}%)`,
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
                    name="Равновесие"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded bg-orange-500" />
                <span className="text-muted-foreground">SRPC — Краткосрочная</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-green-500" />
                <span className="text-muted-foreground">LRPC — Долгосрочная</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground">Точка равновесия</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded border-t-2 border-dashed border-blue-500" />
                <span className="text-muted-foreground">Ожидаемая инфляция (πe)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Parameter Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Параметры модели</CardTitle>
              <CardDescription>
                Настройте параметры кривой Филлипса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Expected Inflation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Ожидаемая инфляция (πe)
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
                  Уровень инфляции, который ожидают экономические агенты
                </p>
              </div>

              <Separator />

              {/* Natural Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Естественный уровень безработицы (u*)
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
                  Уровень безработицы при полной занятости (NAIRU)
                </p>
              </div>

              <Separator />

              {/* Alpha */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Наклон кривой (α)
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
                  Чувствительность инфляции к отклонению безработицы от u*
                </p>
              </div>

              <Separator />

              {/* Supply Shock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Шок предложения (ε)
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
                  Внешний ценовой шок (положительный = рост инфляции)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actual Unemployment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Текущее равновесие</CardTitle>
              <CardDescription>
                Установите фактический уровень безработицы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Фактическая безработица (u)
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
                  <span className="text-muted-foreground">Фактическая инфляция (π)</span>
                  <span className="font-semibold">{equilibriumInflation.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Разрыв безработицы (u − u*)</span>
                  <span className={`font-semibold ${unemploymentGap > 0 ? 'text-red-500' : unemploymentGap < 0 ? 'text-green-500' : ''}`}>
                    {unemploymentGap > 0 ? '+' : ''}
                    {unemploymentGap.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Отклонение инфляции (π − πe)</span>
                  <span className={`font-semibold ${(equilibriumInflation - expectedInflation) > 0 ? 'text-red-500' : (equilibriumInflation - expectedInflation) < 0 ? 'text-green-500' : ''}`}>
                    {(equilibriumInflation - expectedInflation) > 0 ? '+' : ''}
                    {(equilibriumInflation - expectedInflation).toFixed(2)}%
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Коэффициент ущерба</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
                  </span>
                </div>
              </div>

              {isStagflation && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    Стагфляция: высокая инфляция + высокая безработица
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preset Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сценарии</CardTitle>
              <CardDescription>Быстрые пресеты параметров</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyStagflationPreset}
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                Стагфляция (1970-е)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyDisinflationPreset}
              >
                <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
                Дезинфляция (Волкер)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={applyDefaultPreset}
              >
                <Info className="mr-2 h-4 w-4 text-blue-500" />
                Сброс параметров
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formula Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Формула кривой Филлипса</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-lg font-mono font-semibold tracking-wide">
              π = πe − α(u − u*) + ε
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-orange-600 dark:text-orange-400">π</span> — фактическая инфляция
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-blue-600 dark:text-blue-400">πe</span> — ожидаемая инфляция ({expectedInflation}%)
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-green-600 dark:text-green-400">α</span> — наклон кривой ({alpha.toFixed(2)})
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-semibold text-red-600 dark:text-red-400">ε</span> — шок предложения ({supplyShock > 0 ? '+' : ''}{supplyShock})
            </div>
          </div>
          <Separator className="my-4" />
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground mb-1">Подстановка текущих значений:</p>
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
              <CardTitle className="text-base">Краткосрочный и долгосрочный периоды</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              В <strong className="text-foreground">краткосрочном периоде</strong> существует обратная
              зависимость между инфляцией и безработицей. Снижение безработицы ниже естественного
              уровня приводит к росту инфляции, и наоборот.
            </p>
            <p>
              В <strong className="text-foreground">долгосрочном периоде</strong> кривая Филлипса
              вертикальна на уровне естественной безработицы (u*). Это означает, что денежно-кредитная
              политика не может устойчиво удерживать безработицу ниже u* — инфляционные ожидания
              адаптируются, и SRPC сдвигается вверх.
            </p>
            <Separator />
            <p className="text-xs italic">
              Долгосрочная кривая вертикальна, так как π = πe при u = u*. Любая попытка снизить
              безработицу ниже u* ведёт лишь к ускорению инфляции.
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
              <CardTitle className="text-base">Кривая Филлипса с ожиданиями</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Модель Фридмана—Фелпса учитывает <strong className="text-foreground">инфляционные
              ожидания</strong> как ключевой фактор. Формула π = πe − α(u − u*) + ε показывает,
              что фактическая инфляция зависит от:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ожидаемой инфляции (πe) — агенты строят прогнозы</li>
              <li>Отклонения безработицы от u* — циклическая компонента</li>
              <li>Шоков предложения (ε) — экзогенные факторы</li>
            </ul>
            <Separator />
            <p>
              <strong className="text-foreground">Коэффициент ущерба</strong> (sacrifice ratio) = 1/α ={' '}
              <span className="text-orange-600 dark:text-orange-400 font-semibold">
                {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)}
              </span>
              . Это процентных пунктов безработицы, необходимых для снижения инфляции на 1 п.п.
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
              <CardTitle className="text-base">Стагфляция</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Стагфляция</strong> — одновременное сочетание
              высокой инфляции и высокой безработицы. Возникает при отрицательном шоке
              предложения (ε &gt; 0), который сдвигает SRPC вверх.
            </p>
            <p>
              Классический пример — <strong className="text-foreground">нефтяные кризисы 1970-х</strong>,
              когда рост цен на нефть вызвал одновременный рост инфляции и безработицы в
              развитых странах, что опровергло простую кривую Филлипса.
            </p>
            <Separator />
            <div className="flex items-center gap-2">
              <Badge variant={isStagflation ? 'destructive' : 'secondary'}>
                {isStagflation ? 'Стагфляция!' : 'Нет стагфляции'}
              </Badge>
              <span className="text-xs">
                Текущие параметры {isStagflation ? 'соответствуют' : 'не соответствуют'} сценарию стагфляции
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sacrifice Ratio Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Коэффициент ущерба (Sacrifice Ratio)</CardTitle>
          <CardDescription>
            Сколько безработицы нужно «купить» за снижение инфляции на 1 п.п.
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
                  Чем <strong className="text-foreground">выше α</strong> (крутая кривая), тем
                  меньше жертв требуется: каждый процент безработицы сильнее давит на инфляцию.
                </p>
                <p>
                  Чем <strong className="text-foreground">ниже α</strong> (пологая кривая), тем
                  больше безработицы нужно «допустить», чтобы снизить инфляцию на 1 п.п.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Пример расчёта</h4>
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <p>
                  Текущий α = <strong>{alpha.toFixed(2)}</strong>
                </p>
                <p>
                  Чтобы снизить инфляцию на 1 п.п., безработица должна превысить u* на:{' '}
                  <strong className="text-orange-600 dark:text-orange-400">
                    {sacrificeRatio === Infinity ? '∞' : sacrificeRatio.toFixed(2)} п.п.
                  </strong>
                </p>
                <Separator />
                <p>
                  При текущих параметрах: u* = {naturalRate}%, значит для снижения инфляции
                  на 1% безработица должна вырасти до{' '}
                  <strong>
                    {(naturalRate + sacrificeRatio).toFixed(2)}%
                  </strong>
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
