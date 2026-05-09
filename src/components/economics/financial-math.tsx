'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useEconomicsStore } from '@/store/economics-store'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, Percent, TrendingUp, Calculator, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

interface CompoundProblem {
  principal: number
  rate: number
  years: number
  compounding: number
  answer: number
  question: string
}

interface NPVProblem {
  initialInvestment: number
  cashFlows: number[]
  rate: number
  answer: number
  question: string
}

function generateCompoundProblem(): CompoundProblem {
  const principal = (Math.floor(Math.random() * 90) + 10) * 1000
  const rate = (Math.floor(Math.random() * 15) + 3)
  const years = Math.floor(Math.random() * 8) + 2
  const compounding = [1, 2, 4, 12][Math.floor(Math.random() * 4)]
  const answer = principal * Math.pow(1 + rate / 100 / compounding, compounding * years)
  const compLabel =
    compounding === 1 ? 'ежегодно' : compounding === 2 ? 'по полугодиям' : compounding === 4 ? 'поквартально' : 'ежемесячно'

  return {
    principal,
    rate,
    years,
    compounding,
    answer,
    question: `Найдите будущую стоимость вклада ${principal.toLocaleString('ru-RU')} руб. под ${rate}% годовых на ${years} лет при ${compLabel} начислении процентов.`,
  }
}

function generateNPVProblem(): NPVProblem {
  const initialInvestment = (Math.floor(Math.random() * 40) + 10) * 1000
  const rate = Math.floor(Math.random() * 12) + 5
  const numYears = Math.floor(Math.random() * 3) + 3
  const cashFlows = Array.from({ length: numYears }, () =>
    (Math.floor(Math.random() * 20) + 3) * 1000
  )
  const npv =
    cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate / 100, i + 1), 0) - initialInvestment

  return {
    initialInvestment,
    cashFlows,
    rate,
    answer: npv,
    question: `Рассчитайте NPV проекта: начальные инвестиции ${initialInvestment.toLocaleString('ru-RU')} руб., ставка дисконтирования ${rate}%, денежные потоки: ${cashFlows.map((cf, i) => `${i + 1} год: ${cf.toLocaleString('ru-RU')}`).join(', ')} руб.`,
  }
}

function generateAnnuityProblem(): { question: string; answer: number; pmf: number; rate: number; years: number } {
  const rate = Math.floor(Math.random() * 10) + 3
  const years = Math.floor(Math.random() * 10) + 5
  const futureValue = (Math.floor(Math.random() * 50) + 10) * 10000
  const r = rate / 100
  const pmf = futureValue * (r / (Math.pow(1 + r, years) - 1))

  return {
    question: `Какой ежегодный платёж нужно вносить, чтобы через ${years} лет накопить ${futureValue.toLocaleString('ru-RU')} руб. при ставке ${rate}% годовых?`,
    answer: pmf,
    pmf,
    rate,
    years,
  }
}

