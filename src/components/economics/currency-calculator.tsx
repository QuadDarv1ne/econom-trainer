'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { Coins, ArrowRightLeft, TrendingUp, RotateCcw, Globe, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { formatDate, formatNumber } from '@/lib/i18n'

interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
  rateToUSD: number
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Доллар США', symbol: '$', flag: '🇺🇸', rateToUSD: 1 },
  { code: 'EUR', name: 'Евро', symbol: '€', flag: '🇪🇺', rateToUSD: 1.08 },
  { code: 'GBP', name: 'Фунт стерлингов', symbol: '£', flag: '🇬🇧', rateToUSD: 1.27 },
  { code: 'CNY', name: 'Китайский юань', symbol: '¥', flag: '🇨🇳', rateToUSD: 0.138 },
  { code: 'JPY', name: 'Японская иена', symbol: '¥', flag: '🇯🇵', rateToUSD: 0.0067 },
  { code: 'RUB', name: 'Российский рубль', symbol: '₽', flag: '🇷🇺', rateToUSD: 0.011 },
  { code: 'CHF', name: 'Швейцарский франк', symbol: 'Fr', flag: '🇨🇭', rateToUSD: 1.13 },
  { code: 'CAD', name: 'Канадский доллар', symbol: 'C$', flag: '🇨🇦', rateToUSD: 0.73 },
  { code: 'AUD', name: 'Австралийский доллар', symbol: 'A$', flag: '🇦🇺', rateToUSD: 0.65 },
  { code: 'INR', name: 'Индийская рупия', symbol: '₹', flag: '🇮🇳', rateToUSD: 0.012 },
  { code: 'BRL', name: 'Бразильский реал', symbol: 'R$', flag: '🇧🇷', rateToUSD: 0.18 },
  { code: 'KZT', name: 'Казахстанский тенге', symbol: '₸', flag: '🇰🇿', rateToUSD: 0.0022 },
]

