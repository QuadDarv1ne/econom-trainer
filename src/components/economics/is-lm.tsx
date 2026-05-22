'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
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
  ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, RotateCcw, Landmark, Banknote, Info, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumberLocale } from '@/lib/i18n'

// ─── Types and pure calculation functions ────────────────────────────

export interface ISLMDataPoint {
  income: number
  isRate: number | null
  lmRate: number | null
}

export interface ISLMEquilibrium {
  y: number
  r: number
}

export interface ISLMMultipliers {
  fiscalMultiplier: number
  monetaryMultiplier: number
  crowdingOut: number
}

export function calcISSlope(mpc: number, taxRate: number, investmentSensitivity: number): number {
  return -(1 - mpc * (1 - taxRate)) / investmentSensitivity
}

export function calcISIntercept(autonomousInvestment: number, govSpending: number, investmentSensitivity: number): number {
  return (autonomousInvestment + govSpending) / investmentSensitivity
}

export function calcLMSlope(moneyDemandSensitivity: number, interestSensitivity: number): number {
  return moneyDemandSensitivity / interestSensitivity
}

export function calcLMIntercept(moneySupply: number, interestSensitivity: number): number {
  return -moneySupply / interestSensitivity
}

export function calcISLMEquilibrium(
  isIntercept: number,
  isSlope: number,
  lmIntercept: number,
  lmSlope: number
): ISLMEquilibrium {
  const denominator = lmSlope - isSlope
  if (Math.abs(denominator) < 0.0001) return { y: 0, r: 0 }
  const y = (isIntercept - lmIntercept) / denominator
  const r = isIntercept + isSlope * y
  return { y, r }
}

export function calcISLMData(
  isIntercept: number,
  isSlope: number,
  lmIntercept: number,
  lmSlope: number,
  equilibriumY: number
): ISLMDataPoint[] {
  const data: ISLMDataPoint[] = []
  const maxY = Math.max(equilibriumY * 1.5, 2000)
  const step = maxY / 60

  for (let y = 0; y <= maxY; y += step) {
    const isR = isIntercept + isSlope * y
    const lmR = lmIntercept + lmSlope * y

    data.push({
      income: Math.round(y),
      isRate: isR >= 0 && isR <= 20 ? Math.round(isR * 100) / 100 : null,
      lmRate: lmR >= 0 && lmR <= 20 ? Math.round(lmR * 100) / 100 : null,
    })
  }
  return data
}

export function calcCrowdingOut(
  mpc: number,
  taxRate: number,
  autonomousInvestment: number,
  govSpending: number,
  equilibriumY: number
): number {
  const simpleMultiplier = 1 / (1 - mpc * (1 - taxRate))
  const yGoodsOnly = simpleMultiplier * (autonomousInvestment + govSpending)
  return Math.max(0, yGoodsOnly - equilibriumY)
}

export function calcFiscalMultiplier(
  mpc: number,
  taxRate: number,
  investmentSensitivity: number,
  moneyDemandSensitivity: number,
  interestSensitivity: number,
  equilibriumY: number
): number {
  if (equilibriumY <= 0) return 0
  const denominator = (1 - mpc * (1 - taxRate)) / investmentSensitivity + moneyDemandSensitivity / interestSensitivity
  return (1 / investmentSensitivity) / denominator
}

export function calcMonetaryMultiplier(
  mpc: number,
  taxRate: number,
  investmentSensitivity: number,
  moneyDemandSensitivity: number,
  interestSensitivity: number,
  equilibriumY: number
): number {
  if (equilibriumY <= 0) return 0
  const denominator = (1 - mpc * (1 - taxRate)) / investmentSensitivity + moneyDemandSensitivity / interestSensitivity
  return (1 / interestSensitivity) / denominator
}

