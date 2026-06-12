'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEconomicsStore } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { AlertTriangle, TrendingUp, TrendingDown, Activity, RotateCcw, Play } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const chartConfig = {
  gdpGrowth: { label: 'GDP Growth', color: 'hsl(var(--chart-1))' },
  unemployment: { label: 'Unemployment', color: 'hsl(var(--chart-2))' },
  inflation: { label: 'Inflation', color: 'hsl(var(--chart-3))' },
}

interface CrisisScenario {
  id: string
  nameKey: string
  descriptionKey: string
  gdpGrowthImpact: number[]
  unemploymentImpact: number[]
  inflationImpact: number[]
  duration: number
  explanationKey: string
  recoveryKey: string
}

const scenarios: CrisisScenario[] = [
  {
    id: '2008-financial',
    nameKey: 'crises.scenario.2008-financial.name',
    descriptionKey: 'crises.scenario.2008-financial.description',
    gdpGrowthImpact: [-1, -3, -5, -2, 1, 3],
    unemploymentImpact: [0.5, 2, 4, 5, 3, 1.5],
    inflationImpact: [2, 4, 6, 3, 1, 0.5],
    duration: 6,
    explanationKey: 'crises.scenario.2008-financial.explanation',
    recoveryKey: 'crises.scenario.2008-financial.recovery',
  },
  {
    id: '1998-russian',
    nameKey: 'crises.scenario.1998-russian.name',
    descriptionKey: 'crises.scenario.1998-russian.description',
    gdpGrowthImpact: [-2, -5, -8, -3, 2, 5],
    unemploymentImpact: [1, 3, 7, 9, 5, 2],
    inflationImpact: [10, 30, 84, 36, 15, 5],
    duration: 6,
    explanationKey: 'crises.scenario.1998-russian.explanation',
    recoveryKey: 'crises.scenario.1998-russian.recovery',
  },
  {
    id: 'stagflation',
    nameKey: 'crises.scenario.stagflation.name',
    descriptionKey: 'crises.scenario.stagflation.description',
    gdpGrowthImpact: [-0.5, -1, -1.5, -1, -0.5, 0],
    unemploymentImpact: [0.5, 1.5, 3, 4, 3.5, 2.5],
    inflationImpact: [3, 6, 10, 12, 9, 5],
    duration: 6,
    explanationKey: 'crises.scenario.stagflation.explanation',
    recoveryKey: 'crises.scenario.stagflation.recovery',
  },
  {
    id: 'hyperinflation',
    nameKey: 'crises.scenario.hyperinflation.name',
    descriptionKey: 'crises.scenario.hyperinflation.description',
    gdpGrowthImpact: [-3, -8, -15, -10, -5, 2],
    unemploymentImpact: [2, 5, 12, 18, 15, 10],
    inflationImpact: [50, 200, 1000, 500, 100, 30],
    duration: 6,
    explanationKey: 'crises.scenario.hyperinflation.explanation',
    recoveryKey: 'crises.scenario.hyperinflation.recovery',
  },
  {
    id: 'debt-crisis',
    nameKey: 'crises.scenario.debt-crisis.name',
    descriptionKey: 'crises.scenario.debt-crisis.description',
    gdpGrowthImpact: [-1, -2, -4, -3, -1, 1],
    unemploymentImpact: [0.5, 2, 5, 7, 5, 3],
    inflationImpact: [1, 3, 8, 12, 7, 3],
    duration: 6,
    explanationKey: 'crises.scenario.debt-crisis.explanation',
    recoveryKey: 'crises.scenario.debt-crisis.recovery',
  },
]

