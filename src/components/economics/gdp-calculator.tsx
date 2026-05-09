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

interface GDPComponent {
  name: string
  currentValue: number
  baseValue: number
}

const defaultComponents: GDPComponent[] = [
  { name: 'Потребительские расходы (C)', currentValue: 0, baseValue: 0 },
  { name: 'Инвестиции (I)', currentValue: 0, baseValue: 0 },
  { name: 'Гос. расходы (G)', currentValue: 0, baseValue: 0 },
  { name: 'Экспорт (X)', currentValue: 0, baseValue: 0 },
  { name: 'Импорт (M)', currentValue: 0, baseValue: 0 },
]

export function GDPCalculator() {
  const [components, setComponents] = useState<GDPComponent[]>(defaultComponents)
  const [calculated, setCalculated] = useState(false)
  const [nominalGDP, setNominalGDP] = useState(0)
  const [realGDP, setRealGDP] = useState(0)
  const [deflator, setDeflator] = useState(0)
  const [inflationRate, setInflationRate] = useState(0)
  const addGDPResult = useEconomicsStore((s) => s.addGDPResult)
  const { toast } = useToast()

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
    const c = components[0],
      i = components[1],
      g = components[2],
      x = components[3],
      m = components[4]

    const nominal = c.currentValue + i.currentValue + g.currentValue + x.currentValue - m.currentValue
    const real = c.baseValue + i.baseValue + g.baseValue + x.baseValue - m.baseValue
    const def = real > 0 ? (nominal / real) * 100 : 0
    const infRate = nominal > 0 ? ((nominal - real) / real) * 100 : 0

    setNominalGDP(nominal)
    setRealGDP(real)
    setDeflator(def)
    setInflationRate(infRate)
    setCalculated(true)

    addGDPResult({
      id: Date.now().toString(),
      nominalGDP: nominal,
      realGDP: real,
      deflator: def,
      inflationRate: infRate,
      date: new Date().toISOString(),
    })

    toast({
      title: 'Расчёт выполнен',
      description: `ВВП рассчитан успешно. Дефлятор: ${def.toFixed(1)}`,
    })
  }, [components, addGDPResult, toast])

  const reset = useCallback(() => {
    setComponents(defaultComponents.map((c) => ({ ...c })))
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
    if (inflationRate > 5) return { text: 'Высокая инфляция', variant: 'destructive' as const }
    if (inflationRate > 2) return { text: 'Умеренная инфляция', variant: 'default' as const }
    if (inflationRate > 0) return { text: 'Низкая инфляция', variant: 'secondary' as const }
    if (inflationRate === 0) return { text: 'Стабильность', variant: 'outline' as const }
    return { text: 'Дефляция', variant: 'secondary' as const }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Калькулятор ВВП
          </CardTitle>
          <CardDescription>
            Введите текущие и базовые значения компонентов ВВП для расчёта номинального и реального ВВП, дефлятора и уровня инфляции.
            Формула: ВВП = C + I + G + X - M
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-semibold text-sm text-muted-foreground px-1">
            <div>Компонент</div>
            <div>Текущие цены</div>
            <div>Базовые цены</div>
          </div>

          {components.map((comp, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 rounded-lg bg-muted/50"
            >
              <Label className="font-medium text-sm">{comp.name}</Label>
              <Input
                type="number"
                placeholder="0"
                value={comp.currentValue !== null && comp.currentValue !== undefined ? comp.currentValue : ''}
                onChange={(e) => updateComponent(idx, 'currentValue', e.target.value)}
                className="font-mono"
              />
              <Input
                type="number"
                placeholder="0"
                value={comp.baseValue !== null && comp.baseValue !== undefined ? comp.baseValue : ''}
                onChange={(e) => updateComponent(idx, 'baseValue', e.target.value)}
                className="font-mono"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button onClick={calculate} className="flex-1" size="lg">
              <Calculator className="h-4 w-4 mr-2" />
              Рассчитать ВВП
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Сброс
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculated && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Номинальный ВВП</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {nominalGDP.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ВВП в текущих ценах. Отражает объём производства без корректировки на инфляцию.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Реальный ВВП</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {realGDP.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ВВП в базовых ценах. Корректируется на изменение уровня цен, показывая реальный рост.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Дефлятор ВВП</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {deflator.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Отношение номинального ВВП к реальному. Показывает изменение уровня цен.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>Уровень инфляции</CardDescription>
                {getInflationIcon()}
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-mono">
                  {inflationRate.toFixed(1)}%
                </CardTitle>
                <Badge variant={getInflationLabel().variant}>
                  {getInflationLabel().text}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Темп прироста уровня цен. Положительное значение — инфляция, отрицательное — дефляция.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Формулы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>ВВП по расходам:</strong> Y = C + I + G + NX, где NX = X - M
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Дефлятор ВВП:</strong> D = (Номинальный ВВП / Реальный ВВП) × 100%
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Уровень инфляции:</strong> π = ((Номинальный - Реальный) / Реальный) × 100%
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