export function ISLMModel() {
  const { t, locale } = useI18n()
  // IS curve parameters
  const [autonomousInvestment, setAutonomousInvestment] = useState(200)
  const [govSpending, setGovSpending] = useState(150)
  const [mpc, setMpc] = useState(0.75)
  const [taxRate, setTaxRate] = useState(0.2)
  const [investmentSensitivity, setInvestmentSensitivity] = useState(50) // dI/dr

  // LM curve parameters
  const [moneySupply, setMoneySupply] = useState(1000)
  const [moneyDemandSensitivity, setMoneyDemandSensitivity] = useState(0.5) // k in L = kY - hr
  const [interestSensitivity, setInterestSensitivity] = useState(100) // h in L = kY - hr

  // XP tracking
  const hasEarnedXPRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = useCallback(() => {
    if (!hasEarnedXPRef.current) {
      hasEarnedXPRef.current = true
      addModuleInteraction({ moduleId: 'is-lm', action: 'calculate', xpEarned: MODULE_XP['is-lm'] ?? 20 })
    }
  }, [addModuleInteraction])

  const { toast } = useToast()

  // IS curve: r = (A + G - (1-MPC(1-t))Y) / d
  const isSlope = useMemo(() => calcISSlope(mpc, taxRate, investmentSensitivity), [mpc, taxRate, investmentSensitivity])
  const isIntercept = useMemo(() => calcISIntercept(autonomousInvestment, govSpending, investmentSensitivity), [autonomousInvestment, govSpending, investmentSensitivity])

  // LM curve: r = (kY - M/P) / h
  const lmSlope = useMemo(() => calcLMSlope(moneyDemandSensitivity, interestSensitivity), [moneyDemandSensitivity, interestSensitivity])
  const lmIntercept = useMemo(() => calcLMIntercept(moneySupply, interestSensitivity), [moneySupply, interestSensitivity])

  // Equilibrium: IS = LM
  const equilibrium = useMemo(() =>
    calcISLMEquilibrium(isIntercept, isSlope, lmIntercept, lmSlope),
    [isIntercept, isSlope, lmIntercept, lmSlope])
  const equilibriumY = equilibrium.y
  const equilibriumR = equilibrium.r

  // Generate chart data
  const chartData = useMemo(() =>
    calcISLMData(isIntercept, isSlope, lmIntercept, lmSlope, equilibriumY),
    [isIntercept, isSlope, lmIntercept, lmSlope, equilibriumY])

  // Crowding out effect
  const crowdingOut = useMemo(() =>
    calcCrowdingOut(mpc, taxRate, autonomousInvestment, govSpending, equilibriumY),
    [mpc, taxRate, autonomousInvestment, govSpending, equilibriumY])

  // Fiscal policy multiplier (with monetary constraint)
  const fiscalMultiplier = useMemo(() =>
    calcFiscalMultiplier(mpc, taxRate, investmentSensitivity, moneyDemandSensitivity, interestSensitivity, equilibriumY),
    [mpc, taxRate, investmentSensitivity, moneyDemandSensitivity, interestSensitivity, equilibriumY])

  // Monetary policy multiplier
  const monetaryMultiplier = useMemo(() =>
    calcMonetaryMultiplier(mpc, taxRate, investmentSensitivity, moneyDemandSensitivity, interestSensitivity, equilibriumY),
    [mpc, taxRate, investmentSensitivity, moneyDemandSensitivity, interestSensitivity, equilibriumY])

  const reset = () => {
    setAutonomousInvestment(200)
    setGovSpending(150)
    setMpc(0.75)
    setTaxRate(0.2)
    setInvestmentSensitivity(50)
    setMoneySupply(1000)
    setMoneyDemandSensitivity(0.5)
    setInterestSensitivity(100)
    hasEarnedXPRef.current = false // Allow XP to be earned again after reset
    toast({ title: t('islm.reset'), description: t('islm.resetDesc') })
  }

  const applyExpansionaryFiscal = () => {
    setGovSpending(250)
    setAutonomousInvestment(250)
    awardXP()
    addModuleInteraction({ moduleId: 'is-lm', action: 'preset', xpEarned: MODULE_XP['is-lm'] ?? 20 })
  }

  const applyContractionaryMonetary = () => {
    setMoneySupply(800)
    awardXP()
    addModuleInteraction({ moduleId: 'is-lm', action: 'preset', xpEarned: MODULE_XP['is-lm'] ?? 20 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            {t('islm.title')}
          </CardTitle>
          <CardDescription>
            {t('islm.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('islm.graph')}</CardTitle>
            <CardDescription>
              {t('islm.graphDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="income"
                    label={{ value: t('islm.income'), position: 'insideBottom', offset: -10, fontSize: 12 }}
                    fontSize={11}
                  />
                  <YAxis
                    domain={[0, 15]}
                    label={{ value: t('islm.interestRate'), angle: -90, position: 'insideLeft', fontSize: 12 }}
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'isRate') return [`${value.toFixed(2)}%`, t('islm.isCurve')]
                      if (name === 'lmRate') return [`${value.toFixed(2)}%`, t('islm.lmCurve')]
                      return [value, name]
                    }}
                    labelFormatter={(label) => `${t('islm.income')}: ${label}`}
                  />
                  <Legend
                    formatter={(value) => {
                      if (value === 'isRate') return t('islm.isCurve')
                      if (value === 'lmRate') return t('islm.lmCurve')
                      return value
                    }}
                  />

                  {/* IS curve */}
                  <Line
                    type="monotone"
                    dataKey="isRate"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    name="isRate"
                  />

                  {/* LM curve */}
                  <Line
                    type="monotone"
                    dataKey="lmRate"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    name="lmRate"
                  />

                  {/* Equilibrium point */}
                  {equilibriumY > 0 && equilibriumR > 0 && (
                    <ReferenceDot
                      x={Math.round(equilibriumY)}
                      y={Math.round(equilibriumR * 100) / 100}
                      r={7}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={2}
                      label={{
                        value: `E: Y=${Math.round(equilibriumY)}, r=${equilibriumR.toFixed(1)}%`,
                        position: 'top',
                        fontSize: 11,
                        fill: '#3b82f6',
                        offset: 12,
                      }}
                    />
                  )}

                  {/* Reference lines */}
                  {equilibriumY > 0 && (
                    <ReferenceLine
                      x={Math.round(equilibriumY)}
                      stroke="#3b82f6"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                  )}
                  {equilibriumR > 0 && (
                    <ReferenceLine
                      y={Math.round(equilibriumR * 100) / 100}
                      stroke="#3b82f6"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded bg-red-500" />
                <span className="text-muted-foreground">{t('islm.isCurve')} — {t('islm.negativeSlope')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-6 rounded bg-green-500" />
                <span className="text-muted-foreground">{t('islm.lmCurve')} — {t('islm.positiveSlope')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{t('islm.equilibrium')} E</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="space-y-4">
          {/* IS Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                {t('islm.isParams')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.autonomousInvestment')}</Label>
                  <Badge variant="secondary">{autonomousInvestment}</Badge>
                </div>
                <Slider value={[autonomousInvestment]} min={50} max={500} step={10} onValueChange={(v) => { awardXP(); setAutonomousInvestment(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.govSpending')}</Label>
                  <Badge variant="secondary">{govSpending}</Badge>
                </div>
                <Slider value={[govSpending]} min={0} max={500} step={10} onValueChange={(v) => { awardXP(); setGovSpending(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.mpc')}</Label>
                  <Badge variant="secondary">{mpc.toFixed(2)}</Badge>
                </div>
                <Slider value={[mpc]} min={0.1} max={0.95} step={0.05} onValueChange={(v) => { awardXP(); setMpc(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.taxRate')}</Label>
                  <Badge variant="secondary">{(taxRate * 100).toFixed(0)}%</Badge>
                </div>
                <Slider value={[taxRate]} min={0} max={0.5} step={0.05} onValueChange={(v) => { awardXP(); setTaxRate(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.investmentSensitivity')}</Label>
                  <Badge variant="secondary">{investmentSensitivity}</Badge>
                </div>
                <Slider value={[investmentSensitivity]} min={10} max={200} step={10} onValueChange={(v) => { awardXP(); setInvestmentSensitivity(v[0]) }} />
                <p className="text-xs text-muted-foreground">{t('islm.investmentSensitivityDesc')}</p>
              </div>
            </CardContent>
          </Card>

          {/* LM Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-500" />
                {t('islm.lmParams')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.moneySupply')}</Label>
                  <Badge variant="secondary">{moneySupply}</Badge>
                </div>
                <Slider value={[moneySupply]} min={200} max={2000} step={50} onValueChange={(v) => { awardXP(); setMoneySupply(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.moneyDemandIncome')}</Label>
                  <Badge variant="secondary">{moneyDemandSensitivity.toFixed(2)}</Badge>
                </div>
                <Slider value={[moneyDemandSensitivity]} min={0.1} max={2} step={0.1} onValueChange={(v) => { awardXP(); setMoneyDemandSensitivity(v[0]) }} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{t('islm.moneyDemandRate')}</Label>
                  <Badge variant="secondary">{interestSensitivity}</Badge>
                </div>
                <Slider value={[interestSensitivity]} min={20} max={300} step={10} onValueChange={(v) => { awardXP(); setInterestSensitivity(v[0]) }} />
                <p className="text-xs text-muted-foreground">{t('islm.moneyDemandRateDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Equilibrium Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-2 border-blue-200 dark:border-blue-900">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('islm.equilibriumY')}</div>
            <div className="text-xl font-mono font-bold text-blue-600">{formatNumberLocale(locale, Math.round(equilibriumY))}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-900">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('islm.equilibriumR')}</div>
            <div className="text-xl font-mono font-bold text-blue-600">{equilibriumR.toFixed(2)}%</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-200 dark:border-red-900">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('islm.isSlope')}</div>
            <div className="text-xl font-mono font-bold text-red-600">{isSlope.toFixed(5)}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-900">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">{t('islm.lmSlope')}</div>
            <div className="text-xl font-mono font-bold text-green-600">{lmSlope.toFixed(5)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Multipliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('islm.multipliers')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('islm.fiscalMultiplier')}</span>
              <span className="font-mono font-bold">{fiscalMultiplier.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('islm.monetaryMultiplier')}</span>
              <span className="font-mono font-bold">{monetaryMultiplier.toFixed(3)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('islm.crowdingOut')}</span>
              <span className={`font-mono font-bold ${crowdingOut > 0 ? 'text-orange-600' : ''}`}>{formatNumberLocale(locale, Math.round(crowdingOut))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              {t('islm.equations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 font-mono">
            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded">
              <span className="text-red-600 font-bold">IS:</span> r = (I₀ + G)/d − [(1−MPC(1−t))/d] · Y
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
              <span className="text-green-600 font-bold">LM:</span> r = −(M/P)/h + (k/h) · Y
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
              <span className="text-blue-600 font-bold">Y* =</span> {formatNumberLocale(locale, equilibriumY > 0 ? Math.round(equilibriumY) : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy Scenarios */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('islm.policyScenarios')}</CardTitle>
          <CardDescription>{t('islm.policyScenariosDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="justify-start" onClick={applyExpansionaryFiscal}>
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              {t('islm.expansionaryFiscal')}
            </Button>
            <Button variant="outline" className="justify-start" onClick={applyContractionaryMonetary}>
              <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
              {t('islm.contractionaryMonetary')}
            </Button>
            <Button variant="outline" className="justify-start" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('islm.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-red-500" />
              {t('islm.isCurve')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>{t('islm.isText')}</p>
            <p>
              <strong className="text-foreground">{t('islm.negativeSlope')}:</strong> рост дохода Y увеличивает сбережения,
              для сохранения равновесия ставка r должна упасть, чтобы стимулировать инвестиции.
            </p>
            <p>
              <strong className="text-foreground">{t('islm.shiftsLabel')}:</strong> рост G или I₀ сдвигает IS вправо (экспансия);
              рост налогов — влево (сжатие).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-green-500" />
              {t('islm.lmCurve')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>{t('islm.lmText')}</p>
            <p>
              <strong className="text-foreground">{t('islm.positiveSlope')}:</strong> рост дохода Y увеличивает транзакционный
              спрос на деньги, для сохранения равновесия ставка r должна вырасти.
            </p>
            <p>
              <strong className="text-foreground">{t('islm.shiftsLabel')}:</strong> рост M/P сдвигает LM вправо; сокращение денежной массы — влево.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              {t('islm.policyEfficiency')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">{t('islm.fiscalPolicy')}</strong> эффективнее при <strong className="text-foreground">{t('islm.flatLM')}</strong>{' '}
              (h → ∞, {t('islm.liquidityTrap')}) или <strong className="text-foreground">{t('islm.steepIS')}</strong> (d → 0).
            </p>
            <p>
              <strong className="text-foreground">{t('islm.monetaryPolicy')}</strong> эффективнее при <strong className="text-foreground">{t('islm.steepLM')}</strong>{' '}
              (h → 0) или <strong className="text-foreground">{t('islm.flatIS')}</strong> (d → ∞).
            </p>
            <p>
              <strong className="text-foreground">{t('islm.crowdingOut')}:</strong> рост G повышает r, что снижает I.
              Чем чувствительнее инвестиции к ставке (больший d), тем сильнее вытеснение.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
