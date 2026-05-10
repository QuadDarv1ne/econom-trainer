'use client'

import { useState, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Legend,
} from 'recharts'
import { BarChart3, Info, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react'

// Color constants for each curve
const COLORS = {
  atc: '#3b82f6',   // blue
  avc: '#f97316',   // orange
  mc: '#ef4444',    // red
  afc: '#9ca3af',   // gray
  price: '#22c55e', // green
}

// Custom tooltip — defined outside render to avoid re-creation
function CostTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: number }) {
  if (!active || !payload || !label) return null
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">Q = {label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.dataKey === 'atc' && 'ATC'}
          {entry.dataKey === 'avc' && 'AVC'}
          {entry.dataKey === 'mc' && 'MC'}
          {entry.dataKey === 'afc' && 'AFC'}
          {': '}{entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  )
}

// Custom legend — defined outside render
function CostLegend({ price }: { price: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-xs">
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5" style={{ backgroundColor: COLORS.atc }} /> ATC (средние общие)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5" style={{ backgroundColor: COLORS.avc }} /> AVC (средние переменные)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5" style={{ backgroundColor: COLORS.mc }} /> MC (предельные)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-4 h-0.5 border-t border-dashed" style={{ borderColor: COLORS.afc }} /> AFC (средние постоянные)
      </span>
      {price > 0 && (
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-0.5" style={{ backgroundColor: COLORS.price }} /> P = {price}
        </span>
      )}
    </div>
  )
}

