'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
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
import { TrendingUp, RotateCcw, Info, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'

export function ADASModel() {
  const { t } = useI18n()
  const [consumption, setConsumption] = useState(500)
  const [investment, setInvestment] = useState(300)
  const [govSpending, setGovSpending] = useState(400)
  const [netExports, setNetExports] = useState(50)
  const [wageLevel, setWageLevel] = useState(1.0)
  const [inputPrices, setInputPrices] = useState(1.0)
  const [productivity, setProductivity] = useState(1.0)
  const [potentialGDP, setPotentialGDP] = useState(2000)
  const [activeTab, setActiveTab] = useState('explore')

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const { toast } = useToast()
  const xpAwardedRef = useRef(false)

  const awardXp = useCallback(() => {
    if (!xpAwardedRef.current) {
      xpAwardedRef.current = true
      addModuleInteraction({ moduleId: 'adas', action: 'explore', xpEarned: MODULE_XP['adas'] ?? 0 })
    }
  }, [addModuleInteraction])

  // AD curve: Y = (C + I + G + NX) / P — simplified quantity theory approach
  // Higher price level reduces real spending
  const adData = useMemo(() => {
    const nominalDemand = consumption + investment + govSpending + netExports
    const points: Array<{ price: number; ad: number; sras: number; lras: number }> = []
    for (let p = 0.2; p <= 3.0; p += 0.05) {
      const pRounded = Math.round(p * 100) / 100
      const ad = nominalDemand / pRounded
      points.push({ price: pRounded, ad: Math.round(ad), sras: 0, lras: 0 })
    }
    return points
  }, [consumption, investment, govSpending, netExports])

  // SRAS curve: Y = Y* + α(P - P_expected), where P_expected depends on wages and input prices
  // Expected price level from wage/input cost pressures
  const expectedPrice = useMemo(() => {
    return wageLevel * inputPrices / productivity
  }, [wageLevel, inputPrices, productivity])

  // SRAS: upward sloping from potential GDP at expected price level
  const srasData = useMemo(() => {
    const alpha = 500 // sensitivity of output to price surprises
    return adData.map((point) => ({
      ...point,
      sras: Math.round(potentialGDP + alpha * (point.price - expectedPrice)),
    }))
  }, [adData, expectedPrice, potentialGDP])

  // LRAS: vertical line at potential GDP
  const finalData = useMemo(() => {
    return srasData.map((point) => ({
      ...point,
      lras: potentialGDP,
    }))
  }, [srasData, potentialGDP])

  // Equilibrium: AD = SRAS intersection
  const equilibrium = useMemo(() => {
    for (let i = 1; i < finalData.length; i++) {
      const prev = finalData[i - 1]
      const curr = finalData[i]
      // Check if AD and SRAS cross between these points
      const prevDiff = prev.ad - prev.sras
      const currDiff = curr.ad - curr.sras
      if ((prevDiff >= 0 && currDiff <= 0) || (prevDiff <= 0 && currDiff >= 0)) {
        // Linear interpolation
        const t2 = Math.abs(prevDiff) / (Math.abs(prevDiff) + Math.abs(currDiff))
        const eqPrice = prev.price + t2 * (curr.price - prev.price)
        const eqOutput = prev.ad + t2 * (curr.ad - prev.ad)
        return {
          price: Math.round(eqPrice * 100) / 100,
          output: Math.round(eqOutput),
        }
      }
    }
    return { price: 1.0, output: potentialGDP }
  }, [finalData, potentialGDP])

  const outputGap = useMemo(() => {
    return equilibrium.output - potentialGDP
  }, [equilibrium.output, potentialGDP])

  const gapPercent = useMemo(() => {
    return ((outputGap / potentialGDP) * 100).toFixed(1)
  }, [outputGap, potentialGDP])

  const handleSliderChange = useCallback((setter: (v: number) => void) => (value: number[]) => {
    setter(value[0])
    awardXp()
  }, [awardXp])

  const reset = () => {
    setConsumption(500)
    setInvestment(300)
    setGovSpending(400)
    setNetExports(50)
    setWageLevel(1.0)
    setInputPrices(1.0)
    setProductivity(1.0)
    setPotentialGDP(2000)
    toast({ title: t('adas.resetToast'), description: t('adas.resetToastDesc') })
  }

  const applyScenario = (scenario: 'demandShock' | 'supplyShock' | 'stagflation' | 'recovery') => {
    awardXp()
    switch (scenario) {
      case 'demandShock':
        setConsumption(700)
        setInvestment(450)
        setGovSpending(500)
        break
      case 'supplyShock':
        setWageLevel(1.5)
        setInputPrices(1.4)
        setProductivity(0.8)
        break
      case 'stagflation':
        setConsumption(350)
        setInvestment(200)
        setWageLevel(1.3)
        setInputPrices(1.3)
        break
      case 'recovery':
        setConsumption(600)
        setInvestment(400)
        setGovSpending(450)
        setProductivity(1.2)
        setWageLevel(0.9)
        break
    }
    toast({
      title: t(`adas.scenario.${scenario}`),
      description: t(`adas.scenario.${scenario}Desc`),
    })
  }

  const gapType = outputGap > 0 ? 'inflationary' : outputGap < 0 ? 'recessionary' : 'equilibrium'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                {t('module.adas.title')}
              </CardTitle>
              <CardDescription>{t('module.adas.description')}</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 text-yellow-500 mr-1" />
              +{MODULE_XP['adas'] ?? 0} XP
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="explore">{t('adas.tab.explore')}</TabsTrigger>
          <TabsTrigger value="scenarios">{t('adas.tab.scenarios')}</TabsTrigger>
          <TabsTrigger value="theory">{t('adas.tab.theory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-4">
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('adas.chart.title')}</CardTitle>
              <CardDescription>{t('adas.chart.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={finalData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="price"
                      label={{ value: t('adas.chart.priceAxis'), position: 'insideBottom', offset: -5, fontSize: 12 }}
                      fontSize={12}
                      tickFormatter={(v: number) => v.toFixed(1)}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      label={{ value: t('adas.chart.outputAxis'), angle: -90, position: 'insideLeft', offset: 5, fontSize: 12 }}
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
                        if (name === 'ad') return [value.toLocaleString(), t('adas.chart.ad')]
                        if (name === 'sras') return [value.toLocaleString(), t('adas.chart.sras')]
                        if (name === 'lras') return [value.toLocaleString(), t('adas.chart.lras')]
                        return [value, name]
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        if (value === 'ad') return t('adas.chart.ad')
                        if (value === 'sras') return t('adas.chart.sras')
                        if (value === 'lras') return t('adas.chart.lras')
                        return value
                      }}
                    />
                    <Line type="monotone" dataKey="ad" stroke="CHART_COLORS.blue" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="sras" stroke="CHART_COLORS.red" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="lras" stroke="CHART_COLORS.green" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <ReferenceDot
                      x={equilibrium.price}
                      y={equilibrium.output}
                      r={5}
                      fill="CHART_COLORS.yellow"
                      stroke="#d97706"
                      strokeWidth={2}
                      label={{ value: 'E', position: 'top', fill: 'CHART_COLORS.yellow', fontSize: 14, fontWeight: 'bold' }}
                    />
                    <ReferenceLine
                      y={potentialGDP}
                      stroke="CHART_COLORS.green"
                      strokeDasharray="3 3"
                      label={{ value: t('adas.chart.potentialGDP'), position: 'right', fill: 'CHART_COLORS.green', fontSize: 11 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Equilibrium Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">{t('adas.summary.eqPrice')}</div>
                  <div className="font-bold text-lg">{equilibrium.price.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">{t('adas.summary.eqOutput')}</div>
                  <div className="font-bold text-lg">{equilibrium.output.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">{t('adas.summary.outputGap')}</div>
                  <div className={`font-bold text-lg ${outputGap > 0 ? 'text-red-600' : outputGap < 0 ? 'text-blue-600' : 'text-green-600'}`}>
                    {outputGap > 0 ? '+' : ''}{gapPercent}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">{t('adas.summary.gapType')}</div>
                  <Badge
                    variant={gapType === 'equilibrium' ? 'default' : 'outline'}
                    className={gapType === 'inflationary' ? 'text-red-600' : gapType === 'recessionary' ? 'text-blue-600' : ''}
                  >
                    {t(`adas.gap.${gapType}`)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AD Shifters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-blue-600">{t('adas.shifters.ad')}</CardTitle>
                <CardDescription>{t('adas.shifters.adDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.consumption')}</Label>
                    <span className="font-mono">{consumption}</span>
                  </div>
                  <Slider value={[consumption]} min={100} max={1000} step={10} onValueChange={handleSliderChange(setConsumption)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.investment')}</Label>
                    <span className="font-mono">{investment}</span>
                  </div>
                  <Slider value={[investment]} min={50} max={800} step={10} onValueChange={handleSliderChange(setInvestment)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.govSpending')}</Label>
                    <span className="font-mono">{govSpending}</span>
                  </div>
                  <Slider value={[govSpending]} min={0} max={800} step={10} onValueChange={handleSliderChange(setGovSpending)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.netExports')}</Label>
                    <span className="font-mono">{netExports}</span>
                  </div>
                  <Slider value={[netExports]} min={-200} max={400} step={10} onValueChange={handleSliderChange(setNetExports)} />
                </div>
              </CardContent>
            </Card>

            {/* SRAS Shifters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-600">{t('adas.shifters.sras')}</CardTitle>
                <CardDescription>{t('adas.shifters.srasDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.wageLevel')}</Label>
                    <span className="font-mono">{wageLevel.toFixed(1)}x</span>
                  </div>
                  <Slider value={[wageLevel]} min={0.5} max={2.0} step={0.1} onValueChange={handleSliderChange(setWageLevel)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.inputPrices')}</Label>
                    <span className="font-mono">{inputPrices.toFixed(1)}x</span>
                  </div>
                  <Slider value={[inputPrices]} min={0.5} max={2.0} step={0.1} onValueChange={handleSliderChange(setInputPrices)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.productivity')}</Label>
                    <span className="font-mono">{productivity.toFixed(1)}x</span>
                  </div>
                  <Slider value={[productivity]} min={0.5} max={2.0} step={0.1} onValueChange={handleSliderChange(setProductivity)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{t('adas.slider.potentialGDP')}</Label>
                    <span className="font-mono">{potentialGDP.toLocaleString()}</span>
                  </div>
                  <Slider value={[potentialGDP]} min={1000} max={4000} step={50} onValueChange={handleSliderChange(setPotentialGDP)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('adas.reset')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('adas.scenarios.title')}</CardTitle>
              <CardDescription>{t('adas.scenarios.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => applyScenario('demandShock')}>
                  <div className="text-left">
                    <div className="font-semibold">{t('adas.scenario.demandShock')}</div>
                    <div className="text-xs text-muted-foreground">{t('adas.scenario.demandShockDesc')}</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => applyScenario('supplyShock')}>
                  <div className="text-left">
                    <div className="font-semibold">{t('adas.scenario.supplyShock')}</div>
                    <div className="text-xs text-muted-foreground">{t('adas.scenario.supplyShockDesc')}</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => applyScenario('stagflation')}>
                  <div className="text-left">
                    <div className="font-semibold">{t('adas.scenario.stagflation')}</div>
                    <div className="text-xs text-muted-foreground">{t('adas.scenario.stagflationDesc')}</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => applyScenario('recovery')}>
                  <div className="text-left">
                    <div className="font-semibold">{t('adas.scenario.recovery')}</div>
                    <div className="text-xs text-muted-foreground">{t('adas.scenario.recoveryDesc')}</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                {t('adas.theory.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold text-blue-600">{t('adas.theory.adTitle')}</h4>
                <p className="text-muted-foreground mt-1">{t('adas.theory.adContent')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-red-600">{t('adas.theory.srasTitle')}</h4>
                <p className="text-muted-foreground mt-1">{t('adas.theory.srasContent')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-600">{t('adas.theory.lrasTitle')}</h4>
                <p className="text-muted-foreground mt-1">{t('adas.theory.lrasContent')}</p>
              </div>
              <div>
                <h4 className="font-semibold">{t('adas.theory.equilibriumTitle')}</h4>
                <p className="text-muted-foreground mt-1">{t('adas.theory.equilibriumContent')}</p>
              </div>
              <div>
                <h4 className="font-semibold">{t('adas.theory.gapsTitle')}</h4>
                <p className="text-muted-foreground mt-1">{t('adas.theory.gapsContent')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
