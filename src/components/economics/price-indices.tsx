'use client'

import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumberLocale } from '@/lib/i18n'
import { Calculator, TrendingUp, Info } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const chartConfig = {
  value: {
    label: 'Значение',
    color: 'hsl(var(--chart-1))',
  },
}

interface Good {
  id: string
  name: string
  basePrice: number
  currentPrice: number
  quantity: number
}

export function PriceIndices() {
  const { t, locale } = useI18n()
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const hasEarnedXPRef = useRef(false)
  const [baseYear, _setBaseYear] = useState(2020)
  const [currentYear, _setCurrentYear] = useState(2024)
  const [goods, setGoods] = useState<Good[]>([
    { id: '1', name: 'Хлеб', basePrice: 30, currentPrice: 35, quantity: 100 },
    { id: '2', name: 'Молоко', basePrice: 60, currentPrice: 75, quantity: 50 },
    { id: '3', name: 'Автомобиль', basePrice: 1000000, currentPrice: 1500000, quantity: 2 },
    { id: '4', name: 'Аренда квартиры', basePrice: 20000, currentPrice: 25000, quantity: 12 },
  ])

  const updateGood = (id: string, field: keyof Good, value: number | string) => {
    setGoods((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    )
  }

  // Расчёт стоимости корзины в базовом году
  const baseBasketCost = useMemo(() => {
    return goods.reduce((sum, g) => sum + g.basePrice * g.quantity, 0)
  }, [goods])

  // Расчёт стоимости корзины в текущем году
  const currentBasketCost = useMemo(() => {
    return goods.reduce((sum, g) => sum + g.currentPrice * g.quantity, 0)
  }, [goods])

  // ИПЦ (Индекс потребительских цен) - метод Ласпейреса
  const cpi = useMemo(() => {
    if (baseBasketCost === 0) return 0
    return (currentBasketCost / baseBasketCost) * 100
  }, [baseBasketCost, currentBasketCost])

  // Инфляция (процентное изменение ИПЦ)
  const inflationRate = useMemo(() => {
    return cpi - 100
  }, [cpi])

  // Дефлятор ВВП (требует расчёт по номинальному и реальному ВВП)
  const [nominalGDP, setNominalGDP] = useState(150000)
  const [realGDP, setRealGDP] = useState(120000)

  const gdpDeflator = useMemo(() => {
    if (realGDP === 0) return 0
    return (nominalGDP / realGDP) * 100
  }, [nominalGDP, realGDP])

  // Расчёт реальной стоимости денег
  const realValue = useMemo(() => {
    if (cpi === 0) return 0
    return (100 / cpi) * 100 // На основе 100 единиц
  }, [cpi])

  // Данные для графика динамики ИПЦ
  const cpiHistory = useMemo(() => {
    type CPIYear = { year: number; cpi: number }
    const years: CPIYear[] = []
    const baseCPI = 100
    for (let year = baseYear; year <= currentYear; year++) {
      const progress = (year - baseYear) / (currentYear - baseYear)
      const cpiValue = baseCPI + inflationRate * progress
      years.push({
        year,
        cpi: parseFloat(cpiValue.toFixed(2)),
      })
    }
    return years
  }, [baseYear, currentYear, inflationRate])

  const handleCalculate = () => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({ moduleId: 'price-indices', action: 'calculate', xpEarned: MODULE_XP['price-indices'] })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('priceIndices.title')}</h2>
          <p className="text-muted-foreground">
            {t('priceIndices.description')}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Calculator className="h-3 w-3" />
          +15 XP
        </Badge>
      </div>

      <Tabs defaultValue="cpi" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cpi">{t('priceIndices.tab.cpi')}</TabsTrigger>
          <TabsTrigger value="deflator">{t('priceIndices.tab.deflator')}</TabsTrigger>
          <TabsTrigger value="inflation">{t('priceIndices.tab.inflation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="cpi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.basketTitle')}</CardTitle>
              <CardDescription>
                {t('priceIndices.basketDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goods.map((good) => (
                  <div key={good.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="md:col-span-2">
                      <Label>{t('priceIndices.good')}</Label>
                      <Input
                        value={good.name}
                        onChange={(e) => updateGood(good.id, 'name', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label>{t('priceIndices.price.base')}</Label>
                      <Input
                        type="number"
                        value={good.basePrice}
                        onChange={(e) => updateGood(good.id, 'basePrice', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label>{t('priceIndices.price.current')}</Label>
                      <Input
                        type="number"
                        value={good.currentPrice}
                        onChange={(e) => updateGood(good.id, 'currentPrice', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label>{t('priceIndices.quantity')}</Label>
                      <Input
                        type="number"
                        value={good.quantity}
                        onChange={(e) => updateGood(good.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-end">
                  <button
                    onClick={handleCalculate}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    {t('priceIndices.calculate')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('priceIndices.basketCost.base')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatNumberLocale(locale, baseBasketCost)} ₽
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('priceIndices.basketCost.current')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatNumberLocale(locale, currentBasketCost)} ₽
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t('priceIndices.cpi')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${inflationRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {cpi.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.cpiDynamics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full">
                <LineChart data={cpiHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="cpi"
                    stroke="var(--color-value)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deflator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.deflatorTitle')}</CardTitle>
              <CardDescription>
                {t('priceIndices.deflatorDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t('priceIndices.nominalGDP')}</Label>
                  <Input
                    type="number"
                    value={nominalGDP}
                    onChange={(e) => setNominalGDP(parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label>{t('priceIndices.realGDP')}</Label>
                  <Input
                    type="number"
                    value={realGDP}
                    onChange={(e) => setRealGDP(parseFloat(e.target.value) || 0)}
                    className="text-sm"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-center">
                <button
                  onClick={handleCalculate}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  {t('priceIndices.calculateBtn')}
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('priceIndices.deflatorTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center text-blue-600 dark:text-blue-400">
                {gdpDeflator.toFixed(2)}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                {gdpDeflator > 100
                  ? `${t('priceIndices.inflation')}: ${(gdpDeflator - 100).toFixed(2)}%`
                  : gdpDeflator < 100
                  ? `${t('priceIndices.deflation')}: ${(100 - gdpDeflator).toFixed(2)}%`
                  : t('priceIndices.stable')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.interpretation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>{t('priceIndices.deflatorTitle')} &gt; 100:</strong> {t('priceIndices.interp.high')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  <strong>{t('priceIndices.deflatorTitle')} &lt; 100:</strong> {t('priceIndices.interp.low')}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  {t('priceIndices.interp.diff')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inflation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.inflationCalc')}</CardTitle>
              <CardDescription>
                {t('priceIndices.devaluationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('priceIndices.cpi')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{cpi.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('priceIndices.inflationRate')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${inflationRate > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {inflationRate.toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{t('priceIndices.realValue')} ₽100</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {realValue.toFixed(2)} ₽
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.devaluation')}</CardTitle>
              <CardDescription>
                {t('priceIndices.devaluationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-lg">
                  {t('priceIndices.baseYear')}:{' '}
                  <strong>1000 ₽</strong>
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {((1000 * cpi) / 100).toFixed(2)} ₽ {t('priceIndices.now')}
                </div>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  {t('priceIndices.devaluationText')
                    .replace('{rate}', inflationRate.toFixed(2))
                    .replace('{diff}', ((1000 * inflationRate) / 100).toFixed(2))}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('priceIndices.formulas')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">
                  <strong>{t('priceIndices.formula.cpi')}</strong>
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">
                  <strong>{t('priceIndices.formula.inflation')}</strong>
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">
                  <strong>{t('priceIndices.formula.realValue')}</strong>
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">
                  <strong>{t('priceIndices.formula.deflator')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