export function CostAnalysis() {
  const { t } = useI18n()
  // Firm parameters
  const [fixedCosts, setFixedCosts] = useState(200)
  const [varCost, setVarCost] = useState(5)
  const [quadCoef, setQuadCoef] = useState(0.1)
  const [maxQ, setMaxQ] = useState(50)

  // Interactive quantity slider
  const [currentQ, setCurrentQ] = useState(10)

  // Price input for profit calculation
  const [price, setPrice] = useState(20)

  // XP tracking — award once per session on first interaction
  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const awardXP = () => {
    if (!hasEarnedXP) {
      setHasEarnedXP(true)
      addModuleInteraction({ moduleId: 'costs', action: 'calculate', xpEarned: MODULE_XP['costs'] })
    }
  }

  // Generate chart data
  const chartData = useMemo(() => {
    const data: Array<{ quantity: number; atc: number; avc: number; mc: number; afc: number }> = []
    for (let q = 1; q <= maxQ; q++) {
      const fc = fixedCosts
      const vc = varCost * q + quadCoef * q * q
      const tc = fc + vc
      const atc = tc / q
      const avc = vc / q
      const mc = varCost + 2 * quadCoef * q
      data.push({
        quantity: q,
        atc: Math.round(atc * 100) / 100,
        avc: Math.round(avc * 100) / 100,
        mc: Math.round(mc * 100) / 100,
        afc: Math.round((fc / q) * 100) / 100,
      })
    }
    return data
  }, [fixedCosts, varCost, quadCoef, maxQ])

  // Find minimum ATC: ATC = FC/Q + v + q_coef*Q
  // dATC/dQ = -FC/Q² + q_coef = 0 => Q = sqrt(FC / q_coef)
  const minATC_Q = useMemo(() => {
    if (quadCoef <= 0) return null
    const q = Math.sqrt(fixedCosts / quadCoef)
    return Math.round(q * 100) / 100
  }, [fixedCosts, quadCoef])

  const minATC_value = useMemo(() => {
    if (!minATC_Q || minATC_Q <= 0) return null
    const q = minATC_Q
    return Math.round((fixedCosts / q + varCost + quadCoef * q) * 100) / 100
  }, [minATC_Q, fixedCosts, varCost, quadCoef])

  // Find minimum AVC: AVC = v + q_coef*Q — it's linear increasing
  // Actually for our cost function VC = v*Q + q_coef*Q², AVC = v + q_coef*Q
  // This is monotonically increasing, so min AVC is at Q=1
  // But with the standard micro model, AVC has a minimum where dAVC/dQ = q_coef = 0
  // So for our quadratic cost function, AVC is strictly increasing.
  // The shutdown point is at Q where MC = AVC.
  // MC = v + 2*q_coef*Q, AVC = v + q_coef*Q
  // MC = AVC => v + 2*q_coef*Q = v + q_coef*Q => q_coef*Q = 0 => Q = 0
  // So MC crosses AVC at Q=0, which means minAVC is at Q→0+
  // But for display purposes, we use Q=1 as the smallest feasible quantity
  // However, let's compute the more meaningful shutdown: the minimum point of AVC
  // For our specific cost function TC = FC + vQ + qQ², AVC = v + qQ is linear
  // So shutdown price = AVC at Q→0 = v (the intercept)

  // For a more interesting analysis with a U-shaped AVC, we'd need a cubic term
  // But per the spec, let's compute where MC = ATC (breakeven) and show shutdown at min AVC
  // Since AVC is linear increasing, minAVC = varCost (at Q→0)
  const minAVC_value = varCost // Minimum of AVC curve (at Q→0)

  // Shutdown price = min AVC
  const shutdownPrice = minAVC_value

  // Breakeven price = min ATC
  const breakevenPrice = minATC_value

  // Current cost calculations at selected Q
  const currentCosts = useMemo(() => {
    const q = currentQ
    const fc = fixedCosts
    const vc = varCost * q + quadCoef * q * q
    const tc = fc + vc
    const atc = q > 0 ? tc / q : 0
    const avc = q > 0 ? vc / q : 0
    const mc = varCost + 2 * quadCoef * q
    const afc = q > 0 ? fc / q : 0
    const revenue = price * q
    const profit = revenue - tc

    return {
      fc: Math.round(fc * 100) / 100,
      vc: Math.round(vc * 100) / 100,
      tc: Math.round(tc * 100) / 100,
      atc: Math.round(atc * 100) / 100,
      avc: Math.round(avc * 100) / 100,
      mc: Math.round(mc * 100) / 100,
      afc: Math.round(afc * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    }
  }, [currentQ, fixedCosts, varCost, quadCoef, price])

  // Table data for key quantities
  const tableData = useMemo(() => {
    const quantities = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].filter(q => q <= maxQ)
    return quantities.map(q => {
      const fc = fixedCosts
      const vc = varCost * q + quadCoef * q * q
      const tc = fc + vc
      return {
        q,
        fc: Math.round(fc * 100) / 100,
        vc: Math.round(vc * 100) / 100,
        tc: Math.round(tc * 100) / 100,
        atc: Math.round((tc / q) * 100) / 100,
        avc: Math.round((vc / q) * 100) / 100,
        mc: Math.round((varCost + 2 * quadCoef * q) * 100) / 100,
      }
    })
  }, [fixedCosts, varCost, quadCoef, maxQ])

  // Decision status based on price
  const decisionStatus = useMemo(() => {
    if (price >= (breakevenPrice ?? Infinity)) {
      return { label: t('costs.profitable'), color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', icon: CheckCircle2 }
    } else if (price >= shutdownPrice) {
      return { label: t('costs.lossContinue'), color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', icon: AlertTriangle }
    } else {
      return { label: t('costs.shutdown'), color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', icon: AlertTriangle }
    }
  }, [price, breakevenPrice, shutdownPrice, t])

  const DecisionIcon = decisionStatus.icon

  const reset = () => {
    setFixedCosts(200)
    setVarCost(5)
    setQuadCoef(0.1)
    setMaxQ(50)
    setCurrentQ(10)
    setPrice(20)
  }

  // Round the nearest integer Q for the reference dot on the chart
  const minATC_Q_int = minATC_Q ? Math.round(minATC_Q) : null
  const minATC_at_int = minATC_Q_int
    ? Math.round((fixedCosts / minATC_Q_int + varCost + quadCoef * minATC_Q_int) * 100) / 100
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('costs.title')}
          </CardTitle>
          <CardDescription>
            {t('costs.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fixed Costs slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('costs.fixedCosts')}</Label>
                <span className="font-mono text-muted-foreground">{fixedCosts}</span>
              </div>
              <Slider
                value={[fixedCosts]}
                onValueChange={([v]) => { awardXP(); setFixedCosts(v) }}
                min={0}
                max={500}
                step={10}
              />
            </div>

            {/* Variable cost per unit slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('costs.variableCosts')}</Label>
                <span className="font-mono text-muted-foreground">{varCost}</span>
              </div>
              <Slider
                value={[varCost]}
                onValueChange={([v]) => { awardXP(); setVarCost(v) }}
                min={1}
                max={20}
                step={1}
              />
            </div>

            {/* Quadratic coefficient slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('costs.quadCoef')}</Label>
                <span className="font-mono text-muted-foreground">{quadCoef.toFixed(2)}</span>
              </div>
              <Slider
                value={[quadCoef * 100]}
                onValueChange={([v]) => { awardXP(); setQuadCoef(v / 100) }}
                min={1}
                max={50}
                step={1}
              />
            </div>

            {/* Max quantity slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('costs.maxQ')}</Label>
                <span className="font-mono text-muted-foreground">{maxQ}</span>
              </div>
              <Slider
                value={[maxQ]}
                onValueChange={([v]) => { awardXP(); setMaxQ(v) }}
                min={20}
                max={100}
                step={5}
              />
            </div>
          </div>

          {/* Formulas */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <div className="font-semibold mb-1">{t('costs.formulas')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
              <span>TC = FC + v·Q + q·Q²</span>
              <span>VC = v·Q + q·Q²</span>
              <span>ATC = FC/Q + v + q·Q</span>
              <span>AVC = v + q·Q</span>
              <span>MC = v + 2q·Q</span>
              <span>AFC = FC/Q</span>
            </div>
          </div>

          <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('costs.resetParams')}
          </Button>
        </CardContent>
      </Card>

      {/* Main Cost Curves Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('costs.costCurves')}
          </CardTitle>
          <CardDescription>
            {t('costs.costCurvesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="quantity"
                  label={{ value: t('costs.quantityLabel'), position: 'insideBottom', offset: -10, fontSize: 12 }}
                  fontSize={11}
                />
                <YAxis
                  label={{ value: t('costs.costsLabel'), angle: -90, position: 'insideLeft', fontSize: 12 }}
                  fontSize={11}
                  domain={[0, 'auto']}
                />
                <Tooltip content={<CostTooltip />} />
                <Legend content={<CostLegend price={price} />} />

                {/* Price line */}
                {price > 0 && (
                  <ReferenceLine
                    y={price}
                    stroke={COLORS.price}
                    strokeDasharray="8 4"
                    strokeWidth={1.5}
                    label={{ value: `P = ${price}`, position: 'right', fontSize: 11, fill: COLORS.price }}
                  />
                )}

                {/* Current Q reference line */}
                <ReferenceLine
                  x={currentQ}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  label={{ value: `Q=${currentQ}`, position: 'top', fontSize: 10 }}
                />

                {/* AFC - dashed gray line */}
                <Line
                  type="monotone"
                  dataKey="afc"
                  stroke={COLORS.afc}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="AFC"
                />

                {/* AVC - orange */}
                <Line
                  type="monotone"
                  dataKey="avc"
                  stroke={COLORS.avc}
                  strokeWidth={2}
                  dot={false}
                  name="AVC"
                />

                {/* ATC - blue */}
                <Line
                  type="monotone"
                  dataKey="atc"
                  stroke={COLORS.atc}
                  strokeWidth={2.5}
                  dot={false}
                  name="ATC"
                />

                {/* MC - red */}
                <Line
                  type="monotone"
                  dataKey="mc"
                  stroke={COLORS.mc}
                  strokeWidth={2}
                  dot={false}
                  name="MC"
                />

                {/* Min ATC reference dot (breakeven point) */}
                {minATC_Q_int && minATC_at_int && minATC_Q_int <= maxQ && (
                  <ReferenceDot
                    x={minATC_Q_int}
                    y={minATC_at_int}
                    r={6}
                    fill={COLORS.atc}
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: `min ATC = ${minATC_at_int}`,
                      position: 'top',
                      fontSize: 10,
                      fill: COLORS.atc,
                      offset: 10,
                    }}
                  />
                )}

                {/* MC = ATC intersection (breakeven) - vertical reference */}
                {minATC_Q_int && minATC_Q_int <= maxQ && (
                  <ReferenceLine
                    x={minATC_Q_int}
                    stroke={COLORS.atc}
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Key points legend */}
          <div className="mt-3 flex flex-wrap gap-3 justify-center text-xs">
            {minATC_Q && (
              <Badge variant="outline" className="text-xs" style={{ borderColor: COLORS.atc, color: COLORS.atc }}>
                {t('costs.breakevenPoint')}: Q = {minATC_Q}, ATC = {minATC_value}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs" style={{ borderColor: COLORS.avc, color: COLORS.avc }}>
              {t('costs.shutdownPoint')}: min AVC = {shutdownPrice}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Q Slider + Cost Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t('costs.calcTitle')}</CardTitle>
          <CardDescription>
            {t('costs.calcDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Q slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>{t('costs.quantity')}</Label>
                <span className="font-mono text-muted-foreground">{currentQ}</span>
              </div>
              <Slider
                value={[currentQ]}
                onValueChange={([v]) => { awardXP(); setCurrentQ(v) }}
                min={1}
                max={maxQ}
                step={1}
              />
            </div>

            {/* Price input */}
            <div className="space-y-2">
              <Label htmlFor="price-input">{t('costs.price')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="price-input"
                  type="number"
                  value={price}
                  onChange={(e) => { awardXP(); setPrice(Number(e.target.value)) }}
                  min={0}
                  max={200}
                  step={1}
                  className="w-24 font-mono"
                />
                <span className="text-sm text-muted-foreground">{t('finance.rub')}/ед.</span>
              </div>
            </div>
          </div>

          {/* Decision status */}
          <div className={`p-3 rounded-lg flex items-center gap-3 ${decisionStatus.bg}`}>
            <DecisionIcon className={`h-5 w-5 shrink-0 ${decisionStatus.color}`} />
            <div>
              <div className={`font-semibold text-sm ${decisionStatus.color}`}>
                {decisionStatus.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {price >= (breakevenPrice ?? Infinity)
                  ? `${t('costs.interp.positive')} P=${price} ≥ min ATC.`
                  : price >= shutdownPrice
                    ? `P=${price} не покрывает ATC, но покрывает AVC. ${t('costs.interp.negative')} ${t('costs.shortRunLabel')}.`
                    : `P=${price} < min AVC. ${t('costs.interp.negative')} ${t('costs.shutdownPoint')}.`
                }
              </div>
            </div>
          </div>

          {/* Cost breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">FC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.atc }}>{currentCosts.fc}</div>
                <div className="text-xs text-muted-foreground">{t('costs.fixed')}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-orange-200 dark:border-orange-900">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">VC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.avc }}>{currentCosts.vc}</div>
                <div className="text-xs text-muted-foreground">{t('costs.variable')}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-200 dark:border-red-900">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">TC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.mc }}>{currentCosts.tc}</div>
                <div className="text-xs text-muted-foreground">{t('costs.total')}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-200 dark:border-green-900">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">{t('costs.profit')}</div>
                <div className={`text-lg font-mono font-bold ${currentCosts.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentCosts.profit > 0 ? '+' : ''}{currentCosts.profit}
                </div>
                <div className="text-xs text-muted-foreground">TR - TC</div>
              </CardContent>
            </Card>
          </div>

          {/* Average and marginal costs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-2 border-blue-100 dark:border-blue-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">ATC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.atc }}>{currentCosts.atc}</div>
                <div className="text-xs text-muted-foreground">TC/Q</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-orange-100 dark:border-orange-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">AVC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.avc }}>{currentCosts.avc}</div>
                <div className="text-xs text-muted-foreground">VC/Q</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-red-100 dark:border-red-900/50">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">MC</div>
                <div className="text-lg font-mono font-bold" style={{ color: COLORS.mc }}>{currentCosts.mc}</div>
                <div className="text-xs text-muted-foreground">dTC/dQ</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardContent className="p-3 text-center">
                <div className="text-xs text-muted-foreground">AFC</div>
                <div className="text-lg font-mono font-bold text-gray-500">{currentCosts.afc}</div>
                <div className="text-xs text-muted-foreground">FC/Q</div>
              </CardContent>
            </Card>
          </div>

          {/* Profit detail */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span>{t('costs.totalRevenue')}:</span>
              <span className="font-mono font-semibold">{currentCosts.revenue}</span>
              <span>{t('costs.totalCosts')}:</span>
              <span className="font-mono font-semibold">{currentCosts.tc}</span>
              <Separator className="col-span-2 my-1" />
              <span className="font-semibold">{t('costs.profit')}:</span>
              <span className={`font-mono font-bold ${currentCosts.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentCosts.profit > 0 ? '+' : ''}{currentCosts.profit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Cost Curves Chart (TC, VC, FC) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('costs.totalCostCurves')}</CardTitle>
          <CardDescription>
            {t('costs.totalCostDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData.map(d => ({
                  ...d,
                  tc: Math.round((fixedCosts + varCost * d.quantity + quadCoef * d.quantity * d.quantity) * 100) / 100,
                  vc: Math.round((varCost * d.quantity + quadCoef * d.quantity * d.quantity) * 100) / 100,
                  fc: fixedCosts,
                }))}
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="quantity"
                  label={{ value: 'Q', position: 'insideBottom', offset: -10, fontSize: 12 }}
                  fontSize={11}
                />
                <YAxis
                  label={{ value: t('costs.costsLabel'), angle: -90, position: 'insideLeft', fontSize: 12 }}
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [value.toFixed(2), name]}
                />
                <Legend />

                {/* FC - horizontal line */}
                <Line
                  type="monotone"
                  dataKey="fc"
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="FC"
                />

                {/* VC */}
                <Line
                  type="monotone"
                  dataKey="vc"
                  stroke={COLORS.avc}
                  strokeWidth={2}
                  dot={false}
                  name="VC"
                />

                {/* TC */}
                <Line
                  type="monotone"
                  dataKey="tc"
                  stroke={COLORS.mc}
                  strokeWidth={2.5}
                  dot={false}
                  name="TC"
                />

                {/* Current Q marker */}
                <ReferenceLine
                  x={currentQ}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table of costs at key quantities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('costs.table')}</CardTitle>
          <CardDescription>
            {t('costs.tableDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Q</th>
                  <th className="text-right p-2 font-semibold" style={{ color: COLORS.atc }}>ATC</th>
                  <th className="text-right p-2 font-semibold" style={{ color: COLORS.avc }}>AVC</th>
                  <th className="text-right p-2 font-semibold" style={{ color: COLORS.mc }}>MC</th>
                  <th className="text-right p-2 font-semibold" style={{ color: COLORS.afc }}>AFC</th>
                  <th className="text-right p-2 font-semibold">VC</th>
                  <th className="text-right p-2 font-semibold">TC</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr
                    key={row.q}
                    className={`border-b hover:bg-muted/50 transition-colors ${row.q === currentQ ? 'bg-primary/5 font-semibold' : ''}`}
                  >
                    <td className="p-2 font-mono">{row.q}</td>
                    <td className="text-right p-2 font-mono" style={{ color: COLORS.atc }}>{row.atc.toFixed(2)}</td>
                    <td className="text-right p-2 font-mono" style={{ color: COLORS.avc }}>{row.avc.toFixed(2)}</td>
                    <td className="text-right p-2 font-mono" style={{ color: COLORS.mc }}>{row.mc.toFixed(2)}</td>
                    <td className="text-right p-2 font-mono" style={{ color: COLORS.afc }}>{(row.fc / row.q).toFixed(2)}</td>
                    <td className="text-right p-2 font-mono">{row.vc.toFixed(2)}</td>
                    <td className="text-right p-2 font-mono">{row.tc.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Theory Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Short-run vs Long-run costs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              {t('costs.shortRun')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('costs.shortRunLabel')}</div>
              <p className="text-muted-foreground">
                {t('costs.theory.fixed')}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="font-semibold text-green-700 dark:text-green-400 mb-1">{t('costs.longRunLabel')}</div>
              <p className="text-muted-foreground">
                {t('costs.theory.variable')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* MC and ATC/AVC relationship */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-orange-500" />
              {t('costs.mcRelationship')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <p className="text-muted-foreground mb-2">
                <strong>{t('costs.keyRule')}:</strong> {t('costs.theory.marginal')}
              </p>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Если MC &lt; ATC — ATC убывает (предельные тянут средние вниз)</li>
                <li>Если MC &gt; ATC — ATC возрастает (предельные тянут средние вверх)</li>
                <li>MC = ATC — {t('costs.breakevenPoint')}</li>
                <li>MC = AVC — {t('costs.shutdownPoint')}</li>
              </ul>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="font-semibold mb-1">{t('costs.mathExplanation')}:</div>
              <p className="text-muted-foreground text-xs font-mono">
                d(ATC)/dQ = (MC·Q - TC) / Q² = (MC - ATC) / Q
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                При MC = ATC производная ATC равна нулю ⇒ минимум ATC.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Why MC crosses ATC at minimum */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {t('costs.whyMCCrosses')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-muted-foreground">
                {t('costs.theory')}
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground list-disc list-inside">
                <li>Если MC &lt; ATC — ATC убывает</li>
                <li>Если MC &gt; ATC — ATC возрастает</li>
                <li>MC = ATC — {t('costs.breakevenPoint')}</li>
              </ul>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                {t('costs.theory.marginal')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Shutdown vs Breakeven */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {t('costs.shutdownVsBreakeven')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <div className="font-semibold text-red-700 dark:text-red-400 mb-1">{t('costs.shutdownPointDetail')}</div>
              <p className="text-muted-foreground">
                Минимум AVC. Если цена падает ниже min AVC, фирма не покрывает даже переменные издержки.
                {t('costs.theory.marginal')}
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">{t('costs.breakevenPointDetail')}</div>
              <p className="text-muted-foreground">
                Минимум ATC. При P = min ATC фирма покрывает все издержки (и постоянные, и переменные),
                но экономическая прибыль равна нулю.
                При P &gt; min ATC фирма получает экономическую прибыль.
              </p>
            </div>
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <div className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">{t('costs.lossZone')}</div>
              <p className="text-muted-foreground">
                При min AVC &lt; P &lt; min ATC фирма несёт убытки, но продолжает производство:
                выручка покрывает все VC и часть FC. Убыток меньше, чем при закрытии (FC).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('costs.summary')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('costs.breakevenPoint')}</div>
              <div className="font-mono font-bold" style={{ color: COLORS.atc }}>{minATC_value ?? '—'}</div>
              <div className="text-xs text-muted-foreground">при Q = {minATC_Q ?? '—'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('costs.shutdownPoint')}</div>
              <div className="font-mono font-bold" style={{ color: COLORS.avc }}>{shutdownPrice}</div>
              <div className="text-xs text-muted-foreground">при Q → 0</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('costs.currentPrice')} P</div>
              <div className="font-mono font-bold" style={{ color: COLORS.price }}>{price}</div>
              <div className="text-xs text-muted-foreground">
                {price >= (breakevenPrice ?? Infinity) ? '≥ min ATC' : price >= shutdownPrice ? '∈ [min AVC, min ATC)' : '< min AVC'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">{t('costs.profitAtQ')}={currentQ}</div>
              <div className={`font-mono font-bold ${currentCosts.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentCosts.profit > 0 ? '+' : ''}{currentCosts.profit}
              </div>
              <div className="text-xs text-muted-foreground">π = P×Q - TC</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
