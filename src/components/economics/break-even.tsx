'use client'

import { useState, useMemo } from 'react'
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

export function BreakEvenAnalysis() {
  const [fixedCosts, setFixedCosts] = useState(100000)
  const [variableCostPerUnit, setVariableCostPerUnit] = useState(300)
  const [pricePerUnit, setPricePerUnit] = useState(500)
  const [maxUnits, setMaxUnits] = useState(1000)

  // XP tracking — award once per session on first interaction
  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = () => {
    if (!hasEarnedXP) {
      setHasEarnedXP(true)
      addModuleInteraction({ moduleId: 'breakeven', action: 'calculate', xpEarned: MODULE_XP['breakeven'] })
    }
  }

  const { toast } = useToast()
  const { t } = useI18n()

  const breakEvenUnits = useMemo(() => {
    const contribution = pricePerUnit - variableCostPerUnit
    if (contribution <= 0) return Infinity
    return Math.ceil(fixedCosts / contribution)
  }, [fixedCosts, variableCostPerUnit, pricePerUnit])

  const breakEvenRevenue = useMemo(() => {
    return breakEvenUnits * pricePerUnit
  }, [breakEvenUnits, pricePerUnit])

  const contributionMargin = useMemo(() => {
    if (pricePerUnit <= 0) return 0
    return ((pricePerUnit - variableCostPerUnit) / pricePerUnit) * 100
  }, [pricePerUnit, variableCostPerUnit])

  const marginOfSafety = useMemo(() => {
    if (maxUnits <= 0) return 0
    return ((maxUnits - breakEvenUnits) / maxUnits) * 100
  }, [maxUnits, breakEvenUnits])

  const chartData = useMemo(() => {
    const data: Array<{ quantity: number; revenue: number; totalCost: number; profit: number; fixedCost: number }> = []
    const step = Math.max(1, Math.floor(maxUnits / 50))
    for (let q = 0; q <= maxUnits; q += step) {
      const revenue = pricePerUnit * q
      const totalCost = fixedCosts + variableCostPerUnit * q
      const profit = revenue - totalCost
      data.push({
        quantity: q,
        revenue,
        totalCost,
        profit,
        fixedCost: fixedCosts,
      })
    }
    return data
  }, [fixedCosts, variableCostPerUnit, pricePerUnit, maxUnits])

  // At max capacity
  const profitAtMax = pricePerUnit * maxUnits - (fixedCosts + variableCostPerUnit * maxUnits)

  const reset = () => {
    setFixedCosts(100000)
    setVariableCostPerUnit(300)
    setPricePerUnit(500)
    setMaxUnits(1000)
    toast({ title: t('common.reset'), description: t('breakeven.resetToastDescription') })
  }

  const isViable = pricePerUnit > variableCostPerUnit

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('module.breakeven.title')}
          </CardTitle>
          <CardDescription>
            {t('module.breakeven.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.fixedCosts')}</Label>
                <span className="font-mono text-muted-foreground">{fixedCosts.toLocaleString('ru-RU')} руб.</span>
              </div>
              <Slider
                value={[fixedCosts]}
                onValueChange={([v]) => { awardXP(); setFixedCosts(v) }}
                min={10000}
                max={1000000}
                step={10000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.variableCosts')}</Label>
                <span className="font-mono text-muted-foreground">{variableCostPerUnit.toLocaleString('ru-RU')} руб.</span>
              </div>
              <Slider
                value={[variableCostPerUnit]}
                onValueChange={([v]) => { awardXP(); setVariableCostPerUnit(v) }}
                min={10}
                max={2000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('breakeven.pricePerUnit')}</Label>
                <span className="font-mono text-muted-foreground">{pricePerUnit.toLocaleString('ru-RU')} руб.</span>
              </div>
              <Slider
                value={[pricePerUnit]}
                onValueChange={([v]) => { awardXP(); setPricePerUnit(v) }}
                min={10}
                max={5000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Макс. объём</Label>
                <span className="font-mono text-muted-foreground">{maxUnits} ед.</span>
              </div>
              <Slider
                value={[maxUnits]}
                onValueChange={([v]) => { awardXP(); setMaxUnits(v) }}
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

      {!isViable && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <div className="font-semibold text-red-600">{t('breakeven.notViable.title')}</div>
              <div className="text-sm text-muted-foreground">
                {t('breakeven.notViable.description')
                  .replace('{price}', pricePerUnit.toLocaleString('ru-RU'))
                  .replace('{variableCost}', variableCostPerUnit.toLocaleString('ru-RU'))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isViable && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Точка безубыточности</div>
                <div className="text-xl font-mono font-bold">{breakEvenUnits.toLocaleString('ru-RU')} ед.</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Выручка в BEP</div>
                <div className="text-xl font-mono font-bold">{breakEvenRevenue.toLocaleString('ru-RU')}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Маржинальность</div>
                <div className="text-xl font-mono font-bold">{contributionMargin.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">Запас прочности</div>
                <div className={`text-xl font-mono font-bold ${marginOfSafety < 20 ? 'text-red-500' : marginOfSafety < 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {marginOfSafety.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">График безубыточности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="quantity" label={{ value: 'Объём (Q)', position: 'insideBottom', offset: -5 }} fontSize={11} />
                    <YAxis label={{ value: 'Руб.', angle: -90, position: 'insideLeft' }} fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString('ru-RU') + ' руб.',
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
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.1}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      name="Постоянные затраты"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      name="Общие затраты"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      name="Выручка"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Прибыль при макс. загрузке</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4">
                  <div className={`text-3xl font-mono font-bold ${profitAtMax > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitAtMax > 0 ? '+' : ''}{profitAtMax.toLocaleString('ru-RU')} руб.
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    При продаже {maxUnits} ед. по {pricePerUnit} руб.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Анализ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>Маржинальная прибыль на ед.:</strong> {(pricePerUnit - variableCostPerUnit).toLocaleString('ru-RU')} руб.
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <strong>Запас прочности:</strong> {marginOfSafety.toFixed(1)}% — {marginOfSafety < 20 ? 'низкий, высокий риск' : marginOfSafety < 40 ? 'умеренный' : 'высокий, бизнес устойчив'}
                </div>
                <div className="p-2 bg-primary/5 rounded">
                  <strong>Окупаемость:</strong> нужно продать {breakEvenUnits} ед. до выхода в прибыль
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
