'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  ReferenceDot,
} from 'recharts'
import { ArrowRightLeft, Info, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

// ─── Types and pure calculation functions ────────────────────────────

export interface Equilibrium {
  price: number
  quantity: number
}

export interface ChartDataPoint {
  quantity: number
  demand: number
  supply: number
}

export interface PracticeProblem {
  type: 'equilibrium' | 'elasticity' | 'shift'
  question: string
  answer: number
  tolerance: number
}

export function calcEquilibrium(
  demandIntercept: number,
  demandSlope: number,
  supplyIntercept: number,
  supplySlope: number,
  demandShift: number,
  supplyShift: number
): Equilibrium {
  const eqQ =
    ((demandIntercept + demandShift) - (supplyIntercept + supplyShift)) /
    (demandSlope + supplySlope)
  const eqP = (demandIntercept + demandShift) - demandSlope * eqQ
  return {
    price: Math.max(0, eqP),
    quantity: Math.max(0, eqQ),
  }
}

export function generateChartData(
  demandIntercept: number,
  demandSlope: number,
  supplyIntercept: number,
  supplySlope: number,
  demandShift: number,
  supplyShift: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
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
}

export function generatePracticeProblem(t: (key: string) => string): PracticeProblem {
  const types = ['equilibrium', 'elasticity', 'shift'] as const
  const type = types[Math.floor(Math.random() * types.length)]
  const a = Math.round(Math.random() * 80 + 40)
  const b = Math.round(Math.random() * 2 + 0.5 * 10) / 10
  const c = Math.round(Math.random() * 20 + 5)
  const d = Math.round(Math.random() * 1.5 + 0.3 * 10) / 10
  let question: string
  let answer: number

  if (type === 'equilibrium') {
    const p = (a - c) / (b + d)
    question = t('supply-demand.practice.equilibrium').replace('{a}', String(a)).replace('{b}', String(b)).replace('{c}', String(c)).replace('{d}', String(d))
    answer = Math.round(p * 100) / 100
  } else if (type === 'elasticity') {
    const p = Math.round(Math.random() * (a / b - 1) * 10) / 10 + 1
    const q = a - b * p
    const ed = Math.abs(b * (p / q))
    question = t('supply-demand.practice.elasticity').replace('{a}', String(a)).replace('{b}', String(b)).replace('{p}', String(p))
    answer = Math.round(ed * 100) / 100
  } else {
    const shift = Math.round(Math.random() * 20 + 5)
    const eqQ1 = (a - c) / (b + d)
    const eqQ2 = (a + shift - c) / (b + d)
    const deltaQ = eqQ2 - eqQ1
    question = t('supply-demand.practice.shift').replace('{a}', String(a)).replace('{b}', String(b)).replace('{c}', String(c)).replace('{d}', String(d)).replace('{shift}', String(shift))
    answer = Math.round(deltaQ * 100) / 100
  }

  return { type, question, answer, tolerance: Math.max(0.1, Math.abs(answer) * 0.02) }
}

// ─── Component ────────────────────────────────────────────────────────

export function SupplyDemand() {
  const demandIntercept = 100
  const [demandSlope, setDemandSlope] = useState(1)
  const supplyIntercept = 10
  const [supplySlope, setSupplySlope] = useState(0.8)
  const [demandShift, setDemandShift] = useState(0)
  const [supplyShift, setSupplyShift] = useState(0)
  const [activeTab, setActiveTab] = useState('explore')
  const { t } = useI18n()

  // XP tracking — award once per session on first slider change
  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = useCallback(() => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({ moduleId: 'supply-demand', action: 'interact', xpEarned: MODULE_XP['supply-demand'] })
    }
  }, [addModuleInteraction])

  // Practice problem state
  const [practiceAnswer, setPracticeAnswer] = useState('')
  const [practiceResult, setPracticeResult] = useState<'correct' | 'incorrect' | null>(null)
  const [practiceStreak, setPracticeStreak] = useState(0)
  const [practiceProblem, setPracticeProblem] = useState(() => generatePracticeProblem(t))

  const checkPracticeAnswer = () => {
    const parsed = parseFloat(practiceAnswer)
    if (isNaN(parsed)) return
    if (Math.abs(parsed - practiceProblem.answer) <= practiceProblem.tolerance) {
      setPracticeResult('correct')
      setPracticeStreak((s) => s + 1)
      addModuleInteraction({ moduleId: 'supply-demand', action: 'practice', xpEarned: 5 })
    } else {
      setPracticeResult('incorrect')
      setPracticeStreak(0)
    }
  }

  const nextPracticeProblem = () => {
    setPracticeProblem(generatePracticeProblem(t))
    setPracticeAnswer('')
    setPracticeResult(null)
  }

  const generateData = useMemo(() =>
    generateChartData(demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift),
    [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift])

  const equilibrium: Equilibrium = useMemo(() =>
    calcEquilibrium(demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift),
    [demandIntercept, demandSlope, supplyIntercept, supplySlope, demandShift, supplyShift])

  const getScenarioDescription = () => {
    const scenarios: string[] = []
    if (demandShift > 0) scenarios.push(t('supply-demand.scenario.demand.increase'))
    else if (demandShift < 0) scenarios.push(t('supply-demand.scenario.demand.decrease'))
    if (supplyShift > 0) scenarios.push(t('supply-demand.scenario.supply.increase'))
    else if (supplyShift < 0) scenarios.push(t('supply-demand.scenario.supply.decrease'))
    if (scenarios.length === 0) return t('supply-demand.scenario.equilibrium')
    return scenarios.join('; ')
  }

  const getEffectOnPrice = () => {
    if (demandShift > 0 && supplyShift < 0) return { text: t('supply-demand.effect.price.up'), variant: 'destructive' as const }
    if (demandShift < 0 && supplyShift > 0) return { text: t('supply-demand.effect.price.down'), variant: 'secondary' as const }
    if (demandShift > 0 || supplyShift < 0) return { text: t('supply-demand.effect.price.up.pressure'), variant: 'default' as const }
    if (demandShift < 0 || supplyShift > 0) return { text: t('supply-demand.effect.price.down.pressure'), variant: 'secondary' as const }
    return { text: t('supply-demand.effect.price.stable'), variant: 'outline' as const }
  }

  const getEffectOnQuantity = () => {
    if (demandShift > 0 && supplyShift > 0) return { text: t('supply-demand.effect.quantity.up'), variant: 'default' as const }
    if (demandShift < 0 && supplyShift < 0) return { text: t('supply-demand.effect.quantity.down'), variant: 'destructive' as const }
    if (demandShift !== 0 && supplyShift === 0) return { text: t('supply-demand.effect.quantity.change'), variant: 'secondary' as const }
    if (supplyShift !== 0 && demandShift === 0) return { text: t('supply-demand.effect.quantity.change'), variant: 'secondary' as const }
    return { text: t('supply-demand.effect.quantity.stable'), variant: 'outline' as const }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explore">{t('supply-demand.tab.explore')}</TabsTrigger>
          <TabsTrigger value="practice">{t('supply-demand.tab.practice')}</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {t('supply-demand.title')}
          </CardTitle>
          <CardDescription>
            {t('supply-demand.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={generateData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="quantity"
                  label={{ value: t('supply-demand.axis.quantity'), position: 'insideBottom', offset: -5 }}
                  fontSize={12}
                />
                <YAxis
                  label={{ value: t('supply-demand.axis.price'), angle: -90, position: 'insideLeft' }}
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
                    name === 'demand' ? t('supply-demand.tooltip.demand') : t('supply-demand.tooltip.supply'),
                  ]}
                  labelFormatter={(label) => `${t('supply-demand.tooltip.quantity')}: ${label}`}
                />
                <Legend
                  formatter={(value) => (value === 'demand' ? t('supply-demand.legend.demand') : t('supply-demand.legend.supply'))}
                />
                <ReferenceDot
                  x={equilibrium.quantity}
                  y={equilibrium.price}
                  r={5}
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth={2}
                  label={{ value: 'E', position: 'top', fill: '#f59e0b', fontSize: 13, fontWeight: 'bold' }}
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
            <CardTitle className="text-lg">{t('supply-demand.parameters')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('supply-demand.demandSlope')}</Label>
                <span className="font-mono text-muted-foreground">{demandSlope.toFixed(1)}</span>
              </div>
              <Slider
                aria-label={t('supply-demand.demandSlope')}
                value={[demandSlope]}
                onValueChange={([v]) => { awardXP(); setDemandSlope(v) }}
                min={0.2}
                max={3}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('supply-demand.supplySlope')}</Label>
                <span className="font-mono text-muted-foreground">{supplySlope.toFixed(1)}</span>
              </div>
              <Slider
                aria-label={t('supply-demand.supplySlope')}
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
            <CardTitle className="text-lg">{t('supply-demand.shifts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('supply-demand.demandShift')}</Label>
                <span className="font-mono text-muted-foreground">
                  {demandShift > 0 ? '+' : ''}
                  {demandShift}
                </span>
              </div>
              <Slider
                aria-label={t('supply-demand.demandShift')}
                value={[demandShift]}
                onValueChange={([v]) => { awardXP(); setDemandShift(v) }}
                min={-40}
                max={40}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('supply-demand.supplyShift')}</Label>
                <span className="font-mono text-muted-foreground">
                  {supplyShift > 0 ? '+' : ''}
                  {supplyShift}
                </span>
              </div>
              <Slider
                aria-label={t('supply-demand.supplyShift')}
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
            {t('supply-demand.equilibrium')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div aria-live="polite" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{t('supply-demand.summary.price')}</div>
              <div className="text-xl font-mono font-bold">{equilibrium.price.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground">{t('supply-demand.summary.quantity')}</div>
              <div className="text-xl font-mono font-bold">{equilibrium.quantity.toFixed(1)}</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">{t('supply-demand.summary.priceEffect')}</div>
              <Badge variant={getEffectOnPrice().variant}>{getEffectOnPrice().text}</Badge>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">{t('supply-demand.summary.quantityEffect')}</div>
              <Badge variant={getEffectOnQuantity().variant}>{getEffectOnQuantity().text}</Badge>
            </div>
          </div>
          <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm">
            {getScenarioDescription()}
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="practice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('supply-demand.practice.title')}</CardTitle>
              <CardDescription>{t('supply-demand.practice.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {practiceStreak > 0 && (
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  🔥 {t('supply-demand.practice.streak')}: {practiceStreak}
                </Badge>
              )}
              <div className="p-4 bg-muted/50 rounded-lg text-sm">{practiceProblem.question}</div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={t('supply-demand.practice.answerPlaceholder')}
                  value={practiceAnswer}
                  onChange={(e) => setPracticeAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkPracticeAnswer()}
                  className="max-w-[200px]"
                />
                <Button onClick={checkPracticeAnswer} disabled={practiceResult !== null}>
                  {t('supply-demand.practice.check')}
                </Button>
                {practiceResult !== null && (
                  <Button variant="outline" onClick={nextPracticeProblem}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {t('supply-demand.practice.next')}
                  </Button>
                )}
              </div>
              {practiceResult === 'correct' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('supply-demand.practice.correct')} {t('supply-demand.practice.answer')}: {practiceProblem.answer}
                </div>
              )}
              {practiceResult === 'incorrect' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <XCircle className="h-4 w-4" />
                  {t('supply-demand.practice.incorrect')} {t('supply-demand.practice.correctAnswer')}: {practiceProblem.answer}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
