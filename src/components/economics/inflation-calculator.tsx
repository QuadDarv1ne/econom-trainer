'use client'

import { useState, useMemo, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Landmark, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'

export function InflationCalculator() {
  const [initialAmount, setInitialAmount] = useState('100000')
  const [initialYear, setInitialYear] = useState('2020')
  const [finalYear, setFinalYear] = useState('2025')
  const [inflationRate, setInflationRate] = useState('7')
  const [xpAwarded, setXpAwarded] = useState(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const awardXp = useCallback(() => {
    if (!xpAwarded) {
      setXpAwarded(true)
      addModuleInteraction({ moduleId: 'inflation', action: 'calculate', xpEarned: MODULE_XP['inflation'] })
    }
  }, [xpAwarded, addModuleInteraction])

  const result = useMemo(() => {
    const amount = parseFloat(initialAmount)
    const rate = parseFloat(inflationRate) / 100
    const startYear = parseInt(initialYear)
    const endYear = parseInt(finalYear)

    if (isNaN(amount) || isNaN(rate) || isNaN(startYear) || isNaN(endYear) || endYear <= startYear) {
      return null
    }

    const years = endYear - startYear
    const realValue = amount / Math.pow(1 + rate, years)
    const totalInflation = Math.pow(1 + rate, years) - 1
    const purchasingPower = (1 / Math.pow(1 + rate, years)) * 100

    const yearlyData = []
    for (let y = 0; y <= years; y++) {
      const currentValue = amount / Math.pow(1 + rate, y)
      const lostValue = amount - currentValue
      yearlyData.push({
        year: startYear + y,
        realValue: Math.round(currentValue),
        lostValue: Math.round(lostValue),
        purchasingPower: Math.round((1 / Math.pow(1 + rate, y)) * 100),
      })
    }

    return {
      realValue,
      totalInflation,
      purchasingPower,
      years,
      yearlyData,
    }
  }, [initialAmount, initialYear, finalYear, inflationRate])

  const getInflationLevel = (rate: number) => {
    if (rate < 3) return { text: 'Низкая', variant: 'secondary' as const, color: 'text-green-600' }
    if (rate < 10) return { text: 'Умеренная', variant: 'default' as const, color: 'text-yellow-600' }
    if (rate < 50) return { text: 'Высокая', variant: 'destructive' as const, color: 'text-orange-600' }
    return { text: 'Гиперинфляция', variant: 'destructive' as const, color: 'text-red-600' }
  }

  const rate = parseFloat(inflationRate) || 0
  const level = getInflationLevel(rate)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Калькулятор инфляции
          </CardTitle>
          <CardDescription>
            Рассчитайте, как инфляция обесценивает деньги с течением времени. 
            Увидите реальную покупательную способность вашей суммы через N лет.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Начальная сумма (руб.)</Label>
              <Input
                type="number"
                placeholder="100 000"
                value={initialAmount}
                onChange={(e) => { setInitialAmount(e.target.value); awardXp() }}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Годовая инфляция (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="7"
                  value={inflationRate}
                  onChange={(e) => { setInflationRate(e.target.value); awardXp() }}
                  className="font-mono"
                />
                <Badge variant={level.variant} className="shrink-0">
                  {level.text}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Начальный год</Label>
              <Input
                type="number"
                placeholder="2020"
                value={initialYear}
                onChange={(e) => { setInitialYear(e.target.value); awardXp() }}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Конечный год</Label>
              <Input
                type="number"
                placeholder="2025"
                value={finalYear}
                onChange={(e) => { setFinalYear(e.target.value); awardXp() }}
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Реальная стоимость</CardDescription>
                <CardTitle className="text-2xl font-mono">
                  {Math.round(result.realValue).toLocaleString('ru-RU')} руб.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Покупательная способность {parseFloat(initialAmount).toLocaleString('ru-RU')} руб. через {result.years} лет
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Кумулятивная инфляция</CardDescription>
                <CardTitle className="text-2xl font-mono flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  {(result.totalInflation * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Общее обесценение за {result.years} лет
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Покупательная способность</CardDescription>
                <CardTitle className="text-2xl font-mono flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  {result.purchasingPower.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  От начальной суммы останется
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Обесценение по годам</CardTitle>
              <CardDescription>Как меняется покупательная способность с течением времени</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.yearlyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="year" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'realValue') return [value.toLocaleString('ru-RU') + ' руб.', 'Реальная стоимость']
                        if (name === 'lostValue') return [value.toLocaleString('ru-RU') + ' руб.', 'Потеряно']
                        return [value, name]
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="realValue"
                      stackId="1"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.3}
                      name="realValue"
                    />
                    <Area
                      type="monotone"
                      dataKey="lostValue"
                      stackId="1"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      name="lostValue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Таблица по годам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Год</th>
                      <th className="text-right p-2">Реальная стоимость</th>
                      <th className="text-right p-2">Потеряно</th>
                      <th className="text-right p-2">Покуп. способность</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyData.map((row) => (
                      <tr key={row.year} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{row.year}</td>
                        <td className="p-2 text-right font-mono">{row.realValue.toLocaleString('ru-RU')} руб.</td>
                        <td className="p-2 text-right font-mono text-red-600">-{row.lostValue.toLocaleString('ru-RU')} руб.</td>
                        <td className="p-2 text-right font-mono">{row.purchasingPower}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Правило 70
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Правило 70:</strong> Чтобы узнать, за сколько лет цены удвоятся при данной инфляции, 
            разделите 70 на годовой процент инфляции.
          </div>
          {rate > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg">
              При инфляции {rate}% цены удвоятся примерно за <strong>{Math.round(70 / rate)} лет</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
