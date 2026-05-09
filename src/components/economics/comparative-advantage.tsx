'use client'

import { useState, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Globe, RotateCcw, Info, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CountryData {
  name: string
  goodA: number // hours per unit
  goodB: number
}

export function ComparativeAdvantage() {
  const [country1, setCountry1] = useState<CountryData>({ name: 'Страна А', goodA: 2, goodB: 4 })
  const [country2, setCountry2] = useState<CountryData>({ name: 'Страна Б', goodA: 6, goodB: 6 })
  const [showResult, setShowResult] = useState(false)
  const { toast } = useToast()

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const analysis = useMemo(() => {
    // Opportunity cost: how many B per 1 A, and how many A per 1 B
    const c1OcA = country1.goodA / country1.goodB // cost of A in terms of B
    const c1OcB = country1.goodB / country1.goodA // cost of B in terms of A
    const c2OcA = country2.goodA / country2.goodB
    const c2OcB = country2.goodB / country2.goodA

    const advA = c1OcA < c2OcA ? country1.name : c1OcA > c2OcA ? country2.name : 'Нет преимущества'
    const advB = c1OcB < c2OcB ? country1.name : c1OcB > c2OcB ? country2.name : 'Нет преимущества'

    // Absolute advantage
    const absAdvA = country1.goodA < country2.goodA ? country1.name : country1.goodA > country2.goodA ? country2.name : 'Нет'
    const absAdvB = country1.goodB < country2.goodB ? country1.name : country1.goodB > country2.goodB ? country2.name : 'Нет'

    // Gains from trade (specialization)
    // Assume each country has 24 hours
    const hours = 24
    const c1_before_A = hours / (country1.goodA + country1.goodB) * 0.5 // split equally
    const c1_before_B = hours / (country1.goodA + country1.goodB) * 0.5

    // Before trade: each produces both
    const c1ProdA_before = Math.floor(hours / 2 / country1.goodA * 10) / 10
    const c1ProdB_before = Math.floor(hours / 2 / country1.goodB * 10) / 10
    const c2ProdA_before = Math.floor(hours / 2 / country2.goodA * 10) / 10
    const c2ProdB_before = Math.floor(hours / 2 / country2.goodB * 10) / 10

    // After trade: each specializes in comparative advantage good
    const c1SpecializesA = c1OcA < c2OcA
    const c1ProdA_after = c1SpecializesA ? Math.floor(hours / country1.goodA * 10) / 10 : 0
    const c1ProdB_after = !c1SpecializesA ? Math.floor(hours / country1.goodB * 10) / 10 : 0
    const c2ProdA_after = !c1SpecializesA ? Math.floor(hours / country2.goodA * 10) / 10 : 0
    const c2ProdB_after = c1SpecializesA ? Math.floor(hours / country2.goodB * 10) / 10 : 0

    const chartData = [
      {
        name: `${country1.name} (до)`,
        'Товар A': c1ProdA_before,
        'Товар B': c1ProdB_before,
      },
      {
        name: `${country1.name} (после)`,
        'Товар A': c1ProdA_after,
        'Товар B': c1ProdB_after,
      },
      {
        name: `${country2.name} (до)`,
        'Товар A': c2ProdA_before,
        'Товар B': c2ProdB_before,
      },
      {
        name: `${country2.name} (после)`,
        'Товар A': c2ProdA_after,
        'Товар B': c2ProdB_after,
      },
    ]

    const totalA_before = c1ProdA_before + c2ProdA_before
    const totalB_before = c1ProdB_before + c2ProdB_before
    const totalA_after = c1ProdA_after + c2ProdA_after
    const totalB_after = c1ProdB_after + c2ProdB_after

    return {
      c1OcA, c1OcB, c2OcA, c2OcB,
      advA, advB, absAdvA, absAdvB,
      chartData,
      totalA_before, totalB_before,
      totalA_after, totalB_after,
      c1SpecializesA,
      c1ProdA_before, c1ProdB_before,
      c2ProdA_before, c2ProdB_before,
      c1ProdA_after, c1ProdB_after,
      c2ProdA_after, c2ProdB_after,
    }
  }, [country1, country2])

  const reset = () => {
    setCountry1({ name: 'Страна А', goodA: 2, goodB: 4 })
    setCountry2({ name: 'Страна Б', goodA: 6, goodB: 6 })
    setShowResult(false)
    toast({ title: 'Сброс', description: 'Параметры возвращены к значениям по умолчанию' })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Сравнительное преимущество
          </CardTitle>
          <CardDescription>
            Модель Рикардо: две страны, два товара. Введите затраты труда (часов на единицу продукции) 
            и узнайте, кто имеет сравнительное преимущество и какие выгоды даёт торговля.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Country A */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{country1.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Товар A (час/ед.)</Label>
                  <Input
                    type="number"
                    value={country1.goodA || ''}
                    onChange={(e) => {
                      setCountry1({ ...country1, goodA: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Товар B (час/ед.)</Label>
                  <Input
                    type="number"
                    value={country1.goodB || ''}
                    onChange={(e) => {
                      setCountry1({ ...country1, goodB: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Country B */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{country2.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Товар A (час/ед.)</Label>
                  <Input
                    type="number"
                    value={country2.goodA || ''}
                    onChange={(e) => {
                      setCountry2({ ...country2, goodA: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Товар B (час/ед.)</Label>
                  <Input
                    type="number"
                    value={country2.goodB || ''}
                    onChange={(e) => {
                      setCountry2({ ...country2, goodB: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => { setShowResult(true); addModuleInteraction({ moduleId: 'comparative', action: 'calculate', xpEarned: MODULE_XP['comparative'] }) }} className="flex-1" size="lg">
              <Globe className="h-4 w-4 mr-2" />
              Рассчитать преимущество
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResult && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Альтернативные издержки</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{country1.name}:</strong> 1A = {analysis.c1OcA.toFixed(2)}B, 1B = {analysis.c1OcB.toFixed(2)}A
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{country2.name}:</strong> 1A = {analysis.c2OcA.toFixed(2)}B, 1B = {analysis.c2OcB.toFixed(2)}A
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Преимущества</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>Абсолютные:</strong> A — {analysis.absAdvA}, B — {analysis.absAdvB}
                </div>
                <div className="p-2 bg-primary/5 rounded">
                  <strong>Сравнительные:</strong> A — {analysis.advA}, B — {analysis.advB}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Выгоды специализации (24 часа)</CardTitle>
              <CardDescription>
                {analysis.c1SpecializesA
                  ? `${country1.name} специализируется на A, ${country2.name} — на B`
                  : `${country1.name} специализируется на B, ${country2.name} — на A`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Товар A" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Товар B" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-lg text-sm space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Итоговый выигрыш от торговли:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-background rounded">
                    Товар A: {analysis.totalA_before.toFixed(1)} → {analysis.totalA_after.toFixed(1)} ед.
                    {analysis.totalA_after > analysis.totalA_before && (
                      <Badge variant="default" className="ml-2 text-xs">+{(analysis.totalA_after - analysis.totalA_before).toFixed(1)}</Badge>
                    )}
                  </div>
                  <div className="p-2 bg-background rounded">
                    Товар B: {analysis.totalB_before.toFixed(1)} → {analysis.totalB_after.toFixed(1)} ед.
                    {analysis.totalB_after > analysis.totalB_before && (
                      <Badge variant="default" className="ml-2 text-xs">+{(analysis.totalB_after - analysis.totalB_before).toFixed(1)}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Теория сравнительного преимущества
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Принцип:</strong> Страна имеет сравнительное преимущество в производстве товара, 
                если её альтернативные издержки производства этого товара ниже, чем у другой страны. 
                Даже если страна менее эффективна в абсолютном смысле (не имеет абсолютного преимущества ни в одном товаре), 
                она всё равно может выиграть от торговли, специализируясь на товаре с меньшими альтернативными издержками.
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>Альтернативные издержки:</strong> Кол-во единиц товара B, от которых нужно отказаться, 
                чтобы произвести 1 единицу товара A. OC(A) = Затраты на A / Затраты на B.
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
