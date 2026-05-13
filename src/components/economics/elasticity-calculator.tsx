'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEconomicsStore } from '@/store/economics-store'
import { Gauge, RotateCcw, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'

type ElasticityType = 'price' | 'income' | 'cross'

interface ElasticityResult {
  type: ElasticityType
  value: number
  interpretation: string
  category: string
}

export function ElasticityCalculator() {
  const [elasticityType, setElasticityType] = useState<ElasticityType>('price')

  // Price elasticity inputs
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  // Income elasticity inputs
  const [q1Inc, setQ1Inc] = useState('')
  const [q2Inc, setQ2Inc] = useState('')
  const [y1, setY1] = useState('')
  const [y2, setY2] = useState('')

  // Cross elasticity inputs
  const [q1Cross, setQ1Cross] = useState('')
  const [q2Cross, setQ2Cross] = useState('')
  const [px1, setPx1] = useState('')
  const [px2, setPx2] = useState('')

  const [result, setResult] = useState<ElasticityResult | null>(null)
  const addElasticityResult = useEconomicsStore((s) => s.addElasticityResult)
  const { toast } = useToast()
  const { t } = useI18n()

  const calculatePriceElasticity = useCallback(() => {
    const Q1 = parseFloat(q1), Q2 = parseFloat(q2)
    const P1 = parseFloat(p1), P2 = parseFloat(p2)
    if ([Q1, Q2, P1, P2].some((v) => isNaN(v)) || P1 === P2) {
      toast({ title: 'Ошибка', description: 'Заполните все поля корректно (P1 ≠ P2)', variant: 'destructive' })
      return
    }
    const midQ = (Q1 + Q2) / 2
    const midP = (P1 + P2) / 2
    const deltaQ = Q2 - Q1
    const deltaP = P2 - P1
    const ed = (deltaQ / midQ) / (deltaP / midP)

    let interpretation = ''
    let category = ''
    const absEd = Math.abs(ed)
    if (absEd > 1) { interpretation = 'Спрос эластичен — изменение цены ведёт к большему процентному изменению объёма спроса'; category = 'Эластичный' }
    else if (absEd === 1) { interpretation = 'Единичная эластичность — процентное изменение спроса равно процентному изменению цены'; category = 'Единичный' }
    else if (absEd > 0) { interpretation = 'Спрос неэластичен — изменение цены ведёт к меньшему процентному изменению объёма спроса'; category = 'Неэластичный' }
    else { interpretation = 'Абсолютно неэластичный спрос — объём не меняется при изменении цены'; category = 'Абс. неэластичный' }

    setResult({ type: 'price', value: ed, interpretation, category })
    addElasticityResult({ id: Date.now().toString(), elasticityType: 'price', value: ed, interpretation, category, date: new Date().toISOString() })
  }, [q1, q2, p1, p2, addElasticityResult, toast])

  const calculateIncomeElasticity = useCallback(() => {
    const Q1 = parseFloat(q1Inc), Q2 = parseFloat(q2Inc)
    const Y1 = parseFloat(y1), Y2 = parseFloat(y2)
    if ([Q1, Q2, Y1, Y2].some((v) => isNaN(v)) || Y1 === Y2) {
      toast({ title: 'Ошибка', description: 'Заполните все поля корректно (Y1 ≠ Y2)', variant: 'destructive' })
      return
    }
    const midQ = (Q1 + Q2) / 2
    const midY = (Y1 + Y2) / 2
    const ey = ((Q2 - Q1) / midQ) / ((Y2 - Y1) / midY)

    let interpretation = ''
    let category = ''
    if (ey > 1) { interpretation = 'Предмет роскоши — спрос растёт быстрее дохода (E > 1)'; category = 'Роскошь' }
    else if (ey > 0) { interpretation = 'Нормальный товар — спрос растёт с ростом дохода, но медленнее (0 < E < 1)'; category = 'Нормальный' }
    else if (ey === 0) { interpretation = 'Нейтральный товар — спрос не зависит от дохода'; category = 'Нейтральный' }
    else { interpretation = 'Низший товар — спрос падает с ростом дохода (E < 0)'; category = 'Низший' }

    setResult({ type: 'income', value: ey, interpretation, category })
    addElasticityResult({ id: Date.now().toString(), elasticityType: 'income', value: ey, interpretation, category, date: new Date().toISOString() })
  }, [q1Inc, q2Inc, y1, y2, addElasticityResult, toast])

  const calculateCrossElasticity = useCallback(() => {
    const Q1 = parseFloat(q1Cross), Q2 = parseFloat(q2Cross)
    const PX1 = parseFloat(px1), PX2 = parseFloat(px2)
    if ([Q1, Q2, PX1, PX2].some((v) => isNaN(v)) || PX1 === PX2) {
      toast({ title: 'Ошибка', description: 'Заполните все поля корректно (Px1 ≠ Px2)', variant: 'destructive' })
      return
    }
    const midQ = (Q1 + Q2) / 2
    const midPx = (PX1 + PX2) / 2
    const exy = ((Q2 - Q1) / midQ) / ((PX2 - PX1) / midPx)

    let interpretation = ''
    let category = ''
    if (exy > 0) { interpretation = 'Товары-субституты (заменители) — рост цены товара Y ведёт к росту спроса на товар X'; category = 'Субституты' }
    else if (exy < 0) { interpretation = 'Комплементарные товары (дополнители) — рост цены товара Y ведёт к падению спроса на товар X'; category = 'Комплементы' }
    else { interpretation = 'Независимые товары — цена товара Y не влияет на спрос товара X'; category = 'Независимые' }

    setResult({ type: 'cross', value: exy, interpretation, category })
    addElasticityResult({ id: Date.now().toString(), elasticityType: 'cross', value: exy, interpretation, category, date: new Date().toISOString() })
  }, [q1Cross, q2Cross, px1, px2, addElasticityResult, toast])

  const reset = useCallback(() => {
    setQ1(''); setQ2(''); setP1(''); setP2('')
    setQ1Inc(''); setQ2Inc(''); setY1(''); setY2('')
    setQ1Cross(''); setQ2Cross(''); setPx1(''); setPx2('')
    setResult(null)
  }, [])

  const getCategoryColor = () => {
    if (!result) return 'secondary'
    if (result.type === 'price') return Math.abs(result.value) > 1 ? 'destructive' : Math.abs(result.value) === 1 ? 'default' : 'secondary'
    if (result.type === 'income') return result.value < 0 ? 'destructive' : result.value > 1 ? 'default' : 'secondary'
    return result.value > 0 ? 'default' : result.value < 0 ? 'secondary' : 'outline'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            {t('module.elasticity.title')}
          </CardTitle>
          <CardDescription>
            {t('module.elasticity.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={elasticityType} onValueChange={(v) => { setElasticityType(v as ElasticityType); setResult(null) }}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="price">{t('elasticity.price')}</TabsTrigger>
              <TabsTrigger value="income">{t('elasticity.income')}</TabsTrigger>
              <TabsTrigger value="cross">{t('elasticity.cross')}</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q1')}</Label>
                  <Input type="number" placeholder="100" value={q1} onChange={(e) => setQ1(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q2')}</Label>
                  <Input type="number" placeholder="80" value={q2} onChange={(e) => setQ2(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.p1')}</Label>
                  <Input type="number" placeholder="50" value={p1} onChange={(e) => setP1(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.p2')}</Label>
                  <Input type="number" placeholder="60" value={p2} onChange={(e) => setP2(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={calculatePriceElasticity} className="flex-1">
                  <Gauge className="h-4 w-4 mr-2" />
                  {t('elasticity.button.calculate')}
                </Button>
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="income" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q1')}</Label>
                  <Input type="number" placeholder="50" value={q1Inc} onChange={(e) => setQ1Inc(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q2')}</Label>
                  <Input type="number" placeholder="70" value={q2Inc} onChange={(e) => setQ2Inc(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.y1')}</Label>
                  <Input type="number" placeholder="30000" value={y1} onChange={(e) => setY1(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.y2')}</Label>
                  <Input type="number" placeholder="50000" value={y2} onChange={(e) => setY2(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={calculateIncomeElasticity} className="flex-1">
                  <Gauge className="h-4 w-4 mr-2" />
                  {t('elasticity.button.calculate')}
                </Button>
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="cross" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q1')}</Label>
                  <Input type="number" placeholder="100" value={q1Cross} onChange={(e) => setQ1Cross(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.q2')}</Label>
                  <Input type="number" placeholder="120" value={q2Cross} onChange={(e) => setQ2Cross(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.px1')}</Label>
                  <Input type="number" placeholder="40" value={px1} onChange={(e) => setPx1(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>{t('elasticity.input.px2')}</Label>
                  <Input type="number" placeholder="50" value={px2} onChange={(e) => setPx2(e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={calculateCrossElasticity} className="flex-1">
                  <Gauge className="h-4 w-4 mr-2" />
                  {t('elasticity.button.calculate')}
                </Button>
                <Button onClick={reset} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>{t('elasticity.result.coefficient')}</CardDescription>
              <CardTitle className="text-2xl font-mono">
                {result.value.toFixed(3)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getCategoryColor() as "destructive" | "default" | "secondary" | "outline"} className="text-base px-3 py-1">
                {result.category}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <CardDescription>{t('elasticity.result.interpretation')}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{result.interpretation}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-4 w-4" />
            {t('elasticity.reference.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('elasticity.reference.price')}
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('elasticity.reference.income')}
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            {t('elasticity.reference.cross')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
