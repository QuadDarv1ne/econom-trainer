'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEconomicsStore } from '@/store/economics-store'
import { Calculator, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { generateId } from '@/lib/utils'

interface GDPComponent {
  name: string
  currentValue: number
  baseValue: number
}

function createDefaultComponents(): GDPComponent[] {
  return [
    { name: 'gdp.component.consumption', currentValue: 0, baseValue: 0 },
    { name: 'gdp.component.investment', currentValue: 0, baseValue: 0 },
    { name: 'gdp.component.government', currentValue: 0, baseValue: 0 },
    { name: 'gdp.component.export', currentValue: 0, baseValue: 0 },
    { name: 'gdp.component.import', currentValue: 0, baseValue: 0 },
  ]
}

export function calculateGDP(components: GDPComponent[]) {
  const c = components[0],
    i = components[1],
    g = components[2],
    x = components[3],
    m = components[4]

  const nominal = c.currentValue + i.currentValue + g.currentValue + x.currentValue - m.currentValue
  const real = c.baseValue + i.baseValue + g.baseValue + x.baseValue - m.baseValue
  const deflator = real > 0.001 ? (nominal / real) * 100 : 0
  const inflationRate = real > 0.001 ? ((nominal - real) / real) * 100 : 0

  return { nominalGDP: nominal, realGDP: real, deflator, inflationRate }
}

export function GDPCalculator() {
  const [components, setComponents] = useState<GDPComponent[]>(createDefaultComponents)
  const [calculated, setCalculated] = useState(false)
  const [nominalGDP, setNominalGDP] = useState(0)
  const [realGDP, setRealGDP] = useState(0)
  const [deflator, setDeflator] = useState(0)
  const [inflationRate, setInflationRate] = useState(0)
  const addGDPResult = useEconomicsStore((s) => s.addGDPResult)
  const { toast } = useToast()
  const { t, locale } = useI18n()

  const updateComponent = useCallback(
    (index: number, field: 'currentValue' | 'baseValue', value: string) => {
      setComponents((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: parseFloat(value) || 0 }
        return next
      })
      setCalculated(false)
    },
    []
  )

  const calculate = useCallback(() => {
    const { nominalGDP: nominal, realGDP: real, deflator: def, inflationRate: infRate } = calculateGDP(components)

    setNominalGDP(nominal)
    setRealGDP(real)
    setDeflator(def)
    setInflationRate(infRate)
    setCalculated(true)

    addGDPResult({
      id: generateId(),
      nominalGDP: nominal,
      realGDP: real,
      deflator: def,
      inflationRate: infRate,
      date: new Date().toISOString(),
    })

    toast({
      title: t('gdp.toast.title'),
      description: `${t('gdp.toast.description')} ${def.toFixed(1)}`,
    })
  }, [components, addGDPResult, toast, t])

  const reset = useCallback(() => {
    setComponents(createDefaultComponents())
    setCalculated(false)
    setNominalGDP(0)
    setRealGDP(0)
    setDeflator(0)
    setInflationRate(0)
  }, [])

  const getInflationIcon = () => {
    if (inflationRate > 0) return <TrendingUp className="h-5 w-5 text-red-500" />
    if (inflationRate < 0) return <TrendingDown className="h-5 w-5 text-green-500" />
    return <Minus className="h-5 w-5 text-yellow-500" />
  }

  const getInflationLabel = () => {
    if (inflationRate > 5) return { key: 'gdp.inflation.high', variant: 'destructive' as const }
    if (inflationRate > 2) return { key: 'gdp.inflation.moderate', variant: 'default' as const }
    if (inflationRate > 0) return { key: 'gdp.inflation.low', variant: 'secondary' as const }
    if (inflationRate === 0) return { key: 'gdp.inflation.stable', variant: 'outline' as const }
    return { key: 'gdp.inflation.deflation', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('gdp.title')}
          </CardTitle>
          <CardDescription>
            {t('gdp.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold text-sm text-muted-foreground px-1">
            <div>{t('gdp.component')}</div>
            <div>{t('gdp.currentPrices')}</div>
            <div>{t('gdp.basePrices')}</div>
          </div>

          {components.map((comp, idx) => {
            const currentId = `gdp-current-${idx}`
            const baseId = `gdp-base-${idx}`
            return (
            <div
              key={comp.name}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 rounded-lg bg-muted/50"
            >
              <Label htmlFor={currentId} className="font-medium text-sm">{t(comp.name)}</Label>
              <Input
                id={currentId}
                type="number"
                placeholder="0"
                value={comp.currentValue !== null && comp.currentValue !== undefined ? comp.currentValue : ''}
                onChange={(e) => updateComponent(idx, 'currentValue', e.target.value)}
                className="font-mono"
              />
              <Input
                id={baseId}
                type="number"
                placeholder="0"
                value={comp.baseValue !== null && comp.baseValue !== undefined ? comp.baseValue : ''}
                onChange={(e) => updateComponent(idx, 'baseValue', e.target.value)}
                className="font-mono"
                aria-label={t('gdp.basePrices')}
              />
            </div>
            )
          })}

          <div className="flex gap-3 pt-2">
            <Button onClick={calculate} className="flex-1" size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              {t('gdp.calculate')}
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('gdp.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculated && (
        <div aria-live="polite" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>{t('gdp.nominal')}</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {nominalGDP.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('gdp.tooltip.nominal')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>{t('gdp.real')}</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {realGDP.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('gdp.tooltip.real')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>{t('gdp.deflator')}</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {deflator.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('gdp.tooltip.deflator')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{t('gdp.inflation')}</CardDescription>
                {getInflationIcon()}
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-mono">
                  {inflationRate.toFixed(1)}%
                </CardTitle>
                <Badge variant={getInflationLabel().variant}>
                  {t(getInflationLabel().key)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('gdp.tooltip.inflation')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('gdp.formulas')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('gdp.formula.expenses')}
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('gdp.formula.deflator')}
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('gdp.formula.inflation')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
