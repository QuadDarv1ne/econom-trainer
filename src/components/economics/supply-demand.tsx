'use client'

import { useState, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { ArrowRightLeft, Info } from 'lucide-react'

interface Equilibrium {
  price: number
  quantity: number
}

export function SupplyDemand() {
  const [demandIntercept, setDemandIntercept] = useState(100)
  const [demandSlope, setDemandSlope] = useState(1)
  const [supplyIntercept, setSupplyIntercept] = useState(10)
  const [supplySlope, setSupplySlope] = useState(0.8)
  const [demandShift, setDemandShift] = useState(0)
  const [supplyShift, setSupplyShift] = useState(0)

  // XP tracking — award once per session on first slider change
  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = () => {
    if (!hasEarnedXP) {
      setHasEarnedXP(true)
      addModuleInteraction({ moduleId: 'supply-demand', action: 'interact', xpEarned: MODULE_XP['supply-demand'] })
    }
  }

  const generateData = useMemo(() => {
    const data = []
    const maxQ = 120
    for (let q = 0; q <= maxQ; q += 2) {
      const demandPrice = (demandIntercept + demandShift) - demandSlope * q
      const supplyPrice = (supplyIntercept + supplyShift) + supplySlope * q
      if (demandPrice >= 0 && supplyPrice <= 150) {
        data.push({
          quantity: q,
          demand: Math.max(0, demandPrice),
          supply: supplyPrice,
        })
      }
    }
    return data
  }, [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift])

  const equilibrium: Equilibrium = useMemo(() => {
    const eqQ =
      ((demandIntercept + demandShift) - (supplyIntercept + supplyShift)) /
      (demandSlope + supplySlope)
    const eqP = (demandIntercept + demandShift) - demandSlope * eqQ
    return {
      price: Math.max(0, eqP),
      quantity: Math.max(0, eqQ),
    }
  }, [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift])

  const getScenarioDescription = () => {
    const scenarios: string[] = []
    if (demandShift > 0) scenarios.push('Спрос вырос (кривая сместилась вправо)')
    else if (demandShift < 0) scenarios.push('Спрос упал (кривая сместилась влево)')
    if (supplyShift > 0) scenarios.push('Предложение выросло (кривая сместилась вправо)')
    else if (supplyShift < 0) scenarios.push('Предложение упало (кривая сместилась влево)')
    if (scenarios.length === 0) return 'Исходное равновесие — рынок сбалансирован'
    return scenarios.join('; ')
  }

  const getEffectOnPrice = () => {
    if (demandShift > 0 && supplyShift < 0) return { text: 'Цена растёт', variant: 'destructive' as const }
    if (demandShift < 0 && supplyShift > 0) return { text: 'Цена падает', variant: 'secondary' as const }
    if (demandShift > 0 || supplyShift < 0) return { text: 'Давление вверх', variant: 'default' as const }
    if (demandShift < 0 || supplyShift > 0) return { text: 'Давление вниз', variant: 'secondary' as const }
    return { text: 'Стабильно', variant: 'outline' as const }
  }

  const getEffectOnQuantity = () => {
    if (demandShift > 0 && supplyShift > 0) return { text: 'Объём растёт', variant: 'default' as const }
    if (demandShift < 0 && supplyShift < 0) return { text: 'Объём падает', variant: 'destructive' as const }
    if (demandShift !== 0 && supplyShift === 0) return { text: 'Объём меняется', variant: 'secondary' as const }
    if (supplyShift !== 0 && demandShift === 0) return { text: 'Объём меняется', variant: 'secondary' as const }
    return { text: 'Стабильно', variant: 'outline' as const }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Спрос и предложение
          </CardTitle>
          <CardDescription>
            Используйте ползунки для сдвига кривых спроса и предложения. Наблюдайте, как меняется равновесная цена и объём.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={generateData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="quantity"
                  label={{ value: 'Объём (Q)', position: 'insideBottom', offset: -5 }}
                  fontSize={12}
                />
                <YAxis
                  label={{ value: 'Цена (P)', angle: -90, position: 'insideLeft' }}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    value.toFixed(1),
                    name === 'demand' ? 'Спрос' : 'Предложение',
                  ]}
                  labelFormatter={(label) => `Объём: ${label}`}
                />
                <Legend
                  formatter={(value) => (value === 'demand' ? 'Спрос (D)' : 'Предложение (S)')}
                />
                <ReferenceLine
                  x={equilibrium.quantity}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                />
                <ReferenceLine
                  y={equilibrium.price}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={false}
                  name="demand"
                />
                <Line
                  type="monotone"
                  dataKey="supply"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  name="supply"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Параметры кривых</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Наклон спроса (крутизна)</Label>
                <span className="font-mono text-muted-foreground">{demandSlope.toFixed(1)}</span>
              </div>
              <Slider
                value={[demandSlope]}
                onValueChange={([v]) => { awardXP(); setDemandSlope(v) }}
                min={0.2}
                max={3}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Наклон предложения (крутизна)</Label>
                <span className="font-mono text-muted-foreground">{supplySlope.toFixed(1)}</span>
              </div>
              <Slider
                value={[supplySlope]}
                onValueChange={([v]) => { awardXP(); setSupplySlope(v) }}
                min={0.2}
                max={3}
                step={0.1}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Сдвиги кривых</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Сдвиг спроса</Label>
                <span className="font-mono text-muted-foreground">
                  {demandShift > 0 ? '+' : ''}
                  {demandShift}
                </span>
              </div>
              <Slider
                value={[demandShift]}
                onValueChange={([v]) => { awardXP(); setDemandShift(v) }}
                min={-40}
                max={40}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Сдвиг предложения</Label>
                <span className="font-mono text-muted-foreground">
                  {supplyShift > 0 ? '+' : ''}
                  {supplyShift}
                </span>
              </div>
              <Slider
                value={[supplyShift]}
                onValueChange={([v]) => { awardXP(); setSupplyShift(v) }}
                min={-40}
                max={40}
                step={5}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            Равновесие рынка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Равн. цена (P*)</div>
              <div className="text-xl font-mono font-bold">{equilibrium.price.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">Равн. объём (Q*)</div>
              <div className="text-xl font-mono font-bold">{equilibrium.quantity.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">Эффект на цену</div>
              <Badge variant={getEffectOnPrice().variant}>{getEffectOnPrice().text}</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">Эффект на объём</div>
              <Badge variant={getEffectOnQuantity().variant}>{getEffectOnQuantity().text}</Badge>
            </div>
          </div>
          <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm">
            {getScenarioDescription()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
