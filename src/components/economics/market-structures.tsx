'use client'

import { useState, useMemo, useRef, memo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ReferenceDot,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Info,
  Users,
  Building2,
  Store,
  ShieldAlert,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'
import { CHART_COLORS } from '@/lib/chart-colors'
import { formatNumberLocale } from '@/lib/i18n'

type MarketType = 'perfect' | 'monopoly' | 'monopolistic' | 'oligopoly'

interface MarketData {
  quantity: number
  demand: number
  mr: number | null
  mc: number | null
  atc: number | null
}

export const MarketStructures = memo(function MarketStructures() {
  const { t, locale } = useI18n()
  const [marketType, setMarketType] = useState<MarketType>('perfect')
  const [demandIntercept, setDemandIntercept] = useState(100)
  const [demandSlope, setDemandSlope] = useState(1)
  const [mcConstant, setMcConstant] = useState(20)
  const [fixedCost, setFixedCost] = useState(500)
  const [oligopolyKink, setOligopolyKink] = useState(50)

  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = () => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({
        moduleId: 'market-structures',
        action: 'explore',
        xpEarned: MODULE_XP['market-structures'] ?? 20,
      })
    }
  }

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
        atc = fixedCost / q + mcConstant
      } else if (marketType === 'monopoly') {
        // Monopoly: MR = a - 2bq
        mr = demandIntercept - 2 * demandSlope * q
        mc = mcConstant
        atc = fixedCost / q + mcConstant
      } else if (marketType === 'monopolistic') {
        // Monopolistic competition: similar to monopoly but with lower barriers
        mr = demandIntercept - 2 * demandSlope * q * 0.8
        mc = mcConstant
        atc = fixedCost / q + mcConstant
      } else if (marketType === 'oligopoly') {
        // Oligopoly: kinked demand curve
        if (q <= oligopolyKink) {
          mr = demandIntercept - 1.5 * demandSlope * q
        } else {
          mr = demandIntercept - 3 * demandSlope * q
        }
        mc = mcConstant
        atc = fixedCost / q + mcConstant
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
    let profit = 0

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
      title: t('market.structure.perfect'),
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      features: [
        t('market.features.multipleSellers'),
        t('market.features.homogeneousProduct'),
        t('market.features.freeEntry'),
        t('market.features.priceEqualsMC'),
        t('market.features.zeroProfitLongRun'),
      ],
      efficiency: 'allocative',
    },
    monopoly: {
      title: t('market.structure.monopoly'),
      icon: Building2,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      features: [
        t('market.features.singleSeller'),
        t('market.features.uniqueProduct'),
        t('market.features.entryBarriers'),
        t('market.features.priceGreaterThanMR'),
        t('market.features.positiveProfit'),
      ],
      efficiency: 'none',
    },
    monopolistic: {
      title: t('market.structure.monopolistic'),
      icon: Store,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      features: [
        t('market.features.multipleSellers'),
        t('market.features.differentiatedProduct'),
        t('market.features.freeEntry'),
        t('market.features.priceGreaterThanMR'),
        t('market.features.zeroProfitLongRun'),
      ],
      efficiency: 'none',
    },
    oligopoly: {
      title: t('market.structure.oligopoly'),
      icon: ShieldAlert,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      features: [
        t('market.features.fewSellers'),
        t('market.features.differentiatedOrHomogeneous'),
        t('market.features.entryBarriers'),
        t('market.features.dependenceOnCompetitors'),
        t('market.features.collusionPossible'),
      ],
      efficiency: 'none',
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('market.title')}
          </CardTitle>
          <CardDescription>{t('market.description')}</CardDescription>
        </CardHeader>
      </Card>

      {/* Market Type Selector */}
      <Tabs
        value={marketType}
        onValueChange={(v) => {
          setMarketType(v as MarketType)
          awardXP()
        }}
      >
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="perfect" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('market.structure.perfect').slice(0, 10)}...
            </span>
            <span className="sm:hidden">{t('market.short.perfect')}</span>
          </TabsTrigger>
          <TabsTrigger value="monopoly" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('market.structure.monopoly')}</span>
            <span className="sm:hidden">{t('market.short.monopoly')}</span>
          </TabsTrigger>
          <TabsTrigger value="monopolistic" className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t('market.structure.monopolistic').slice(0, 10)}...
            </span>
            <span className="sm:hidden">{t('market.short.monopolistic')}</span>
          </TabsTrigger>
          <TabsTrigger value="oligopoly" className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('market.structure.oligopoly')}</span>
            <span className="sm:hidden">{t('market.short.oligopoly')}</span>
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
                      <div
                        className={`h-5 w-5 rounded-full ${marketInfo[type].bg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
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
                <CardTitle className="text-lg">{t('market.chartTitle')}</CardTitle>
                <CardDescription>
                  {type === 'perfect'
                    ? t('market.chartDesc.perfect')
                    : type === 'monopoly'
                      ? t('market.chartDesc.monopoly')
                      : type === 'monopolistic'
                        ? t('market.chartDesc.monopolistic')
                        : t('market.chartDesc.oligopoly')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="quantity"
                        label={{
                          value: t('market.quantityLabel'),
                          position: 'insideBottom',
                          offset: -5,
                          fontSize: 12,
                        }}
                        fontSize={11}
                      />
                      <YAxis
                        label={{
                          value: t('market.priceCost'),
                          angle: -90,
                          position: 'insideLeft',
                          fontSize: 12,
                        }}
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
                          if (name === 'demand') return [value?.toFixed(1), t('market.demand')]
                          if (name === 'mr') return [value?.toFixed(1), t('market.mr')]
                          if (name === 'mc') return [value?.toFixed(1), t('market.mc')]
                          if (name === 'atc') return [value?.toFixed(1), t('market.atc')]
                          return [value, name]
                        }}
                      />
                      <Legend
                        formatter={(value) => {
                          if (value === 'demand') return t('market.demand')
                          if (value === 'mr') return 'MR'
                          if (value === 'mc') return 'MC'
                          if (value === 'atc') return 'ATC'
                          return value
                        }}
                      />

                      {/* Demand */}
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke={CHART_COLORS.primary}
                        strokeWidth={2.5}
                        dot={false}
                        name="demand"
                      />

                      {/* MR (except perfect competition) */}
                      {type !== 'perfect' && (
                        <Line
                          type="monotone"
                          dataKey="mr"
                          stroke={CHART_COLORS.accent}
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="5 5"
                          name="mr"
                        />
                      )}

                      {/* MC */}
                      <Line
                        type="monotone"
                        dataKey="mc"
                        stroke={CHART_COLORS.demand}
                        strokeWidth={2}
                        dot={false}
                        name="mc"
                      />

                      {/* ATC */}
                      <Line
                        type="monotone"
                        dataKey="atc"
                        stroke={CHART_COLORS.purple}
                        strokeWidth={1.5}
                        dot={false}
                        strokeDasharray="3 3"
                        name="atc"
                      />

                      {/* Equilibrium point */}
                      {equilibrium.q > 0 && equilibrium.p > 0 && (
                        <ReferenceDot
                          x={Math.round(equilibrium.q)}
                          y={Math.round(equilibrium.p * 100) / 100}
                          r={7}
                          fill={CHART_COLORS.success}
                          stroke="#fff"
                          strokeWidth={2}
                          label={{
                            value: `E: Q=${Math.round(equilibrium.q)}, P=${equilibrium.p.toFixed(1)}`,
                            position: 'top',
                            fontSize: 11,
                            fill: CHART_COLORS.success,
                          }}
                        />
                      )}

                      {/* Reference lines */}
                      {equilibrium.q > 0 && (
                        <ReferenceLine
                          x={Math.round(equilibrium.q)}
                          stroke={CHART_COLORS.success}
                          strokeDasharray="4 4"
                          strokeWidth={1}
                        />
                      )}
                      {equilibrium.p > 0 && (
                        <ReferenceLine
                          y={Math.round(equilibrium.p * 100) / 100}
                          stroke={CHART_COLORS.success}
                          strokeDasharray="4 4"
                          strokeWidth={1}
                        />
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
                  <div className="text-xs text-muted-foreground">
                    {t('market.equilibriumPrice')}
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-600">
                    {equilibrium.p.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">
                    {t('market.equilibriumQuantity')}
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-600">
                    {Math.round(equilibrium.q)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 dark:border-green-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">{t('market.profit')}</div>
                  <div
                    className={`text-xl font-mono font-bold ${equilibrium.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {equilibrium.profit > 0 ? '+' : ''}
                    {formatNumberLocale(locale, Math.round(equilibrium.profit))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-orange-200 dark:border-orange-900">
                <CardContent className="p-3 text-center">
                  <div className="text-xs text-muted-foreground">{t('market.consumerSurplus')}</div>
                  <div className="text-xl font-mono font-bold text-orange-600">
                    {formatNumberLocale(locale, surpluses.cs)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Surplus Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    {t('market.consumerSurplus')} (CS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">{t('market.csDescription')}</p>
                  <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded font-mono text-center">
                    CS = ½ × (P<sub>max</sub> − P*) × Q* ={' '}
                    {formatNumberLocale(locale, surpluses.cs)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    {t('market.producerSurplus')} (PS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">{t('market.psDescription')}</p>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded font-mono text-center">
                    PS = (P* − MC) × Q* = {formatNumberLocale(locale, surpluses.ps)}
                  </div>
                  {type === 'perfect' && (
                    <p className="text-xs mt-2 text-green-600">
                      {t('market.psPerfectCompetition')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-red-500" />
                    {t('market.dwl')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="mb-2">{t('market.dwlDescription')}</p>
                  <div
                    className={`p-2 rounded font-mono text-center ${surpluses.dwl > 0 ? 'bg-red-50 dark:bg-red-950/30' : 'bg-green-50 dark:bg-green-950/30'}`}
                  >
                    DWL = {formatNumberLocale(locale, surpluses.dwl)}
                  </div>
                  {type === 'perfect' && (
                    <p className="text-xs mt-2 text-green-600">
                      {t('market.dwlPerfectCompetition')}
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
          <CardTitle className="text-lg">{t('market.paramsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('market.maxPrice')}</Label>
                <Badge variant="secondary">{demandIntercept}</Badge>
              </div>
              <Slider
                value={[demandIntercept]}
                min={50}
                max={200}
                step={5}
                onValueChange={(v) => {
                  awardXP()
                  setDemandIntercept(v[0])
                }}
                aria-label={t('market.maxPrice')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('market.demandSlope')}</Label>
                <Badge variant="secondary">{demandSlope.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[demandSlope]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={(v) => {
                  awardXP()
                  setDemandSlope(v[0])
                }}
                aria-label={t('market.demandSlope')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('market.mcConstant')}</Label>
                <Badge variant="secondary">{mcConstant}</Badge>
              </div>
              <Slider
                value={[mcConstant]}
                min={5}
                max={80}
                step={5}
                onValueChange={(v) => {
                  awardXP()
                  setMcConstant(v[0])
                }}
                aria-label={t('market.mcConstant')}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('market.fixedCost')}</Label>
                <Badge variant="secondary">{fixedCost}</Badge>
              </div>
              <Slider
                value={[fixedCost]}
                min={0}
                max={2000}
                step={100}
                onValueChange={(v) => {
                  awardXP()
                  setFixedCost(v[0])
                }}
                aria-label={t('market.fixedCost')}
              />
            </div>

            {marketType === 'oligopoly' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{t('market.kinkPoint')}</Label>
                  <Badge variant="secondary">{oligopolyKink}</Badge>
                </div>
                <Slider
                  value={[oligopolyKink]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(v) => {
                    awardXP()
                    setOligopolyKink(v[0])
                  }}
                  aria-label={t('market.kinkPoint')}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('market.comparison')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Market structures comparison">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">{t('market.characteristic')}</th>
                  <th className="text-center p-2 text-green-600">
                    {t('market.structure.perfect').slice(0, 8)}.
                  </th>
                  <th className="text-center p-2 text-amber-600">
                    {t('market.structure.monopolistic').slice(0, 8)}.
                  </th>
                  <th className="text-center p-2 text-purple-600">
                    {t('market.structure.oligopoly')}
                  </th>
                  <th className="text-center p-2 text-red-600">{t('market.structure.monopoly')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.numFirms')}</td>
                  <td className="text-center p-2">{t('market.table.many')}</td>
                  <td className="text-center p-2">{t('market.table.many')}</td>
                  <td className="text-center p-2">{t('market.table.few')}</td>
                  <td className="text-center p-2">{t('market.table.one')}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.product')}</td>
                  <td className="text-center p-2">{t('market.table.homogeneous')}</td>
                  <td className="text-center p-2">{t('market.table.differentiated')}</td>
                  <td className="text-center p-2">{t('market.table.homogeneousOrDiff')}</td>
                  <td className="text-center p-2">{t('market.table.unique')}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.priceControl')}</td>
                  <td className="text-center p-2">{t('market.table.none')}</td>
                  <td className="text-center p-2">{t('market.table.small')}</td>
                  <td className="text-center p-2">{t('market.table.significant')}</td>
                  <td className="text-center p-2">{t('market.table.full')}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.entryBarriers')}</td>
                  <td className="text-center p-2">{t('market.table.absent')}</td>
                  <td className="text-center p-2">{t('market.table.low')}</td>
                  <td className="text-center p-2">{t('market.table.high')}</td>
                  <td className="text-center p-2">{t('market.table.veryHigh')}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.longRunProfit')}</td>
                  <td className="text-center p-2">{t('market.table.zero')}</td>
                  <td className="text-center p-2">{t('market.table.zero')}</td>
                  <td className="text-center p-2">{t('market.table.positive')}</td>
                  <td className="text-center p-2">{t('market.table.positive')}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">{t('market.table.efficiency')}</td>
                  <td className="text-center p-2 text-green-600">{t('market.table.high')}</td>
                  <td className="text-center p-2 text-yellow-600">
                    {t('market.table.excessCapacity')}
                  </td>
                  <td className="text-center p-2 text-orange-600">{t('market.table.depends')}</td>
                  <td className="text-center p-2 text-red-600">
                    {t('market.table.low')} (DWL {'>'} 0)
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">{t('market.examples')}</td>
                  <td className="text-center p-2">{t('market.examples.agri')}</td>
                  <td className="text-center p-2">{t('market.examples.restaurants')}</td>
                  <td className="text-center p-2">{t('market.examples.auto')}</td>
                  <td className="text-center p-2">{t('market.examples.utility')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
});
