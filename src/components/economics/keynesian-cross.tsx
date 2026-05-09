'use client'

import { useState, useMemo, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Crosshair, RotateCcw, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function KeynesianCross() {
  const [autonomousSpending, setAutonomousSpending] = useState(200)
  const [mpc, setMpc] = useState(0.75)
  const [taxRate, setTaxRate] = useState(0.2)
  const [mpi, setMpi] = useState(0.15)
  const [govSpending, setGovSpending] = useState(100)
  const [xpAwarded, setXpAwarded] = useState(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const { toast } = useToast()

  const awardXp = useCallback(() => {
    if (!xpAwarded) {
      setXpAwarded(true)
      addModuleInteraction({ moduleId: 'keynesian', action: 'calculate', xpEarned: MODULE_XP['keynesian'] })
    }
  }, [xpAwarded, addModuleInteraction])

  const multiplier = useMemo(() => {
    const denominator = 1 - mpc * (1 - taxRate) + mpi
    return 1 / denominator
  }, [mpc, taxRate, mpi])

  const equilibriumY = useMemo(() => {
    return multiplier * (autonomousSpending + govSpending)
  }, [multiplier, autonomousSpending, govSpending])

  const data = useMemo(() => {
    const maxY = Math.max(equilibriumY * 1.5, 1000)
    const points: Array<{ income: number; aggregateDemand: number; fortyFive: number }> = []
    for (let y = 0; y <= maxY; y += maxY / 60) {
      const aggregateDemand = autonomousSpending + govSpending + mpc * (1 - taxRate) * y + mpi * y
      points.push({
        income: Math.round(y),
        aggregateDemand: Math.round(aggregateDemand),
        fortyFive: Math.round(y),
      })
    }
    return points
  }, [autonomousSpending, govSpending, mpc, taxRate, mpi, equilibriumY])

  const reset = () => {
    setAutonomousSpending(200)
    setMpc(0.75)
    setTaxRate(0.2)
    setMpi(0.15)
    setGovSpending(100)
    toast({ title: 'Сброс', description: 'Параметры возвращены к значениям по умолчанию' })
  }

  const mpcSimple = useMemo(() => mpc * (1 - taxRate), [mpc, taxRate])
  const savingsRate = useMemo(() => 1 - mpcSimple, [mpcSimple])
  const taxRevenue = useMemo(() => taxRate * equilibriumY, [taxRate, equilibriumY])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Кейнсианский крест
          </CardTitle>
          <CardDescription>
            Модель доходов-расходов (Keynesian Cross). Показывает, как совокупный спрос определяет равновесный уровень выпуска.
            Y* = k × (A + G), где k = 1 / (1 - MPC(1-t) + MPI)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="income"
                  label={{ value: 'Доход (Y)', position: 'insideBottom', offset: -5 }}
                  fontSize={12}
                />
                <YAxis
                  label={{ value: 'Расходы', angle: -90, position: 'insideLeft' }}
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'aggregateDemand') return [value.toLocaleString('ru-RU'), 'AD (совокупный спрос)']
                    if (name === 'fortyFive') return [value.toLocaleString('ru-RU'), 'Y = 45°']
                    return [value, name]
                  }}
                  labelFormatter={(label) => `Доход: ${label}`}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'aggregateDemand') return 'AD (совокупный спрос)'
                    if (value === 'fortyFive') return 'Линия 45° (Y = AE)'
                    return value
                  }}
                />
                <ReferenceLine
                  x={Math.round(equilibriumY)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                />
                <ReferenceLine
                  y={Math.round(autonomousSpending + govSpending + mpcSimple * equilibriumY + mpi * equilibriumY)}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                />
                <Area
                  type="monotone"
                  dataKey="fortyFive"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="fortyFive"
                />
                <Line
                  type="monotone"
                  dataKey="aggregateDemand"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  name="aggregateDemand"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Параметры модели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Автономные расходы (A)</Label>
                <span className="font-mono text-muted-foreground">{autonomousSpending}</span>
              </div>
              <Slider
                value={[autonomousSpending]}
                onValueChange={([v]) => { setAutonomousSpending(v); awardXp() }}
                min={50}
                max={500}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Гос. расходы (G)</Label>
                <span className="font-mono text-muted-foreground">{govSpending}</span>
              </div>
              <Slider
                value={[govSpending]}
                onValueChange={([v]) => { setGovSpending(v); awardXp() }}
                min={0}
                max={400}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>MPC (предельная склонность к потреблению)</Label>
                <span className="font-mono text-muted-foreground">{mpc.toFixed(2)}</span>
              </div>
              <Slider
                value={[mpc]}
                onValueChange={([v]) => { setMpc(v); awardXp() }}
                min={0.1}
                max={0.95}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Ставка налога (t)</Label>
                <span className="font-mono text-muted-foreground">{(taxRate * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[taxRate]}
                onValueChange={([v]) => { setTaxRate(v); awardXp() }}
                min={0}
                max={0.5}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>MPI (предельная склонность к импорту)</Label>
                <span className="font-mono text-muted-foreground">{mpi.toFixed(2)}</span>
              </div>
              <Slider
                value={[mpi]}
                onValueChange={([v]) => { setMpi(v); awardXp() }}
                min={0}
                max={0.4}
                step={0.05}
              />
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить параметры
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-4 w-4" />
              Равновесие
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Равновесный выпуск (Y*)</div>
                <div className="text-xl font-mono font-bold">{Math.round(equilibriumY).toLocaleString('ru-RU')}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Мультипликатор (k)</div>
                <div className="text-xl font-mono font-bold">{multiplier.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">MPC с учётом налогов</div>
                <div className="text-xl font-mono font-bold">{mpcSimple.toFixed(3)}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <div className="text-sm text-muted-foreground">Налоговые сборы</div>
                <div className="text-xl font-mono font-bold">{Math.round(taxRevenue).toLocaleString('ru-RU')}</div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-primary/5 rounded-lg text-sm space-y-2">
              <div>
                <strong>Формула:</strong> Y* = k × (A + G)
              </div>
              <div>
                <strong>Мультипликатор:</strong> k = 1 / (1 - MPC(1-t) + MPI) = 1 / (1 - {mpc}×{1 - taxRate} + {mpi}) = {multiplier.toFixed(3)}
              </div>
              <div>
                <strong>Эффект мультипликатора:</strong> рост G на 1 руб. увеличивает Y на {multiplier.toFixed(2)} руб.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
