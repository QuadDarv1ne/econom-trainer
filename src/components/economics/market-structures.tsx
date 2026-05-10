'use client'

import { useState, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
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
  ReferenceDot,
} from 'recharts'
import { BarChart3, TrendingUp, TrendingDown, Info, Users, Building2, Store, ShieldAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type MarketType = 'perfect' | 'monopoly' | 'monopolistic' | 'oligopoly'

interface MarketData {
  quantity: number
  demand: number
  mr: number | null
  mc: number | null
  atc: number | null
}

export function MarketStructures() {
  const [marketType, setMarketType] = useState<MarketType>('perfect')
  const [demandIntercept, setDemandIntercept] = useState(100)
  const [demandSlope, setDemandSlope] = useState(1)
  const [mcConstant, setMcConstant] = useState(20)
  const [fixedCost, setFixedCost] = useState(500)
  const [oligopolyKink, setOligopolyKink] = useState(50)

  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = () => {
    if (!hasEarnedXP) {
      setHasEarnedXP(true)
      addModuleInteraction({ moduleId: 'market-structures', action: 'explore', xpEarned: MODULE_XP['market-structures'] ?? 20 })
    }
  }

  const { toast } = useToast()

  // Generate data based on market type
  const chartData = useMemo((): MarketData[] => {
    const data: MarketData[] = []
    const maxQ = demandIntercept / demandSlope

    for (let q = 1; q <= maxQ; q += Math.max(1, maxQ / 60)) {
      const demandPrice = demandIntercept - demandSlope * q
      let mr: number | null = null
      let mc: number | null = null
      let atc: number | null = null

      if (marketType === 'perfect') {
        // Perfect competition: P = MR = MC (horizontal)
        mr = demandPrice
        mc = mcConstant
        atc = (fixedCost / q) + mcConstant
      } else if (marketType === 'monopoly') {
        // Monopoly: MR = a - 2bq
        mr = demandIntercept - 2 * demandSlope * q
        mc = mcConstant
        atc = (fixedCost / q) + mcConstant
      } else if (marketType === 'monopolistic') {
        // Monopolistic competition: similar to monopoly but with lower barriers
        mr = demandIntercept - 2 * demandSlope * q * 0.8
        mc = mcConstant
        atc = (fixedCost / q) + mcConstant
      } else if (marketType === 'oligopoly') {
        // Oligopoly: kinked demand curve
        if (q <= oligopolyKink) {
          mr = demandIntercept - 1.5 * demandSlope * q
        } else {
          mr = demandIntercept - 3 * demandSlope * q
        }
        mc = mcConstant
        atc = (fixedCost / q) + mcConstant
      }

      data.push({
        quantity: Math.round(q),
        demand: Math.round(demandPrice * 100) / 100,
        mr: mr !== null ? Math.round(mr * 100) / 100 : null,
        mc: mc !== null ? Math.round(mc * 100) / 100 : null,
        atc: atc !== null ? Math.round(atc * 100) / 100 : null,
      })
    }
    return data
  }, [marketType, demandIntercept, demandSlope, mcConstant, fixedCost, oligopolyKink])

  // Calculate equilibrium
  const equilibrium = useMemo(() => {
    let q: number
    let p: number
    let profit: number

    if (marketType === 'perfect') {
      // P = MC
      q = (demandIntercept - mcConstant) / demandSlope
      p = mcConstant
    } else if (marketType === 'monopoly') {
      // MR = MC
      q = (demandIntercept - mcConstant) / (2 * demandSlope)
      p = demandIntercept - demandSlope * q
    } else if (marketType === 'monopolistic') {
      q = (demandIntercept - mcConstant) / (2 * demandSlope * 0.8)
      p = demandIntercept - demandSlope * q
    } else {
      // Oligopoly: MC goes through kink
      q = oligopolyKink
      p = demandIntercept - demandSlope * q
    }

    const totalRevenue = p * q
    const totalCost = fixedCost + mcConstant * q
    profit = totalRevenue - totalCost

    return { q: Math.max(0, q), p: Math.max(0, p), profit }
  }, [marketType, demandIntercept, demandSlope, mcConstant, fixedCost, oligopolyKink])

  // Consumer and producer surplus
  const surpluses = useMemo(() => {
    const { q, p } = equilibrium
    if (q <= 0) return { cs: 0, ps: 0, dwl: 0 }

    // Consumer surplus = 0.5 * (maxPrice - p) * q
    const maxPrice = demandIntercept
    const cs = 0.5 * (maxPrice - p) * q

    let ps: number
    let dwl: number

    if (marketType === 'perfect') {
      // PS = 0 (zero economic profit in long run)
      ps = 0
      dwl = 0
    } else {
      // PS = (p - MC) * q + fixed cost consideration
      ps = (p - mcConstant) * q
      // DWL = 0.5 * (p - MC) * (Qperfect - Qactual)
      const qPerfect = (demandIntercept - mcConstant) / demandSlope
      dwl = 0.5 * (p - mcConstant) * Math.max(0, qPerfect - q)
    }

    return {
      cs: Math.round(cs),
      ps: Math.round(ps),
      dwl: Math.round(dwl),
    }
  }, [equilibrium, demandIntercept, demandSlope, mcConstant, marketType])

  const marketInfo = {
    perfect: {
      title: 'Совершенная конкуренция',
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      features: ['Множество продавцов', 'Однородный продукт', 'Свободный вход/выход', 'Цена = MC', 'Нулевая прибыль (долгосрочно)'],
      efficiency: 'allocative',
    },
    monopoly: {
      title: 'Монополия',
      icon: Building2,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      features: ['Один продавец', 'Уникальный продукт', 'Барьеры входа', 'Цена > MR = MC', 'Положительная прибыль'],
      efficiency: 'none',
    },
    monopolistic: {
      title: 'Монополистическая конкуренция',
      icon: Store,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      features: ['Множество продавцов', 'Дифференцированный продукт', 'Свободный вход/выход', 'Цена > MR = MC', 'Нулевая прибыль (долгосрочно)'],
      efficiency: 'none',
    },
    oligopoly: {
      title: 'Олигополия',
      icon: ShieldAlert,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      features: ['Несколько продавцов', 'Дифференцированный/однородный', 'Барьеры входа', 'Зависимость от конкурентов', 'Возможна коллизия'],
      efficiency: 'none',
    },
  }

  const currentMarket = marketInfo[marketType]
  const MarketIcon = currentMarket.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Рыночные структуры
          </CardTitle>
          <CardDescription>
            Сравнительный анализ совершенной конкуренции, монополии, монополистической конкуренции и олигополии.
            Изучите, как разные структуры влияют на цену, объём и общественное благосостояние.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Market Type Selector */}
      <Tabs value={marketType} onValueChange={(v) => { setMarketType(v as MarketType); awardXP(); }}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="perfect" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Соверш. конкуренция</span>
            <span className="sm:hidden">СК</span>
          </TabsTrigger>
          <TabsTrigger value="monopoly" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Монополия</span>
            <span className="sm:hidden">МП</span>
          </TabsTrigger>
          <TabsTrigger value="monopolistic" className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Моноп. конкуренция</span>
            <span className="sm:hidden">МК</span>
          </TabsTrigger>
          <TabsTrigger value="oligopoly" className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Олигополия</span>
            <span className="sm:hidden">ОЛ</span>
          </TabsTrigger>
        </TabsList>

        {(['perfect', 'monopoly', 'monopolistic', 'oligopoly'] as MarketType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            {/* Market Info Card */}
            <Card className={marketInfo[type].bg}>
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${marketInfo[type].color}`}>
                  {(() => {
                    const Icon = marketInfo[type].icon
                    return <Icon className="h-5 w-5" />
                  })()}
                  {marketInfo[type].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {marketInfo[type].features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className={`h-5 w-5 rounded-full ${marketInfo[type].bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <span className="text-xs font-bold">{i + 1}</span>
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">График рыночного равновесия</CardTitle>
                <CardDescription>
                  {type === 'perfect' ? 'P = MR = MC — цена равна предельным издержкам' :
                   type === 'monopoly' ? 'MR = MC — монополия ограничивает выпуск для максимизации прибыли' :
                   type === 'monopolistic' ? 'MR = MC — похоже на монополию, но с конкуренцией' :
                   'Изломанная кривая спроса — реакция на действия конкурентов'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="quantity"
                        label={{ value: 'Объём (Q)', position: 'insideBottom', offset: -5, fontSize: 12 }}
                        fontSize={11}
                      />
                      <YAxis
                        label={{ value: 'Цена/Издержки', angle: -90, position: 'insideLeft', fontSize: 12 }}
                        fontSize={11}
                        domain={[0, demandIntercept * 1.1]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => {
                          if (name === 'demand') return [value.toFixed(1), 'Спрос (D)']
                          if (name === 'mr') return [value?.toFixed(1), 'Предельная выручка (MR)']
                          if (name === 'mc') return [value?.toFixed(1), 'Предельные издержки (MC)']
                          if (name === 'atc') return [value?.toFixed(1), 'Средние издержки (ATC)']
                          return [value, name]
                        }}
                      />
                      <Legend
                        formatter={(value) => {
                          if (value === 'demand') return 'Спрос (D)'
                          if (value === 'mr') return 'MR'
                          if (value === 'mc') return 'MC'
                          if (value === 'atc') return 'ATC'
                          return value
                        }}
                      />

                      {/* Demand */}
                      <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="demand" />

                      {/* MR (except perfect competition) */}
                      {type !== 'perfect' && (
                        <Line type="monotone" dataKey="mr" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" name="mr" />
                      )}

                      {/* MC */}
                      <Line type="monotone" dataKey="mc" stroke="#ef4444" strokeWidth={2} dot={false} name="mc" />

                      {/* ATC */}
                      <Line type="monotone" dataKey="atc" stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="atc" />

                      {/* Equilibrium point */}
                      {equilibrium.q > 0 && equilibrium.p > 0 && (
                        <ReferenceDot
                          x={Math.round(equilibrium.q)}
                          y={Math.round(equilibrium.p * 100) / 100}
                          r={7}
                          fill="#22c55e"
                          stroke="#fff"
                          strokeWidth={2}
                          label={{
                            value: `E: Q=${Math.round(equilibrium.q)}, P=${equilibrium.p.toFixed(1)}`,
                            position: 'top',
                            fontSize: 11,
                            fill: '#22c55e',
                          }}
                        />
                      )}

                      {/* Reference lines */}
                      {equilibrium.q > 0 && (
                        <ReferenceLine x={Math.round(equilibrium.q)} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
                      )}
                      {equilibrium.p > 0 && (
                        <ReferenceLine y={Math.round(equilibrium.p * 100) / 100} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={1} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Равновесная цена (P*)</div>
                  <div className="text-xl font-mono font-bold text-blue-600">{equilibrium.p.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Равновесный объём (Q*)</div>
                  <div className="text-xl font-mono font-bold text-blue-600">{Math.round(equilibrium.q)}</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Прибыль</div>
                  <div className={`text-xl font-mono font-bold ${equilibrium.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {equilibrium.profit > 0 ? '+' : ''}{Math.round(equilibrium.profit).toLocaleString('ru-RU')}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-200 dark:border-orange-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">Излишек потребителя</div>
                  <div className="text-xl font-mono font-bold text-orange-600">{surpluses.cs.toLocaleString('ru-RU')}</div>
                </CardContent>
              </Card>
            </div>

            {/* Surplus Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Излишек потребителя (CS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Разница между тем, что потребители <strong className="text-foreground">готовы заплатить</strong>,
                    и тем, что они <strong className="text-foreground">фактически платят</strong>.
                  </p>
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded font-mono text-center">
                    CS = ½ × (P<sub>max</sub> − P*) × Q* = {surpluses.cs.toLocaleString('ru-RU')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    Излишек производителя (PS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Разница между тем, что производители <strong className="text-foreground">получают</strong>,
                    и тем, что они <strong className="text-foreground">готовы принять</strong> (MC).
                  </p>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded font-mono text-center">
                    PS = (P* − MC) × Q* = {surpluses.ps.toLocaleString('ru-RU')}
                  </div>
                  {type === 'perfect' && (
                    <p className="text-xs mt-2 text-green-600">
                      При совершенной конкуренции в долгосрочном периоде PS = 0
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-red-500" />
                    Потери общества (DWL)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Потери благосостояния от <strong className="text-foreground">неэффективного распределения</strong> ресурсов.
                    Возникают при отклонении от P = MC.
                  </p>
                  <div className={`p-2 rounded font-mono text-center ${surpluses.dwl > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}>
                    DWL = {surpluses.dwl.toLocaleString('ru-RU')}
                  </div>
                  {type === 'perfect' && (
                    <p className="text-xs mt-2 text-green-600">
                      При совершенной конкуренции DWL = 0 — allocative efficiency!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Параметры модели</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Макс. цена спроса (пересечение с осью)</Label>
                <Badge variant="secondary">{demandIntercept}</Badge>
              </div>
              <Slider value={[demandIntercept]} min={50} max={200} step={5} onValueChange={(v) => { awardXP(); setDemandIntercept(v[0]) }} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Наклон спроса</Label>
                <Badge variant="secondary">{demandSlope.toFixed(1)}</Badge>
              </div>
              <Slider value={[demandSlope]} min={0.5} max={3} step={0.1} onValueChange={(v) => { awardXP(); setDemandSlope(v[0]) }} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Постоянные издержки (MC)</Label>
                <Badge variant="secondary">{mcConstant}</Badge>
              </div>
              <Slider value={[mcConstant]} min={5} max={80} step={5} onValueChange={(v) => { awardXP(); setMcConstant(v[0]) }} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Фиксированные издержки</Label>
                <Badge variant="secondary">{fixedCost}</Badge>
              </div>
              <Slider value={[fixedCost]} min={0} max={2000} step={100} onValueChange={(v) => { awardXP(); setFixedCost(v[0]) }} />
            </div>

            {marketType === 'oligopoly' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Точка излома кривой спроса</Label>
                  <Badge variant="secondary">{oligopolyKink}</Badge>
                </div>
                <Slider value={[oligopolyKink]} min={10} max={100} step={5} onValueChange={(v) => { awardXP(); setOligopolyKink(v[0]) }} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Сравнение рыночных структур</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Характеристика</th>
                  <th className="text-center p-2 text-green-600">Соверш. конкуренция</th>
                  <th className="text-center p-2 text-amber-600">Моноп. конкуренция</th>
                  <th className="text-center p-2 text-purple-600">Олигополия</th>
                  <th className="text-center p-2 text-red-600">Монополия</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Число фирм</td>
                  <td className="text-center p-2">Много</td>
                  <td className="text-center p-2">Много</td>
                  <td className="text-center p-2">Несколько</td>
                  <td className="text-center p-2">Одна</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Продукт</td>
                  <td className="text-center p-2">Однородный</td>
                  <td className="text-center p-2">Дифференцированный</td>
                  <td className="text-center p-2">Однородный/дифф.</td>
                  <td className="text-center p-2">Уникальный</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Контроль над ценой</td>
                  <td className="text-center p-2">Нет</td>
                  <td className="text-center p-2">Небольшой</td>
                  <td className="text-center p-2">Значительный</td>
                  <td className="text-center p-2">Полный</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Барьеры входа</td>
                  <td className="text-center p-2">Отсутствуют</td>
                  <td className="text-center p-2">Низкие</td>
                  <td className="text-center p-2">Высокие</td>
                  <td className="text-center p-2">Очень высокие</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Прибыль (долгоср.)</td>
                  <td className="text-center p-2">Нулевая</td>
                  <td className="text-center p-2">Нулевая</td>
                  <td className="text-center p-2">Положительная</td>
                  <td className="text-center p-2">Положительная</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Эффективность</td>
                  <td className="text-center p-2 text-green-600">Высокая</td>
                  <td className="text-center p-2 text-yellow-600">Избыточные мощности</td>
                  <td className="text-center p-2 text-orange-600">Зависит</td>
                  <td className="text-center p-2 text-red-600">Низкая (DWL {'>'} 0)</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Примеры</td>
                  <td className="text-center p-2">Агрорынок</td>
                  <td className="text-center p-2">Рестораны</td>
                  <td className="text-center p-2">Авто, нефть</td>
                  <td className="text-center p-2">Ж/д, коммуналка</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
