'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useEconomicsStore } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { questions, type Question } from '@/components/economics/quiz'
import { Flame, Target, Zap, CheckCircle2, XCircle, Sparkles, Clock } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const DAILY_QUESTIONS_COUNT = 3
const DAILY_TIME_PER_QUESTION = 15
const DAILY_BASE_XP = 30
const DAILY_PER_CORRECT_XP = 10

function getDailySeed(): number {
  const now = new Date()
  return parseInt(now.toLocaleDateString('en-CA').replace(/-/g, ''), 10)
}

function shuffleWithSeed(arr: Question[], seed: number): Question[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (seed * (i + 1) + i) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const DailyChallenge = memo(function DailyChallenge() {
  const { t } = useI18n()
  const dailyChallenges = useEconomicsStore((s) => s.dailyChallenges)
  const streakState = useEconomicsStore((s) => s.streakState)
  const completeDailyChallenge = useEconomicsStore((s) => s.completeDailyChallenge)

  const [today, setToday] = useState(() => new Date().toLocaleDateString('en-CA'))
  const todayRef = useRef(today)
  useEffect(() => { todayRef.current = today }, [today])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const updateToday = () => setToday(new Date().toLocaleDateString('en-CA'))
    const msUntilMidnight = (() => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      return midnight.getTime() - now.getTime()
    })()
    const timer = setTimeout(() => {
      updateToday()
      intervalRef.current = setInterval(updateToday, 86400000)
    }, msUntilMidnight + 1000)
    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
  const todayChallenge = useMemo(
    () => dailyChallenges.find((c) => c.date === today),
    [dailyChallenges, today]
  )
  const isCompleted = !!todayChallenge

  const [quizState, setQuizState] = useState<'idle' | 'active' | 'finished'>('idle')
  const [dailyQuestions, setDailyQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DAILY_TIME_PER_QUESTION)

  // Track score via ref to avoid stale closure issues in setTimeout
  const scoreRef = useRef(0)
  // Prevent double-calling processAnswer when timer expires and user clicks simultaneously
  const hasProcessedRef = useRef(false)

  // Helper to trigger re-renders when score changes (for UI updates)
  const [displayScore, setDisplayScore] = useState(0)

  const shouldReduceMotion = useReducedMotion()

  const startChallenge = useCallback(() => {
    const seed = getDailySeed()
    const selected = shuffleWithSeed(questions, seed).slice(0, DAILY_QUESTIONS_COUNT)
    setDailyQuestions(selected)
    setCurrentQ(0)
    setSelectedAnswer(null)
    setAnswered(false)
    scoreRef.current = 0
    hasProcessedRef.current = false
    setDisplayScore(0)
    setTimeLeft(DAILY_TIME_PER_QUESTION)
    setQuizState('active')
  }, [])

  const processAnswer = useCallback(
    (optionIndex: number) => {
      // Prevent double-processing from race between timer and user click
      if (hasProcessedRef.current) return
      hasProcessedRef.current = true

      const isCorrect = optionIndex === dailyQuestions[currentQ].correctAnswer
      if (isCorrect) {
        scoreRef.current += 1
        setDisplayScore((s) => s + 1)
      }

      if (currentQ + 1 >= DAILY_QUESTIONS_COUNT) {
        completeDailyChallenge({
          date: todayRef.current,
          score: scoreRef.current,
          total: DAILY_QUESTIONS_COUNT,
        })
        setQuizState('finished')
      } else {
        // Reset guard for next question
        hasProcessedRef.current = false
        setCurrentQ((q) => q + 1)
        setSelectedAnswer(null)
        setAnswered(false)
        setTimeLeft(DAILY_TIME_PER_QUESTION)
      }
    },
    [currentQ, dailyQuestions, completeDailyChallenge]
  )

  // Store timeout ref for cleanup on unmount or re-render
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Store timer expiry timeout ref for cleanup
  const timerExpiryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (answered) return
      setSelectedAnswer(optionIndex)
      setAnswered(true)

      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
      answerTimeoutRef.current = setTimeout(() => {
        processAnswer(optionIndex)
        answerTimeoutRef.current = null
      }, 1500)
    },
    [answered, processAnswer]
  )

  // Clean up pending timeout on unmount
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
      if (timerExpiryRef.current) clearTimeout(timerExpiryRef.current)
    }
  }, [])

  // Clear answer timeout when question changes to prevent stale closure
  useEffect(() => {
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current)
  }, [currentQ])

  // Countdown timer
  useEffect(() => {
    if (quizState !== 'active' || answered || timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [quizState, answered, timeLeft])

  // Timer - when time runs out, mark as answered and schedule next question
  useEffect(() => {
    if (quizState !== 'active' || answered || timeLeft > 0) return

    // Time's up - schedule answer marking and next question
    const timeout = setTimeout(() => {
      setSelectedAnswer(-1)
      setAnswered(true)
      processAnswer(-1)
    }, 1500)
    timerExpiryRef.current = timeout
    return () => clearTimeout(timeout)
  }, [quizState, answered, timeLeft, processAnswer])

  // Idle state - not completed today
  if (quizState === 'idle' && !isCompleted) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-yellow-50/50 dark:from-primary/5 dark:to-yellow-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {t('dailyChallenge.title')}
            </CardTitle>
            {streakState.currentStreak > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streakState.currentStreak} {t('dailyChallenge.streak')}
              </Badge>
            )}
          </div>
          <CardDescription>{t('dailyChallenge.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-background/80">
              <Zap className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
              <div className="text-lg font-bold">{DAILY_BASE_XP}</div>
              <div className="text-[10px] text-muted-foreground">{t('dailyChallenge.baseXP')}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/80">
              <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <div className="text-lg font-bold">+{DAILY_PER_CORRECT_XP}</div>
              <div className="text-[10px] text-muted-foreground">{t('dailyChallenge.perCorrect')}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/80">
              <Target className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold">{DAILY_QUESTIONS_COUNT}</div>
              <div className="text-[10px] text-muted-foreground">{t('dailyChallenge.today')}</div>
            </div>
          </div>
          <Button onClick={startChallenge} className="w-full" size="lg">
            <Flame className="h-4 w-4 mr-2" />
            {t('dailyChallenge.start')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Idle state - already completed today
  if (quizState === 'idle' && isCompleted) {
    const xpEarned = DAILY_BASE_XP + todayChallenge.score * DAILY_PER_CORRECT_XP
    return (
      <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-primary/5 dark:from-green-950/20 dark:to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {t('dailyChallenge.complete')}
            </CardTitle>
            {streakState.currentStreak > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                {streakState.currentStreak} {t('dailyChallenge.streak')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold">
              {todayChallenge.score}/{todayChallenge.total}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-semibold">+{xpEarned} XP</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('dailyChallenge.comingBack')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Active quiz state
  if (quizState === 'active' && dailyQuestions.length > 0) {
    const question = dailyQuestions[currentQ]
    const timerColor = timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-green-500'

    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-base">{t('dailyChallenge.title')}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {currentQ + 1}/{DAILY_QUESTIONS_COUNT}
              </Badge>
              <div className={`flex items-center gap-1 font-mono font-bold ${timerColor}`}>
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}{t('quiz.secondsSuffix')}
              </div>
            </div>
          </div>
          <Progress value={(timeLeft / DAILY_TIME_PER_QUESTION) * 100} className="h-1.5" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium text-sm">{question.question}</p>
          <div className="grid gap-2">
            {question.options.map((option, idx) => {
              let btnVariant: 'outline' | 'default' | 'destructive' | 'secondary' = 'outline'
              if (answered) {
                if (idx === question.correctAnswer) btnVariant = 'default'
                else if (idx === selectedAnswer) btnVariant = 'destructive'
              }
              return (
                <Button
                  key={`challenge-option-${idx}`}
                  variant={btnVariant}
                  className="justify-start text-left h-auto py-3 px-4 whitespace-normal"
                  onClick={() => handleAnswer(idx)}
                  disabled={answered}
                >
                  <span className="flex-1">{option}</span>
                  {answered && idx === question.correctAnswer && (
                    <CheckCircle2 className="h-4 w-4 text-green-400 ml-2 shrink-0" />
                  )}
                  {answered && idx === selectedAnswer && idx !== question.correctAnswer && (
                    <XCircle className="h-4 w-4 text-red-400 ml-2 shrink-0" />
                  )}
                </Button>
              )
            })}
          </div>
          {answered && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              className="text-xs text-muted-foreground p-3 rounded-lg bg-muted/50"
            >
              {question.explanation}
            </motion.div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Finished state
  if (quizState === 'finished') {
    const xpEarned = DAILY_BASE_XP + displayScore * DAILY_PER_CORRECT_XP
    return (
      <Card className="border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-50/50 to-primary/5 dark:from-yellow-950/20 dark:to-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {t('dailyChallenge.complete')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <div className="text-4xl font-bold">
              {displayScore}/{DAILY_QUESTIONS_COUNT}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span className="text-xl font-semibold">+{xpEarned} XP</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {DAILY_BASE_XP} {t('dailyChallenge.baseXP')} + {displayScore} × {DAILY_PER_CORRECT_XP} {t('dailyChallenge.perCorrect')}
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t('dailyChallenge.comingBack')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback (should not happen)
  return null
});