export const EconomicCrises = memo(function EconomicCrises() {
  const { t } = useI18n()
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const [indicators, setIndicators] = useState({
    gdpGrowth: 2.5,
    unemployment: 5,
    inflation: 2,
    debtToGDP: 60,
    interestRate: 5,
  })
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [results, setResults] = useState<Array<Record<string, number | string>> | null>(null)

  const updateIndicator = (field: string, value: string) => {
    setIndicators((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }))
  }

  // Helper to safely extract numeric values from row data
  const getNum = (row: Record<string, number | string>, key: string): number => {
    const val = row[key]
    return typeof val === 'number' ? val : 0
  }

  const runSimulation = useCallback(() => {
    if (!selectedScenario) return
    const scenario = scenarios.find((s) => s.id === selectedScenario)
    if (!scenario) return

    const timeline: Array<Record<string, number | string>> = []
    for (let year = 0; year < scenario.duration; year++) {
      timeline.push({
        year: `${t('crises.year')} ${year + 1}`,
        gdpGrowth: parseFloat((indicators.gdpGrowth + scenario.gdpGrowthImpact[year]).toFixed(2)),
        unemployment: parseFloat((indicators.unemployment + scenario.unemploymentImpact[year]).toFixed(2)),
        inflation: parseFloat((indicators.inflation + scenario.inflationImpact[year]).toFixed(2)),
      })
    }
    setResults(timeline)

    addModuleInteraction({
      moduleId: 'economic-crises',
      action: 'simulate',
      xpEarned: 25,
      details: { scenario: selectedScenario },
    })
  }, [selectedScenario, indicators, addModuleInteraction, t])

  const resetSimulation = useCallback(() => {
    setIndicators({ gdpGrowth: 2.5, unemployment: 5, inflation: 2, debtToGDP: 60, interestRate: 5 })
    setSelectedScenario(null)
    setResults(null)
  }, [])

  const selectedScenarioData = scenarios.find((s) => s.id === selectedScenario)

  const peakImpact = useMemo(() => {
    if (!results) return null
    let maxUnemployment = -Infinity
    let minGDP = Infinity
    let maxInflation = -Infinity
    for (const row of results) {
      const u = typeof row.unemployment === 'number' ? row.unemployment : parseFloat(String(row.unemployment))
      const g = typeof row.gdpGrowth === 'number' ? row.gdpGrowth : parseFloat(String(row.gdpGrowth))
      const i = typeof row.inflation === 'number' ? row.inflation : parseFloat(String(row.inflation))
      if (!isNaN(u) && u > maxUnemployment) maxUnemployment = u
      if (!isNaN(g) && g < minGDP) minGDP = g
      if (!isNaN(i) && i > maxInflation) maxInflation = i
    }
    return {
      maxUnemployment: isFinite(maxUnemployment) ? maxUnemployment : 0,
      minGDP: isFinite(minGDP) ? minGDP : 0,
      maxInflation: isFinite(maxInflation) ? maxInflation : 0,
    }
  }, [results])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('crises.title')}</h2>
          <p className="text-muted-foreground">{t('crises.description')}</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3" />
          +25 XP
        </Badge>
      </div>

      {/* Initial Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crises.initialIndicators')}</CardTitle>
          <CardDescription>{t('crises.initialIndicatorsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>{t('crises.indicator.gdpGrowth')}</Label>
              <Input
                type="number"
                step="0.1"
                value={indicators.gdpGrowth}
                onChange={(e) => updateIndicator('gdpGrowth', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('crises.indicator.unemployment')}</Label>
              <Input
                type="number"
                step="0.1"
                value={indicators.unemployment}
                onChange={(e) => updateIndicator('unemployment', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('crises.indicator.inflation')}</Label>
              <Input
                type="number"
                step="0.1"
                value={indicators.inflation}
                onChange={(e) => updateIndicator('inflation', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('crises.indicator.debtToGDP')}</Label>
              <Input
                type="number"
                step="0.1"
                value={indicators.debtToGDP}
                onChange={(e) => updateIndicator('debtToGDP', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('crises.indicator.interestRate')}</Label>
              <Input
                type="number"
                step="0.1"
                value={indicators.interestRate}
                onChange={(e) => updateIndicator('interestRate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crises.selectScenario')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label={t('crises.selectScenario')} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                role="radio"
                aria-checked={selectedScenario === scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario.id)
                  setResults(null)
                }}
                className={`p-4 rounded-lg border-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  selectedScenario === scenario.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-sm">{t(scenario.nameKey)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t(scenario.descriptionKey)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={runSimulation} disabled={!selectedScenario} className="flex-1" size="lg">
          <Play className="h-4 w-4 mr-2" />
          {t('crises.runSimulation')}
        </Button>
        <Button onClick={resetSimulation} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('crises.reset')}
        </Button>
      </div>

      {/* Results */}
      {results && selectedScenarioData && (
        <div className="space-y-4">
          {/* Peak Impact Summary */}
          {peakImpact && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    {t('crises.peakUnemployment')}
                  </CardDescription>
                  <CardTitle className="text-2xl text-red-600">{peakImpact.maxUnemployment.toFixed(1)}%</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-2 border-orange-200 dark:border-orange-900">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-orange-500" />
                    {t('crises.minGDP')}
                  </CardDescription>
                  <CardTitle className="text-2xl text-orange-600">{peakImpact.minGDP.toFixed(1)}%</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-2 border-amber-200 dark:border-amber-900">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-amber-500" />
                    {t('crises.peakInflation')}
                  </CardDescription>
                  <CardTitle className="text-2xl text-amber-600">{peakImpact.maxInflation.toFixed(1)}%</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crises.timeline')}</CardTitle>
              <CardDescription>{t('crises.timelineDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="gdpGrowth" stroke="var(--color-gdpGrowth)" strokeWidth={2} name={t('crises.chart.gdpGrowth')} />
                    <Line type="monotone" dataKey="unemployment" stroke="var(--color-unemployment)" strokeWidth={2} name={t('crises.chart.unemployment')} />
                    <Line type="monotone" dataKey="inflation" stroke="var(--color-inflation)" strokeWidth={2} name={t('crises.chart.inflation')} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crises.resultsTable')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Economic crises comparison">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('crises.year')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('crises.chart.gdpGrowth')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('crises.chart.unemployment')}</th>
                      <th className="text-right py-2 px-3 font-medium">{t('crises.chart.inflation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={`crisis-row-${idx}`} className="border-b last:border-0">
                        <td className="py-2 px-3">{row.year}</td>
                        <td className={`text-right py-2 px-3 font-mono ${getNum(row, 'gdpGrowth') < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {getNum(row, 'gdpGrowth').toFixed(1)}%
                        </td>
                        <td className="text-right py-2 px-3 font-mono">{getNum(row, 'unemployment').toFixed(1)}%</td>
                        <td className={`text-right py-2 px-3 font-mono ${getNum(row, 'inflation') > 10 ? 'text-red-600' : ''}`}>
                          {getNum(row, 'inflation').toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crises.education')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">{t('crises.whatHappened')}</p>
                <p className="text-muted-foreground">{t(selectedScenarioData.explanationKey)}</p>
              </div>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">{t('crises.recovery')}</p>
                <p className="text-muted-foreground">{t(selectedScenarioData.recoveryKey)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Formulas */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crises.formulas.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('crises.formula.gdpDrop')}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('crises.formula.unemploymentRise')}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-mono text-center">{t('crises.formula.inflationSpike')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
});