export function FinancialMath() {
  const [compoundProblem, setCompoundProblem] = useState<CompoundProblem | null>(null)
  const [npvProblem, setNPVProblem] = useState<NPVProblem | null>(null)
  const [annuityProblem, setAnnuityProblem] = useState<{
    question: string
    answer: number
    pmf: number
    rate: number
    years: number
  } | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [streak, setStreak] = useState(0)
  const [totalAttempted, setTotalAttempted] = useState(0)
  const [totalCorrect, setTotalCorrect] = useState(0)
  const addFinanceResult = useEconomicsStore((s) => s.addFinanceResult)
  const { toast } = useToast()

  const checkAnswer = useCallback(
    (correctAnswer: number, problemType: string) => {
      const parsed = parseFloat(userAnswer.replace(',', '.'))
      if (isNaN(parsed)) {
        toast({ title: 'Введите число', description: 'Пожалуйста, введите числовой ответ', variant: 'destructive' })
        return
      }
      const tolerance = Math.max(Math.abs(correctAnswer) * 0.02, 100)
      const correct = Math.abs(parsed - correctAnswer) <= tolerance

      setIsCorrect(correct)
      setShowResult(true)
      setTotalAttempted((t) => t + 1)
      if (correct) {
        setTotalCorrect((c) => c + 1)
        setStreak((s) => s + 1)
      } else {
        setStreak(0)
      }

      addFinanceResult({
        id: Date.now().toString(),
        problemType,
        correct,
        userAnswer: parsed,
        correctAnswer,
        date: new Date().toISOString(),
      })
    },
    [userAnswer, addFinanceResult, toast]
  )

  const newCompoundProblem = useCallback(() => {
    setCompoundProblem(generateCompoundProblem())
    setUserAnswer('')
    setShowResult(false)
  }, [])

  const newNPVProblem = useCallback(() => {
    setNPVProblem(generateNPVProblem())
    setUserAnswer('')
    setShowResult(false)
  }, [])

  const newAnnuityProblem = useCallback(() => {
    setAnnuityProblem(generateAnnuityProblem())
    setUserAnswer('')
    setShowResult(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">{totalAttempted}</div>
          <div className="text-xs text-muted-foreground">Решено</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">
            {totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">Точность</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">{streak}</div>
          <div className="text-xs text-muted-foreground">Серия</div>
        </div>
      </div>

      <Tabs defaultValue="compound" className="w-full" onValueChange={() => { setUserAnswer(''); setShowResult(false); setIsCorrect(false) }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compound" className="text-xs sm:text-sm">
            <Percent className="h-4 w-4 mr-1" />
            Сложный процент
          </TabsTrigger>
          <TabsTrigger value="npv" className="text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 mr-1" />
            NPV
          </TabsTrigger>
          <TabsTrigger value="annuity" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            Аннуитет
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Сложные проценты
              </CardTitle>
              <CardDescription>
                Формула: FV = PV × (1 + r/n)^(n×t), где PV — начальная сумма, r — годовая ставка, n — число начислений в год, t — лет
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!compoundProblem ? (
                <Button onClick={newCompoundProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  Сгенерировать задачу
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {compoundProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>Ваш ответ (руб.)</Label>
                      <Input
                        type="number"
                        placeholder="Введите будущую стоимость..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="font-mono"
                      />
                    </div>
                    {!showResult ? (
                      <Button
                        onClick={() => checkAnswer(compoundProblem.answer, 'Сложный процент')}
                        className="mt-6"
                      >
                        Проверить
                      </Button>
                    ) : (
                      <Button onClick={newCompoundProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Новая
                      </Button>
                    )}
                  </div>
                  {showResult && (
                    <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {isCorrect ? 'Правильно!' : 'Неправильно'}
                        </span>
                      </div>
                      <div className="text-sm">
                        Правильный ответ: <strong>{compoundProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} руб.</strong>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        FV = {compoundProblem.principal.toLocaleString('ru-RU')} × (1 + {compoundProblem.rate}/{compoundProblem.compounding * 100})
                        ^({compoundProblem.compounding}×{compoundProblem.years})
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="npv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                NPV (Чистая приведённая стоимость)
              </CardTitle>
              <CardDescription>
                Формула: NPV = -I₀ + Σ(CFt / (1+r)^t), где I₀ — инвестиции, CFt — денежный поток периода t, r — ставка дисконтирования
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!npvProblem ? (
                <Button onClick={newNPVProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  Сгенерировать задачу
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {npvProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>Ваш ответ (руб.)</Label>
                      <Input
                        type="number"
                        placeholder="Введите NPV..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="font-mono"
                      />
                    </div>
                    {!showResult ? (
                      <Button onClick={() => checkAnswer(npvProblem.answer, 'NPV')} className="mt-6">
                        Проверить
                      </Button>
                    ) : (
                      <Button onClick={newNPVProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Новая
                      </Button>
                    )}
                  </div>
                  {showResult && (
                    <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {isCorrect ? 'Правильно!' : 'Неправильно'}
                        </span>
                      </div>
                      <div className="text-sm">
                        Правильный ответ: <strong>{npvProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} руб.</strong>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {npvProblem.answer > 0
                          ? 'NPV > 0 — проект прибыльный, стоит принять'
                          : 'NPV < 0 — проект убыточный, стоит отклонить'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annuity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Фонд накопления (Аннуитет)
              </CardTitle>
              <CardDescription>
                Формула: PMT = FV × r / ((1+r)^n - 1), где FV — целевая сумма, r — ставка за период, n — число периодов
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!annuityProblem ? (
                <Button onClick={newAnnuityProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  Сгенерировать задачу
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {annuityProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>Ваш ответ (руб./год)</Label>
                      <Input
                        type="number"
                        placeholder="Введите ежегодный платёж..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="font-mono"
                      />
                    </div>
                    {!showResult ? (
                      <Button onClick={() => checkAnswer(annuityProblem.answer, 'Аннуитет')} className="mt-6">
                        Проверить
                      </Button>
                    ) : (
                      <Button onClick={newAnnuityProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Новая
                      </Button>
                    )}
                  </div>
                  {showResult && (
                    <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {isCorrect ? 'Правильно!' : 'Неправильно'}
                        </span>
                      </div>
                      <div className="text-sm">
                        Правильный ответ: <strong>{annuityProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} руб./год</strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Справочник формул</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Сложный процент:</strong> FV = PV × (1 + r/n)^(n×t)
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>NPV:</strong> NPV = -I₀ + Σ CFt / (1 + r)^t
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Аннуитет (фонд накопления):</strong> PMT = FV × r / ((1 + r)^n - 1)
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>Уравнение Фишера:</strong> (1 + i) = (1 + r) × (1 + π), где i — номинальная ставка, r — реальная, π — инфляция
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
