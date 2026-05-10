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
import { useI18n } from '@/lib/i18n-provider'
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

function generateCompoundProblem(t: (key: string) => string): CompoundProblem {
  const principal = (Math.floor(Math.random() * 90) + 10) * 1000
  const rate = (Math.floor(Math.random() * 15) + 3)
  const years = Math.floor(Math.random() * 8) + 2
  const compounding = [1, 2, 4, 12][Math.floor(Math.random() * 4)]
  const answer = principal * Math.pow(1 + rate / 100 / compounding, compounding * years)
  const compLabel =
    compounding === 1 ? t('finance.compounding.annually') : compounding === 2 ? t('finance.compounding.semiannually') : compounding === 4 ? t('finance.compounding.quarterly') : t('finance.compounding.monthly')

  return {
    principal,
    rate,
    years,
    compounding,
    answer,
    question: t('finance.problem.compound')
      .replace('{principal}', principal.toLocaleString('ru-RU'))
      .replace('{rate}', String(rate))
      .replace('{years}', String(years))
      .replace('{compounding}', compLabel),
  }
}

function generateNPVProblem(t: (key: string) => string): NPVProblem {
  const initialInvestment = (Math.floor(Math.random() * 40) + 10) * 1000
  const rate = Math.floor(Math.random() * 12) + 5
  const numYears = Math.floor(Math.random() * 3) + 3
  const cashFlows = Array.from({ length: numYears }, () =>
    (Math.floor(Math.random() * 20) + 3) * 1000
  )
  const npv =
    cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate / 100, i + 1), 0) - initialInvestment

  const cashFlowsStr = cashFlows.map((cf, i) => t('finance.npvCashFlow.year').replace('{year}', String(i + 1)) + ' ' + cf.toLocaleString('ru-RU')).join(', ')

  return {
    initialInvestment,
    cashFlows,
    rate,
    answer: npv,
    question: t('finance.problem.npv')
      .replace('{investment}', initialInvestment.toLocaleString('ru-RU'))
      .replace('{rate}', String(rate))
      .replace('{cashFlows}', cashFlowsStr),
  }
}

function generateAnnuityProblem(t: (key: string) => string): { question: string; answer: number; pmf: number; rate: number; years: number } {
  const rate = Math.floor(Math.random() * 10) + 3
  const years = Math.floor(Math.random() * 10) + 5
  const futureValue = (Math.floor(Math.random() * 50) + 10) * 10000
  const r = rate / 100
  const pmf = futureValue * (r / (Math.pow(1 + r, years) - 1))

  return {
    question: t('finance.problem.annuity')
      .replace('{years}', String(years))
      .replace('{futureValue}', futureValue.toLocaleString('ru-RU'))
      .replace('{rate}', String(rate)),
    answer: pmf,
    pmf,
    rate,
    years,
  }
}

