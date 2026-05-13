'use client'

import { useState, useMemo } from 'react'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Globe, RotateCcw, Info, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CountryData {
  name: string
  goodA: number // hours per unit
  goodB: number
}

export function ComparativeAdvantage() {
  const { t } = useI18n()
  const [country1, setCountry1] = useState<CountryData>({ name: 'Country A', goodA: 2, goodB: 4 })
  const [country2, setCountry2] = useState<CountryData>({ name: 'Country B', goodA: 6, goodB: 6 })
  const [showResult, setShowResult] = useState(false)
  const { toast } = useToast()

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  const c1Name = t('comparative.countryA')
  const c2Name = t('comparative.countryB')

  const analysis = useMemo(() => {
    // Opportunity cost: how many B per 1 A, and how many A per 1 B
    const c1OcA = country1.goodA / country1.goodB // cost of A in terms of B
    const c1OcB = country1.goodB / country1.goodA // cost of B in terms of A
    const c2OcA = country2.goodA / country2.goodB
    const c2OcB = country2.goodB / country2.goodA

    const advA = c1OcA < c2OcA ? c1Name : c1OcA > c2OcA ? c2Name : t('comparative.noAdvantage')
    const advB = c1OcB < c2OcB ? c1Name : c1OcB > c2OcB ? c2Name : t('comparative.noAdvantage')

    // Absolute advantage
    const absAdvA = country1.goodA < country2.goodA ? c1Name : country1.goodA > country2.goodA ? c2Name : t('comparative.noAdvantage')
    const absAdvB = country1.goodB < country2.goodB ? c1Name : country1.goodB > country2.goodB ? c2Name : t('comparative.noAdvantage')

    // Gains from trade (specialization)
    // Assume each country has 24 hours
    const hours = 24
    const c1_before_A = hours / (country1.goodA + country1.goodB) * 0.5 // split equally
    const c1_before_B = hours / (country1.goodA + country1.goodB) * 0.5

    // Before trade: each produces both
    const c1ProdA_before = Math.floor(hours / 2 / country1.goodA * 10) / 10
    const c1ProdB_before = Math.floor(hours / 2 / country1.goodB * 10) / 10
    const c2ProdA_before = Math.floor(hours / 2 / country2.goodA * 10) / 10
    const c2ProdB_before = Math.floor(hours / 2 / country2.goodB * 10) / 10

    // After trade: each specializes in comparative advantage good
    const c1SpecializesA = c1OcA < c2OcA
    const c1ProdA_after = c1SpecializesA ? Math.floor(hours / country1.goodA * 10) / 10 : 0
    const c1ProdB_after = !c1SpecializesA ? Math.floor(hours / country1.goodB * 10) / 10 : 0
    const c2ProdA_after = !c1SpecializesA ? Math.floor(hours / country2.goodA * 10) / 10 : 0
    const c2ProdB_after = c1SpecializesA ? Math.floor(hours / country2.goodB * 10) / 10 : 0

    const chartData = [
      {
        name: `${c1Name} (${t('comparative.before')})`,
        [t('comparative.good') + ' A']: c1ProdA_before,
        [t('comparative.good') + ' B']: c1ProdB_before,
      },
      {
        name: `${c1Name} (${t('comparative.after')})`,
        [t('comparative.good') + ' A']: c1ProdA_after,
        [t('comparative.good') + ' B']: c1ProdB_after,
      },
      {
        name: `${c2Name} (${t('comparative.before')})`,
        [t('comparative.good') + ' A']: c2ProdA_before,
        [t('comparative.good') + ' B']: c2ProdB_before,
      },
      {
        name: `${c2Name} (${t('comparative.after')})`,
        [t('comparative.good') + ' A']: c2ProdA_after,
        [t('comparative.good') + ' B']: c2ProdB_after,
      },
    ]

    const totalA_before = c1ProdA_before + c2ProdA_before
    const totalB_before = c1ProdB_before + c2ProdB_before
    const totalA_after = c1ProdA_after + c2ProdA_after
    const totalB_after = c1ProdB_after + c2ProdB_after

    return {
      c1OcA, c1OcB, c2OcA, c2OcB,
      advA, advB, absAdvA, absAdvB,
      chartData,
      totalA_before, totalB_before,
      totalA_after, totalB_after,
      c1SpecializesA,
      c1ProdA_before, c1ProdB_before,
      c2ProdA_before, c2ProdB_before,
      c1ProdA_after, c1ProdB_after,
      c2ProdA_after, c2ProdB_after,
    }
  }, [country1, country2])

  const reset = () => {
    setCountry1({ name: t('comparative.countryA'), goodA: 2, goodB: 4 })
    setCountry2({ name: t('comparative.countryB'), goodA: 6, goodB: 6 })
    setShowResult(false)
    toast({ title: t('comparative.reset'), description: '' })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('comparative.title')}
          </CardTitle>
          <CardDescription>
            {t('comparative.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Country A */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{c1Name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{t('comparative.goodA')}</Label>
                  <Input
                    type="number"
                    value={country1.goodA || ''}
                    onChange={(e) => {
                      setCountry1({ ...country1, goodA: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('comparative.goodB')}</Label>
                  <Input
                    type="number"
                    value={country1.goodB || ''}
                    onChange={(e) => {
                      setCountry1({ ...country1, goodB: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Country B */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold">{c2Name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">{t('comparative.goodA')}</Label>
                  <Input
                    type="number"
                    value={country2.goodA || ''}
                    onChange={(e) => {
                      setCountry2({ ...country2, goodA: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{t('comparative.goodB')}</Label>
                  <Input
                    type="number"
                    value={country2.goodB || ''}
                    onChange={(e) => {
                      setCountry2({ ...country2, goodB: parseFloat(e.target.value) || 0 })
                      setShowResult(false)
                    }}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => { setShowResult(true); addModuleInteraction({ moduleId: 'comparative', action: 'calculate', xpEarned: MODULE_XP['comparative'] }) }} className="flex-1" size="lg">
              <Globe className="h-4 w-4 mr-2" />
              {t('comparative.calculate')}
            </Button>
            <Button onClick={reset} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResult && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('comparative.opportunityCost')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{c1Name}:</strong> 1A = {analysis.c1OcA.toFixed(2)}B, 1B = {analysis.c1OcB.toFixed(2)}A
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{c2Name}:</strong> 1A = {analysis.c2OcA.toFixed(2)}B, 1B = {analysis.c2OcB.toFixed(2)}A
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('comparative.advantages')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <strong>{t('comparative.absolute')}:</strong> A — {analysis.absAdvA}, B — {analysis.absAdvB}
                </div>
                <div className="p-2 bg-primary/5 rounded">
                  <strong>{t('comparative.comparative')}:</strong> A — {analysis.advA}, B — {analysis.advB}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{t('comparative.gainsTitle')}</CardTitle>
              <CardDescription>
                {analysis.c1SpecializesA
                  ? `${c1Name} ${t('comparative.specializes')} A, ${c2Name} — B`
                  : `${c1Name} ${t('comparative.specializes')} B, ${c2Name} — A`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey={t('comparative.good') + ' A'} fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={t('comparative.good') + ' B'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-lg text-sm space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  {t('comparative.totalGain')}:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-background rounded">
                    {t('comparative.good')} A: {analysis.totalA_before.toFixed(1)} → {analysis.totalA_after.toFixed(1)} {t('comparative.units')}
                    {analysis.totalA_after > analysis.totalA_before && (
                      <Badge variant="default" className="ml-2 text-xs">+{(analysis.totalA_after - analysis.totalA_before).toFixed(1)}</Badge>
                    )}
                  </div>
                  <div className="p-2 bg-background rounded">
                    {t('comparative.good')} B: {analysis.totalB_before.toFixed(1)} → {analysis.totalB_after.toFixed(1)} {t('comparative.units')}
                    {analysis.totalB_after > analysis.totalB_before && (
                      <Badge variant="default" className="ml-2 text-xs">+{(analysis.totalB_after - analysis.totalB_before).toFixed(1)}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('comparative.theoryTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>{t('comparative.theory.principle')}:</strong> {t('comparative.theory.principleText')}
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <strong>{t('comparative.theory.oc')}:</strong> {t('comparative.theory.ocText')}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
