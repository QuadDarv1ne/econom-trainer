'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEconomicsStore } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { TrendingUp, TrendingDown, Activity, RotateCcw, Info, Percent } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

const chartConfig = {
  current: { label: 'Current', color: 'hsl(var(--chart-1))' },
  predicted: { label: 'Predicted', color: 'hsl(var(--chart-2))' },
}

export function MonetaryPolicy() {
  const { t } = useI18n()
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const [conditions, setConditions] = useState({
    inflation: 4,
    gdpGrowth: 1.5,
    unemployment: 6,
    currentRate: 7.5,
    moneySupply: 8,
  })
  const [policyTools, setPolicyTools] = useState({
    rateChange: 0,
    openMarketOperation: 'none' as 'buy' | 'sell' | 'none',
    reserveRequirementChange: 0,
    quantitativeEasing: 'none' as 'none' | 'easing' | 'tightening',
  })
  const [hasSimulated, setHasSimulated] = useState(false)

  const updateCondition = (field: string, value: string) => {
    setConditions((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }))
    setHasSimulated(false)
  }

  const updatePolicyTool = (field: string, value: string | number) => {
    setPolicyTools((prev) => ({ ...prev, [field]: value }))
    setHasSimulated(false)
  }

  const predictions = useMemo(() => {
    const { inflation, gdpGrowth, unemployment } = conditions
    const { rateChange, reserveRequirementChange, openMarketOperation, quantitativeEasing } = policyTools

    // Open market operations impact
    const omImpact = openMarketOperation === 'buy' ? 0.5 : openMarketOperation === 'sell' ? -0.5 : 0
    // QE impact
    const qeImpact = quantitativeEasing === 'easing' ? 0.3 : quantitativeEasing === 'tightening' ? -0.3 : 0

    const totalRateImpact = rateChange + omImpact * 2 + qeImpact * 2
    const totalReserveImpact = reserveRequirementChange

    // Simplified economic model
    const predictedInflation = inflation - 0.3 * totalRateImpact + 0.1 * totalReserveImpact
    const predictedUnemployment = unemployment + 0.2 * totalRateImpact - 0.05 * totalReserveImpact
    const predictedGDP = gdpGrowth - 0.4 * totalRateImpact + 0.15 * totalReserveImpact

    // Taylor Rule
    const neutralRate = inflation + 2
    const taylorRecommended = neutralRate + 0.5 * (inflation - 2) + 0.5 * (gdpGrowth - 2)

    return {
      predictedInflation: Math.max(-5, parseFloat(predictedInflation.toFixed(2))),
      predictedUnemployment: Math.max(0, parseFloat(predictedUnemployment.toFixed(2))),
      predictedGDP: parseFloat(predictedGDP.toFixed(2)),
      taylorRecommended: parseFloat(taylorRecommended.toFixed(2)),
      rateGap: parseFloat((conditions.currentRate - taylorRecommended).toFixed(2)),
    }
  }, [conditions, policyTools])

  const simulate = useCallback(() => {
    setHasSimulated(true)
    addModuleInteraction({
      moduleId: 'monetary-policy',
      action: 'simulate',
      xpEarned: 25,
      details: { rateChange: policyTools.rateChange },
    })
  }, [addModuleInteraction, policyTools.rateChange])

  const reset = useCallback(() => {
    setConditions({ inflation: 4, gdpGrowth: 1.5, unemployment: 6, currentRate: 7.5, moneySupply: 8 })
    setPolicyTools({ rateChange: 0, openMarketOperation: 'none', reserveRequirementChange: 0, quantitativeEasing: 'none' })
    setHasSimulated(false)
  }, [])

  const chartData = hasSimulated ? [
    {
      metric: t('monetary.predicted.inflation'),
      current: conditions.inflation,
      predicted: predictions.predictedInflation,
    },
    {
      metric: t('monetary.predicted.gdpGrowth'),
      current: conditions.gdpGrowth,
      predicted: predictions.predictedGDP,
    },
    {
      metric: t('monetary.predicted.unemployment'),
      current: conditions.unemployment,
      predicted: predictions.predictedUnemployment,
    },
  ] : []

  const getInflationColor = (value: number) => {
    if (value > 10) return 'text-red-600'
    if (value > 5) return 'text-orange-600'
    if (value > 2) return 'text-amber-600'
    return 'text-green-600'
  }

  const getGDPColor = (value: number) => {
    if (value > 3) return 'text-green-600'
    if (value > 1) return 'text-emerald-600'
    if (value > 0) return 'text-amber-600'
    return 'text-red-600'
  }

  const getUnemploymentColor = (value: number) => {
    if (value < 4) return 'text-green-600'
    if (value < 7) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('monetary.title')}</h2>
          <p className="text-muted-foreground">{t('monetary.description')}</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          +25 XP
        </Badge>
      </div>

      {/* Economic Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monetary.conditions')}</CardTitle>
          <CardDescription>{t('monetary.conditionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>{t('monetary.condition.inflation')}</Label>
              <Input
                type="number"
                step="0.1"
                value={conditions.inflation}
                onChange={(e) => updateCondition('inflation', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('monetary.condition.gdpGrowth')}</Label>
              <Input
                type="number"
                step="0.1"
                value={conditions.gdpGrowth}
                onChange={(e) => updateCondition('gdpGrowth', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('monetary.condition.unemployment')}</Label>
              <Input
                type="number"
                step="0.1"
                value={conditions.unemployment}
                onChange={(e) => updateCondition('unemployment', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('monetary.condition.currentRate')}</Label>
              <Input
                type="number"
                step="0.1"
                value={conditions.currentRate}
                onChange={(e) => updateCondition('currentRate', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('monetary.condition.moneySupply')}</Label>
              <Input
                type="number"
                step="0.1"
                value={conditions.moneySupply}
                onChange={(e) => updateCondition('moneySupply', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Tools */}
      <Card>
        <CardHeader>
          <CardTitle>{t('monetary.policyTools')}</CardTitle>
          <CardDescription>{t('monetary.policyToolsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('monetary.tool.keyRate')}</Label>
            <div className="flex items-center gap-3 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePolicyTool('rateChange', policyTools.rateChange - 0.5)}
              >
                <TrendingDown className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center font-mono text-lg">
                {policyTools.rateChange > 0 ? '+' : ''}{policyTools.rateChange}%
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updatePolicyTool('rateChange', policyTools.rateChange + 0.5)}
              >
                <TrendingUp className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <Label>{t('monetary.tool.openMarket')}</Label>
            <Select
              value={policyTools.openMarketOperation}
              onValueChange={(v) => updatePolicyTool('openMarketOperation', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('monetary.operation.none')}</SelectItem>
                <SelectItem value="buy">{t('monetary.operation.buy')}</SelectItem>
                <SelectItem value="sell">{t('monetary.operation.sell')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('monetary.tool.reserveRequirement')}</Label>
            <Input
              type="number"
              step="0.5"
              value={policyTools.reserveRequirementChange}
              onChange={(e) => updatePolicyTool('reserveRequirementChange', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>{t('monetary.tool.quantitativeEasing')}</Label>
            <Select
              value={policyTools.quantitativeEasing}
              onValueChange={(v) => updatePolicyTool('quantitativeEasing', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('monetary.qe.none')}</SelectItem>
                <SelectItem value="easing">{t('monetary.qe.easing')}</SelectItem>
                <SelectItem value="tightening">{t('monetary.qe.tightening')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={simulate} className="flex-1" size="lg">
          <Percent className="h-4 w-4 mr-2" />
          {t('monetary.simulate')}
        </Button>
        <Button onClick={reset} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('monetary.reset')}
        </Button>
      </div>

      {/* Results */}
      {hasSimulated && (
        <div className="space-y-4">
          {/* Predictions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {t('monetary.predicted.inflation')}
                </CardDescription>
                <CardTitle className={`text-2xl ${getInflationColor(predictions.predictedInflation)}`}>
                  {predictions.predictedInflation.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {predictions.predictedInflation < conditions.inflation
                    ? t('monetary.prediction.decrease')
                    : predictions.predictedInflation > conditions.inflation
                    ? t('monetary.prediction.increase')
                    : t('monetary.prediction.stable')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {t('monetary.predicted.gdpGrowth')}
                </CardDescription>
                <CardTitle className={`text-2xl ${getGDPColor(predictions.predictedGDP)}`}>
                  {predictions.predictedGDP.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {predictions.predictedGDP > conditions.gdpGrowth
                    ? t('monetary.prediction.increase')
                    : predictions.predictedGDP < conditions.gdpGrowth
                    ? t('monetary.prediction.decrease')
                    : t('monetary.prediction.stable')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {t('monetary.predicted.unemployment')}
                </CardDescription>
                <CardTitle className={`text-2xl ${getUnemploymentColor(predictions.predictedUnemployment)}`}>
                  {predictions.predictedUnemployment.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {predictions.predictedUnemployment < conditions.unemployment
                    ? t('monetary.prediction.decrease')
                    : predictions.predictedUnemployment > conditions.unemployment
                    ? t('monetary.prediction.increase')
                    : t('monetary.prediction.stable')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Taylor Rule */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {t('monetary.taylorRule')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">{t('monetary.taylorRule.recommended')}</p>
                  <p className="text-2xl font-bold text-blue-600">{predictions.taylorRecommended.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('monetary.taylorRule.current')}</p>
                  <p className="text-2xl font-bold">{conditions.currentRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('monetary.taylorRule.gap')}</p>
                  <p className={`text-2xl font-bold ${predictions.rateGap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {predictions.rateGap > 0 ? '+' : ''}{predictions.rateGap.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monetary.comparison')}</CardTitle>
              <CardDescription>{t('monetary.comparisonDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72 w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="current" fill="var(--color-current)" name={t('monetary.chart.current')} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="predicted" fill="var(--color-predicted)" name={t('monetary.chart.predicted')} radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monetary.education.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">{t('monetary.education.transmission')}</p>
                <p className="text-muted-foreground">{t('monetary.education.transmissionDesc')}</p>
              </div>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">{t('monetary.education.taylorRule')}</p>
                <p className="text-muted-foreground">{t('monetary.education.taylorRuleDesc')}</p>
              </div>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">{t('monetary.education.phillipsCurve')}</p>
                <p className="text-muted-foreground">{t('monetary.education.phillipsCurveDesc')}</p>
              </div>
            </CardContent>
          </Card>

          {/* Formulas */}
          <Card>
            <CardHeader>
              <CardTitle>{t('monetary.formulas.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('monetary.formula.taylor')}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('monetary.formula.phillips')}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('monetary.formula.moneyMultiplier')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