export function FinancialMath() {
  const { t, locale } = useI18n()
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
        toast({ title: t('finance.enterNumber'), description: t('finance.enterNumberDesc'), variant: 'destructive' })
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
    [userAnswer, addFinanceResult, toast, t]
  )

  const newCompoundProblem = useCallback(() => {
    setCompoundProblem(generateCompoundProblem(t))
    setUserAnswer('')
    setShowResult(false)
  }, [t])

  const newNPVProblem = useCallback(() => {
    setNPVProblem(generateNPVProblem(t))
    setUserAnswer('')
    setShowResult(false)
  }, [t])

  const newAnnuityProblem = useCallback(() => {
    setAnnuityProblem(generateAnnuityProblem(t))
    setUserAnswer('')
    setShowResult(false)
  }, [t])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">{totalAttempted}</div>
          <div className="text-xs text-muted-foreground">{t('finance.solved')}</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">
            {totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%
          </div>
          <div className="text-xs text-muted-foreground">{t('finance.accuracy')}</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="text-xl font-bold">{streak}</div>
          <div className="text-xs text-muted-foreground">{t('finance.streak')}</div>
        </div>
      </div>

      <Tabs defaultValue="compound" className="w-full" onValueChange={() => { setUserAnswer(''); setShowResult(false); setIsCorrect(false) }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compound" className="text-xs sm:text-sm">
            <Percent className="h-4 w-4 mr-1" />
            {t('finance.tab.compound')}
          </TabsTrigger>
          <TabsTrigger value="npv" className="text-xs sm:text-sm">
            <DollarSign className="h-4 w-4 mr-1" />
            {t('finance.tab.npv')}
          </TabsTrigger>
          <TabsTrigger value="annuity" className="text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            {t('finance.tab.annuity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {t('finance.compound.title')}
              </CardTitle>
              <CardDescription>
                {t('finance.compound.formula')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!compoundProblem ? (
                <Button onClick={newCompoundProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  {t('finance.generateProblem')}
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {compoundProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>{t('finance.yourAnswer.rub')}</Label>
                      <Input
                        type="number"
                        placeholder={t('finance.placeholder.futureValue')}
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
                        {t('finance.check')}
                      </Button>
                    ) : (
                      <Button onClick={newCompoundProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('finance.new')}
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
                          {isCorrect ? t('finance.correct') : t('finance.incorrect')}
                        </span>
                      </div>
                      <div className="text-sm">
                        {t('finance.correctAnswer')} <strong>{compoundProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {t('finance.rub')}</strong>
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
                {t('finance.npv.title')}
              </CardTitle>
              <CardDescription>
                {t('finance.npv.formula')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!npvProblem ? (
                <Button onClick={newNPVProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  {t('finance.generateProblem')}
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {npvProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>{t('finance.yourAnswer.rub')}</Label>
                      <Input
                        type="number"
                        placeholder={t('finance.placeholder.npv')}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="font-mono"
                      />
                    </div>
                    {!showResult ? (
                      <Button onClick={() => checkAnswer(npvProblem.answer, 'NPV')} className="mt-6">
                        {t('finance.check')}
                      </Button>
                    ) : (
                      <Button onClick={newNPVProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('finance.new')}
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
                          {isCorrect ? t('finance.correct') : t('finance.incorrect')}
                        </span>
                      </div>
                      <div className="text-sm">
                        {t('finance.correctAnswer')} <strong>{npvProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {t('finance.rub')}</strong>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {npvProblem.answer > 0
                          ? t('finance.npv.profitable')
                          : t('finance.npv.unprofitable')}
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
                {t('finance.annuity.title')}
              </CardTitle>
              <CardDescription>
                {t('finance.annuity.formula')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!annuityProblem ? (
                <Button onClick={newAnnuityProblem} className="w-full" size="lg">
                  <Calculator className="h-4 w-4 mr-2" />
                  {t('finance.generateProblem')}
                </Button>
              ) : (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg text-sm leading-relaxed">
                    {annuityProblem.question}
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label>{t('finance.yourAnswer.rubPerYear')}</Label>
                      <Input
                        type="number"
                        placeholder={t('finance.placeholder.annuity')}
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={showResult}
                        className="font-mono"
                      />
                    </div>
                    {!showResult ? (
                      <Button onClick={() => checkAnswer(annuityProblem.answer, 'Аннуитет')} className="mt-6">
                        {t('finance.check')}
                      </Button>
                    ) : (
                      <Button onClick={newAnnuityProblem} variant="outline" className="mt-6">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('finance.new')}
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
                          {isCorrect ? t('finance.correct') : t('finance.incorrect')}
                        </span>
                      </div>
                      <div className="text-sm">
                        {t('finance.correctAnswer')} <strong>{annuityProblem.answer.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} {t('finance.rubPerYear')}</strong>
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
          <CardTitle className="text-lg">{t('finance.formulaRef.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('finance.formulaRef.compound')}</strong> FV = PV × (1 + r/n)^(n×t)
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('finance.formulaRef.npv')}</strong> NPV = -I₀ + Σ CFt / (1 + r)^t
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('finance.formulaRef.annuity')}</strong> PMT = FV × r / ((1 + r)^n - 1)
          </div>
          <Separator />
          <div className="p-3 bg-muted/50 rounded-lg">
            <strong>{t('finance.formulaRef.fisher')}</strong> {t('finance.formulaRef.fisherDesc')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