export function CurrencyCalculator() {
  const { t, locale } = useI18n()
  const [amount, setAmount] = useState(100)
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('RUB')
  const [customRates, setCustomRates] = useState<Record<string, number>>({})
  const [volatility, setVolatility] = useState(5)

  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = useCallback(() => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({ moduleId: 'currency', action: 'convert', xpEarned: MODULE_XP['currency'] ?? 15 })
    }
  }, [addModuleInteraction])

  const { toast } = useToast()

  // Effective rates (custom or default)
  const getRate = useCallback((code: string) => customRates[code] ?? CURRENCIES.find((c) => c.code === code)?.rateToUSD ?? 1, [customRates])

  // Cross rate
  const crossRate = useMemo(() => {
    const fromRate = getRate(fromCurrency)
    const toRate = getRate(toCurrency)
    return toRate / fromRate
  }, [fromCurrency, toCurrency, getRate])

  // Converted amount
  const converted = useMemo(() => {
    return amount * crossRate
  }, [amount, crossRate])

  // Generate historical simulation data
  const historyData = useMemo(() => {
    const data: Array<{ day: string; rate: number; ma7: number }> = []
    const baseRate = crossRate
    const days = 30
    let currentRate = baseRate
    const window: number[] = []

    // Seeded pseudo-random for deterministic rendering
    const seed = fromCurrency.charCodeAt(0) * 1000 + toCurrency.charCodeAt(0) * 100 + Math.round(volatility * 10)
    let rngState = seed
    const seededRandom = () => {
      rngState = (rngState * 1664525 + 1013904223) | 0
      return (rngState >>> 0) / 4294967296
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = formatDate(date, locale, { day: 'numeric', month: 'short' })

      // Random walk with mean reversion
      const change = (seededRandom() - 0.5) * (volatility / 100) * baseRate
      currentRate = Math.max(baseRate * 0.8, Math.min(baseRate * 1.2, currentRate + change))

      window.push(currentRate)
      if (window.length > 7) window.shift()
      const ma7 = window.reduce((a, b) => a + b, 0) / window.length

      data.push({
        day: dayStr,
        rate: Math.round(currentRate * 10000) / 10000,
        ma7: Math.round(ma7 * 10000) / 10000,
      })
    }
    return data
  }, [crossRate, volatility, fromCurrency, toCurrency, locale])

  // Cross rates matrix for selected currencies
  const selectedCodes = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'RUB']
  const matrixCurrencies = CURRENCIES.filter((c) => selectedCodes.includes(c.code))

  const reset = () => {
    setAmount(100)
    setFromCurrency('USD')
    setToCurrency('RUB')
    setCustomRates({})
    setVolatility(5)
    toast({ title: t('currency.resetToast'), description: t('currency.resetToastDesc') })
  }

  const swapCurrencies = () => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
    awardXP()
  }

  const fromCurr = CURRENCIES.find((c) => c.code === fromCurrency) ?? CURRENCIES[0]
  const toCurr = CURRENCIES.find((c) => c.code === toCurrency) ?? CURRENCIES[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {t('currency.title')}
          </CardTitle>
          <CardDescription>
            {t('currency.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              {t('currency.converter')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label>{t('currency.amount')}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => { awardXP(); setAmount(Number(e.target.value)) }}
                className="text-lg"
              />
            </div>

            {/* From / To */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('currency.from')}</Label>
                <Select value={fromCurrency} onValueChange={(v) => { awardXP(); setFromCurrency(v) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="mr-2">{c.flag}</span>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="icon" onClick={swapCurrencies} className="mb-0.5">
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('currency.to')}</Label>
                <Select value={toCurrency} onValueChange={(v) => { awardXP(); setToCurrency(v) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="mr-2">{c.flag}</span>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Result */}
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                {formatNumber(amount, locale)} {fromCurr.symbol} ({fromCurr.code}) =
              </div>
              <div className="text-4xl font-bold font-mono text-primary">
                {formatNumber(converted, locale, { maximumFractionDigits: 2 })} {toCurr.symbol}
              </div>
              <div className="text-sm text-muted-foreground">
                1 {fromCurr.code} = {crossRate.toFixed(4)} {toCurr.code}
              </div>
            </div>

            {/* Inverse rate */}
            <div className="text-center text-xs text-muted-foreground">
              {t('currency.rate')}: 1 {toCurr.code} = {crossRate !== 0 ? (1 / crossRate).toFixed(4) : 'N/A'} {fromCurr.code}
            </div>

            <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{t('currency.disclaimer') || 'Rates are illustrative and may not reflect current market values.'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('currency.history')}
            </CardTitle>
            <CardDescription>{t('currency.historyDesc').replace('{volatility}', String(volatility))}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" fontSize={10} tickMargin={5} />
                  <YAxis domain={['auto', 'auto']} fontSize={11} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [value.toFixed(4), t('currency.rate')]}
                  />
                  <ReferenceLine y={crossRate} stroke="#ef4444" strokeDasharray="4 4" label={{ value: t('currency.currentRate'), fontSize: 10, fill: '#ef4444' }} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#rateGradient)"
                    name={t('currency.rate')}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <Label>{t('currency.volatility')}</Label>
                <Badge variant="secondary">{volatility}%</Badge>
              </div>
              <Slider value={[volatility]} min={1} max={20} step={1} onValueChange={(v) => { awardXP(); setVolatility(v[0]) }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cross Rates Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('currency.matrix')}
          </CardTitle>
          <CardDescription>{t('currency.matrixDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">{t('currency.currency')}</th>
                  {matrixCurrencies.map((c) => (
                    <th key={c.code} className="p-2 text-center">
                      <span className="text-lg">{c.flag}</span>
                      <div className="text-xs text-muted-foreground">{c.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixCurrencies.map((row) => (
                  <tr key={row.code} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">
                      <span className="text-lg mr-1">{row.flag}</span>
                      {row.code}
                    </td>
                    {matrixCurrencies.map((col) => {
                      const rate = getRate(col.code) / getRate(row.code)
                      const isDiagonal = row.code === col.code
                      return (
                        <td
                          key={col.code}
                          className={`p-2 text-center font-mono ${isDiagonal ? 'bg-muted/50 text-muted-foreground' : ''}`}
                        >
                          {isDiagonal ? '1.00' : rate.toFixed(3)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Custom Rates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('currency.customRates')}
          </CardTitle>
          <CardDescription>{t('currency.customRatesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CURRENCIES.filter((c) => c.code !== 'USD').map((c) => {
              const current = getRate(c.code)
              const defaultRate = c.rateToUSD
              const isModified = Math.abs(current - defaultRate) > 0.0001
              return (
                <div key={c.code} className={`space-y-2 p-3 rounded-lg border ${isModified ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="font-medium text-sm">{c.code}</span>
                    {isModified && <Badge variant="outline" className="text-[10px]">{t('currency.modified')}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={0.001}
                      value={current}
                      onChange={(e) => {
                        awardXP()
                        setCustomRates((prev) => ({ ...prev, [c.code]: Number(e.target.value) }))
                      }}
                      className="text-sm h-8"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{t('currency.perUSD')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('currency.base')}: {defaultRate.toFixed(3)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {t('currency.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('currency.crossRate')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">{t('currency.crossRate')}</strong> {t('currency.crossRateText')}
            </p>
            <div className="p-2 bg-muted rounded font-mono text-xs">
              {t('currency.crossRateFormula')}
            </div>
            <p>
              {t('currency.crossRateExample')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('currency.volatilityTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">{t('currency.volatilityTitle')}</strong> {t('currency.volatilityText')}
            </p>
            <p>
              {t('currency.volatilityFactors')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('currency.ppp')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">{t('currency.ppp')}</strong> {t('currency.pppText')}
            </p>
            <p>
              {t('currency.pppExample')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
