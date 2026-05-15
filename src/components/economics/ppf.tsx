'use client'

import { useState, useCallback, useMemo } from 'react'
import { useI18n } from '@/lib/i18n-provider'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'
import { ArrowLeftRight, Info, Zap, TrendingUp } from 'lucide-react'

interface PPFPoint {
  a: number
  b: number
  linearB: number
}

export function PPFCurve() {
  const { t } = useI18n()
  const [goodAName, setGoodAName] = useState('Масло')
  const [goodBName, setGoodBName] = useState('Пушки')
  const [maxA, setMaxA] = useState(100)
  const [maxB, setMaxB] = useState(80)
  const [efficiency, setEfficiency] = useState(1.0)
  const [position, setPosition] = useState(50)
  const [isLinear, setIsLinear] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const awardSliderXp = useCallback(() => {
    if (!xpAwarded) {
      setXpAwarded(true)
      addModuleInteraction({ moduleId: 'ppf', action: 'calculate', xpEarned: MODULE_XP['ppf'] })
    }
  }, [xpAwarded, addModuleInteraction])

  // Generate PPF data points
  const ppfData: PPFPoint[] = useMemo(() => {
    const data: PPFPoint[] = []
    const step = Math.max(1, Math.round(maxA / 100))
    for (let a = 0; a <= maxA; a += step) {
      const ratio = a / maxA
      const concaveB = maxB * Math.pow(Math.max(0, 1 - Math.pow(ratio, efficiency)), 1 / efficiency)
      const linearB = maxB * (1 - ratio)
      data.push({
        a,
        b: isLinear ? linearB : concaveB,
        linearB,
      })
    }
    // Ensure the last point is exactly at maxA
    if (data.length > 0 && data[data.length - 1].a !== maxA) {
      const linearB = 0
      data.push({ a: maxA, b: 0, linearB })
    }
    return data
  }, [maxA, maxB, efficiency, isLinear])

  // Calculate current point on the PPF based on position slider
  const currentPoint = useMemo(() => {
    const currentA = (position / 100) * maxA
    const ratio = currentA / maxA
    const concaveB = maxB * Math.pow(Math.max(0, 1 - Math.pow(ratio, efficiency)), 1 / efficiency)
    const linearB = maxB * (1 - ratio)
    return {
      a: currentA,
      b: isLinear ? linearB : concaveB,
      linearB,
    }
  }, [position, maxA, maxB, efficiency, isLinear])

  // Calculate MRT (Marginal Rate of Transformation) = |dB/dA|
  const mrt = useMemo(() => {
    const delta = 0.01
    const a1 = currentPoint.a
    const a2 = Math.min(maxA, a1 + delta)
    const ratio1 = a1 / maxA
    const ratio2 = a2 / maxA

    let b1: number, b2: number
    if (isLinear) {
      b1 = maxB * (1 - ratio1)
      b2 = maxB * (1 - ratio2)
    } else {
      b1 = maxB * Math.pow(Math.max(0, 1 - Math.pow(ratio1, efficiency)), 1 / efficiency)
      b2 = maxB * Math.pow(Math.max(0, 1 - Math.pow(ratio2, efficiency)), 1 / efficiency)
    }

    const db = b2 - b1
    const da = a2 - a1
    return da !== 0 ? Math.abs(db / da) : 0
  }, [currentPoint.a, maxA, maxB, efficiency, isLinear])

  // Opportunity cost of one more unit of A in terms of B
  const opportunityCost = mrt

  // Area data for shading inside PPF
  const areaData = useMemo(() => {
    const data: { a: number; b: number }[] = []
    const step = Math.max(1, Math.round(maxA / 60))
    for (let a = 0; a <= maxA; a += step) {
      const ratio = a / maxA
      const concaveB = maxB * Math.pow(Math.max(0, 1 - Math.pow(ratio, efficiency)), 1 / efficiency)
      const linearB = maxB * (1 - ratio)
      data.push({ a, b: isLinear ? linearB : concaveB })
    }
    return data
  }, [maxA, maxB, efficiency, isLinear])

  // Preset scenarios
  const handleEconomicGrowth = useCallback(() => {
    setMaxA(140)
    setMaxB(110)
    setEfficiency(1.0)
    setIsLinear(false)
    setPosition(50)
    addModuleInteraction({ moduleId: 'ppf', action: 'calculate', xpEarned: MODULE_XP['ppf'] })
  }, [addModuleInteraction])

  const handleTechBreakthrough = useCallback(() => {
    setMaxA(100)
    setMaxB(130)
    setEfficiency(1.0)
    setIsLinear(false)
    setPosition(50)
    addModuleInteraction({ moduleId: 'ppf', action: 'calculate', xpEarned: MODULE_XP['ppf'] })
  }, [addModuleInteraction])

  const handleReset = useCallback(() => {
    setGoodAName('Масло')
    setGoodBName('Пушки')
    setMaxA(100)
    setMaxB(80)
    setEfficiency(1.0)
    setPosition(50)
    setIsLinear(false)
  }, [])

  // Theory cards data
  const theoryCards = [
    {
      title: t('ppf.theory.whatIs'),
      icon: <Info className="h-4 w-4" />,
      content: t('ppf.theory.whatIsContent'),
    },
    {
      title: t('ppf.theory.increasingCost'),
      icon: <ArrowLeftRight className="h-4 w-4" />,
      content: t('ppf.theory.increasingCostContent'),
    },
    {
      title: t('ppf.theory.growth'),
      icon: <TrendingUp className="h-4 w-4" />,
      content: t('ppf.theory.growthContent'),
    },
    {
      title: t('ppf.theory.efficiency'),
      icon: <Zap className="h-4 w-4" />,
      content: t('ppf.theory.efficiencyContent'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main PPF Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            {t('ppf.title')}
          </CardTitle>
          <CardDescription>
            {t('ppf.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] sm:h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ppfData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="a"
                  type="number"
                  domain={[0, maxA * 1.1]}
                  label={{ value: goodAName, position: 'insideBottom', offset: -10, fontSize: 13 }}
                  fontSize={11}
                  tickFormatter={(v: number) => v.toFixed(0)}
                />
                <YAxis
                  domain={[0, maxB * 1.15]}
                  label={{ value: goodBName, angle: -90, position: 'insideLeft', offset: 10, fontSize: 13 }}
                  fontSize={11}
                  tickFormatter={(v: number) => v.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'b') return [value.toFixed(1), isLinear ? t('ppf.tooltipLinear') : t('ppf.tooltipPPF')]
                    if (name === 'linearB') return [value.toFixed(1), t('ppf.tooltipLinearPPF')]
                    return [value.toFixed(1), name]
                  }}
                  labelFormatter={(label: number) => `${goodAName}: ${label.toFixed(1)}`}
                />
                {/* Gray area inside PPF */}
                <Area
                  data={areaData}
                  dataKey="b"
                  fill="hsl(var(--muted) / 0.3)"
                  stroke="none"
                  isAnimationActive={false}
                />
                {/* PPF Curve */}
                <Line
                  type="monotone"
                  dataKey="b"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  name="b"
                  isAnimationActive={false}
                />
                {/* Linear PPF line for comparison */}
                {!isLinear && (
                  <Line
                    type="monotone"
                    dataKey="linearB"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    dot={false}
                    name="linearB"
                    isAnimationActive={false}
                  />
                )}
                {/* Current point on PPF */}
                <ReferenceDot
                  x={currentPoint.a}
                  y={currentPoint.b}
                  r={7}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Zone labels */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-muted/50 border border-muted-foreground/30" />
              <span className="text-muted-foreground">{t('ppf.zoneInside')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-sm bg-primary border border-primary/50" />
              <span className="text-muted-foreground">{t('ppf.zoneOn')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-red-500 font-bold text-sm">●</span>
              <span className="text-muted-foreground">{t('ppf.zoneCurrent')}</span>
            </div>
            {!isLinear && (
              <div className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" />
                <span className="text-muted-foreground">{t('ppf.zoneLinear')}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-sm">↗</span>
              <span className="text-muted-foreground">{t('ppf.zoneOutside')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Point Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('ppf.currentPoint')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{goodAName}</div>
              <div className="text-xl font-mono font-bold">{currentPoint.a.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{goodBName}</div>
              <div className="text-xl font-mono font-bold">{currentPoint.b.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{t('ppf.mrt')}</div>
              <div className="text-xl font-mono font-bold">{mrt.toFixed(3)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{t('ppf.opportunityCostLabel')} {goodAName.slice(0, 3)}</div>
              <div className="text-xl font-mono font-bold">{opportunityCost.toFixed(3)} {goodBName.slice(0, 5)}</div>
            </div>
          </div>

          {/* Position Slider */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <Label>{t('ppf.positionLabel').replace('{goodB}', goodBName).replace('{goodA}', goodAName)}</Label>
              <span className="font-mono text-muted-foreground">{position}%</span>
            </div>
            <Slider
              value={[position]}
              onValueChange={([v]) => { setPosition(v); awardSliderXp() }}
              min={0}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% — {t('ppf.max')} {goodBName}</span>
              <span>50% — {t('ppf.middle')}</span>
              <span>100% — {t('ppf.max')} {goodAName}</span>
            </div>
          </div>

          {/* Interpretation */}
          <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm space-y-1">
            <p>
              <span className="font-semibold">{t('ppf.currentOutput')}</span> {currentPoint.a.toFixed(1)} {goodAName.toLowerCase()} {t('ppf.and')} {currentPoint.b.toFixed(1)} {goodBName.toLowerCase()}.
            </p>
            <p>
              <span className="font-semibold">{t('ppf.mrt')}:</span> {t('ppf.mrtInterpretation')} {goodAName.toLowerCase()} {t('ppf.needToSacrifice')}{mrt.toFixed(3)} {t('ppf.units')} {goodBName.toLowerCase()}.
            </p>
            {!isLinear && mrt > 0 && (
              <p className="text-muted-foreground">
                💡 {t('ppf.concaveHint').replace('{goodB}', goodBName.toLowerCase()).replace('{goodA}', goodAName.toLowerCase())}
              </p>
            )}
            {isLinear && (
              <p className="text-muted-foreground">
                💡 {t('ppf.linearHint').replace('{goodA}', goodAName.toLowerCase()).replace('{mrt}', mrt.toFixed(3)).replace('{goodB}', goodBName.toLowerCase())}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('ppf.paramsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="goodA">{t('ppf.goodAName')}</Label>
              <Input
                id="goodA"
                value={goodAName}
                onChange={(e) => setGoodAName(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('ppf.maxProductionA').replace('{good}', goodAName.toLowerCase())}</Label>
                <span className="font-mono text-muted-foreground">{maxA}</span>
              </div>
              <Slider
                value={[maxA]}
                onValueChange={([v]) => { setMaxA(v); awardSliderXp() }}
                min={20}
                max={200}
                step={5}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="goodB">{t('ppf.goodBName')}</Label>
              <Input
                id="goodB"
                value={goodBName}
                onChange={(e) => setGoodBName(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('ppf.maxProductionA').replace('{good}', goodBName.toLowerCase())}</Label>
                <span className="font-mono text-muted-foreground">{maxB}</span>
              </div>
              <Slider
                value={[maxB]}
                onValueChange={([v]) => { setMaxB(v); awardSliderXp() }}
                min={20}
                max={200}
                step={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('ppf.curveShapeTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('ppf.efficiencyLabel')}</Label>
                <span className="font-mono text-muted-foreground">{efficiency.toFixed(2)}</span>
              </div>
              <Slider
                value={[efficiency]}
                onValueChange={([v]) => { setEfficiency(v); awardSliderXp() }}
                min={0.5}
                max={1.5}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                {efficiency < 0.8
                  ? t('ppf.efficiency.high')
                  : efficiency > 1.2
                    ? t('ppf.efficiency.linear')
                    : t('ppf.efficiency.standard')}
              </p>
            </div>

            <Separator />

            {/* Linear vs Concave toggle */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t('ppf.curveType')}</Label>
              <div className="flex gap-2">
                <Button
                  variant={!isLinear ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsLinear(false)}
                  className="flex-1"
                >
                  {t('ppf.concaveCurve')}
                </Button>
                <Button
                  variant={isLinear ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsLinear(true)}
                  className="flex-1"
                >
                  {t('ppf.linearCurve')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLinear
                  ? t('ppf.linearDesc')
                  : t('ppf.concaveDesc')}
              </p>
            </div>

            <Separator />

            {/* Preset Scenarios */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t('ppf.scenarios')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEconomicGrowth}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs">{t('ppf.economicGrowth')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTechBreakthrough}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span className="text-xs">{t('ppf.techBreakthrough')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{t('ppf.reset')}</span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>• <strong>{t('ppf.economicGrowth')}</strong> — {t('ppf.scenarioGrowth')}</p>
                <p>• <strong>{t('ppf.techBreakthrough')}</strong> — {t('ppf.scenarioTech')}</p>
                <p>• <strong>{t('ppf.reset')}</strong> — {t('ppf.scenarioReset')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {theoryCards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {card.icon}
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formula Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('ppf.formulaTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-background/60 rounded-lg font-mono text-center">
              B = B<sub>max</sub> × (1 − (A / A<sub>max</sub>)<sup>eff</sup>)<sup>1/eff</sup>
            </div>
            <p className="text-muted-foreground">
              {t('ppf.formulaDesc')} <strong>A<sub>max</sub></strong> {t('ppf.and')} <strong>B<sub>max</sub></strong> — {t('ppf.formulaMaxOutput')}
              {t('ppf.formulaEff')}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="font-mono text-xs">
                eff = {efficiency.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                A<sub>max</sub> = {maxA}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                B<sub>max</sub> = {maxB}
              </Badge>
              <Badge variant={isLinear ? 'default' : 'secondary'} className="font-mono text-xs">
                {isLinear ? t('ppf.linear') : t('ppf.concave')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
