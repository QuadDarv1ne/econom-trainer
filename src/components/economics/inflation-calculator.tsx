'use client'

import { useState, useMemo, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumberLocale } from '@/lib/i18n'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  const { t, locale } = useI18n()
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

    const yearlyData: Array<{ year: number; realValue: number; lostValue: number; purchasingPower: number }> = []
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
    if (rate < 3) return { text: t('inflation.level.low'), variant: 'secondary' as const, color: 'text-green-600' }
    if (rate < 10) return { text: t('inflation.level.moderate'), variant: 'default' as const, color: 'text-yellow-600' }
    if (rate < 50) return { text: t('inflation.level.high'), variant: 'destructive' as const, color: 'text-orange-600' }
    return { text: t('inflation.level.hyper'), variant: 'destructive' as const, color: 'text-red-600' }
  }

  const rate = parseFloat(inflationRate) || 0
  const level = getInflationLevel(rate)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            {t('inflation.title')}
          </CardTitle>
          <CardDescription>
            {t('inflation.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('inflation.initialAmount')}</Label>
              <Input
                type="number"
                placeholder="100 000"
                value={initialAmount}
                onChange={(e) => { setInitialAmount(e.target.value); awardXp() }}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('inflation.annualRate')}</Label>
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
              <Label>{t('inflation.startYear')}</Label>
              <Input
                type="number"
                placeholder="2020"
                value={initialYear}
                onChange={(e) => { setInitialYear(e.target.value); awardXp() }}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('inflation.endYear')}</Label>
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
                <CardDescription>{t('inflation.realValue')}</CardDescription>
                <CardTitle className="text-2xl font-mono">
                  {formatNumberLocale(locale, Math.round(result.realValue))} руб.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('inflation.purchasingPowerDesc').replace('{amount}', formatNumberLocale(locale, parseFloat(initialAmount))).replace('{years}', result.years.toString())}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('inflation.cumulativeInflation')}</CardDescription>
                <CardTitle className="text-2xl font-mono flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  {(result.totalInflation * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('inflation.totalDepreciation').replace('{years}', result.years.toString())}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('inflation.purchasingPower')}</CardDescription>
                <CardTitle className="text-2xl font-mono flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-orange-500" />
                  {result.purchasingPower.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('inflation.remainingAmount')}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('inflation.chartTitle')}</CardTitle>
              <CardDescription>{t('inflation.chartDesc')}</CardDescription>
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
                        if (name === 'realValue') return [formatNumberLocale(locale, value) + ' руб.', t('inflation.tooltip.realValue')]
                        if (name === 'lostValue') return [formatNumberLocale(locale, value) + ' руб.', t('inflation.tooltip.lost')]
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
              <CardTitle className="text-lg">{t('inflation.tableTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t('inflation.table.year')}</th>
                      <th className="text-right p-2">{t('inflation.table.realValue')}</th>
                      <th className="text-right p-2">{t('inflation.table.lost')}</th>
                      <th className="text-right p-2">{t('inflation.table.purchasingPower')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyData.map((row) => (
                      <tr key={row.year} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{row.year}</td>
                        <td className="p-2 text-right font-mono">{formatNumberLocale(locale, row.realValue)} руб.</td>
                        <td className="p-2 text-right font-mono text-red-600">-{formatNumberLocale(locale, row.lostValue)} руб.</td>
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
            {t('inflation.rule70.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('inflation.rule70.description')}</strong>
          </div>
          {rate > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg">
              {t('inflation.rule70.result').replace('{rate}', rate.toString()).replace('{years}', Math.round(70 / rate).toString())}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
