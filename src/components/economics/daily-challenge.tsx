'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEconomicsStore } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { questions, type Question } from '@/lib/quiz-questions'
import { Flame, Target, Zap, CheckCircle2, XCircle, Sparkles, Clock } from 'lucide-react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { StreakCalendar } from '@/components/economics/streak-calendar'
import { Celebration } from '@/components/shared/celebration'

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
    }, msUntilMidnight)
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

  // Countdown until next daily challenge is available (only active when completed today)
  const [nextChallengeIn, setNextChallengeIn] = useState('')
  useEffect(() => {
    if (!isCompleted || quizState !== 'idle') return
    const updateCountdown = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      if (diff <= 0) {
        setNextChallengeIn('')
        return
      }
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      setNextChallengeIn(`${hours}${t('time.hoursShort')} ${minutes}${t('time.minutesShort')}`)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 60000)
    return () => clearInterval(timer)
  }, [isCompleted, quizState, t])

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

  // Keyboard shortcuts 1-4 to select an answer during active quiz
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizState !== 'active' || answered) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
      const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
      const idx = keyMap[e.key]
      if (idx !== undefined && idx < dailyQuestions[currentQ]?.options.length) {
        e.preventDefault()
        handleAnswer(idx)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizState, answered, currentQ, dailyQuestions, handleAnswer])

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
      <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
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
          <div className="mb-4">
            <StreakCalendar shouldReduceMotion={shouldReduceMotion} />
          </div>
          <Button onClick={startChallenge} className="w-full interactive-scale" size="lg">
            <Flame className="h-4 w-4 mr-2" />
            {t('dailyChallenge.start')}
          </Button>
        </CardContent>
      </Card>
      </motion.div>
    )
  }

  // Idle state - already completed today
  if (quizState === 'idle' && isCompleted) {
    const xpEarned = DAILY_BASE_XP + todayChallenge.score * DAILY_PER_CORRECT_XP

    return (
      <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
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
            {nextChallengeIn && (
              <div className="text-xs text-muted-foreground">
                {t('dailyChallenge.nextIn')} {nextChallengeIn}
              </div>
            )}
            <div className="py-2">
              <StreakCalendar shouldReduceMotion={shouldReduceMotion} />
            </div>
            <p className="text-sm text-muted-foreground">{t('dailyChallenge.comingBack')}</p>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    )
  }

  // Active quiz state
  if (quizState === 'active' && dailyQuestions.length > 0) {
    const question = dailyQuestions[currentQ]
    const timerColor = timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : 'text-green-500'
    const timerPercentage = (timeLeft / DAILY_TIME_PER_QUESTION) * 100

    return (
      <Card className="border-2 border-primary/20 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <motion.div
              key={`dots-${currentQ}`}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={shouldReduceMotion ? {} : { opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-base">{t('dailyChallenge.title')}</CardTitle>
            </motion.div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: DAILY_QUESTIONS_COUNT }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={shouldReduceMotion ? false : { scale: 0 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 300, damping: 15 }}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                      i < currentQ
                        ? 'bg-green-500'
                        : i === currentQ
                          ? 'bg-primary shadow-[0_0_6px] shadow-primary/50'
                          : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
              <div className={`flex items-center gap-1 font-mono font-bold ${timerColor}`}>
                <Clock className="h-3.5 w-3.5" />
                {timeLeft}{t('quiz.secondsSuffix')}
              </div>
            </div>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted overflow-hidden mt-2">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-primary'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${timerPercentage}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
            {timeLeft <= 5 && (
              <motion.div
                className="absolute inset-0 rounded-full bg-red-500/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`question-${currentQ}`}
              initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-4"
            >
              <p className="font-medium text-sm">{question.question}</p>
              <div className="grid gap-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border">1-4</kbd>
                  {t('quiz.keyboardHint')}
                </p>
                {question.options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx)
                  let optionClass = 'relative justify-start text-left h-auto py-3 px-4 whitespace-normal font-normal border-2 transition-all'
                  if (answered) {
                    if (idx === question.correctAnswer) {
                      optionClass += ' border-green-500 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100'
                    } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                      optionClass += ' border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100'
                    } else {
                      optionClass += ' border-transparent opacity-50'
                    }
                  } else {
                    optionClass += ' border-transparent hover:border-primary/40 hover:bg-accent/50'
                  }
                  return (
                    <motion.div
                      key={`challenge-option-${idx}`}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                      transition={{ delay: shouldReduceMotion ? 0 : idx * 0.05, duration: 0.2 }}
                      whileHover={shouldReduceMotion || answered ? {} : { scale: 1.02, x: 2 }}
                      whileTap={shouldReduceMotion || answered ? {} : { scale: 0.98 }}
                    >
                      <Button
                        variant="outline"
                        className={optionClass}
                        onClick={() => handleAnswer(idx)}
                        disabled={answered}
                      >
                        <span className={`h-6 w-6 rounded-md shrink-0 flex items-center justify-center text-xs font-bold mr-3 ${
                          answered && idx === question.correctAnswer
                            ? 'bg-green-500 text-white'
                            : answered && idx === selectedAnswer && idx !== question.correctAnswer
                              ? 'bg-red-500 text-white'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1">{option}</span>
                        {answered && idx === question.correctAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 ml-2 shrink-0" />
                        )}
                        {answered && idx === selectedAnswer && idx !== question.correctAnswer && (
                          <XCircle className="h-4 w-4 text-red-500 ml-2 shrink-0" />
                        )}
                      </Button>
                    </motion.div>
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
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    )
  }

  // Finished state
  if (quizState === 'finished') {
    const xpEarned = DAILY_BASE_XP + displayScore * DAILY_PER_CORRECT_XP
    return (
      <Card className="relative border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-50/50 to-primary/5 dark:from-yellow-950/20 dark:to-primary/5 overflow-hidden">
        <Celebration active={displayScore === DAILY_QUESTIONS_COUNT} />
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {t('dailyChallenge.complete')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <motion.div
              initial={shouldReduceMotion ? false : { scale: 0.5, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 15 }}
              className="text-4xl font-bold"
            >
              {displayScore}/{DAILY_QUESTIONS_COUNT}
            </motion.div>
            <motion.div
              initial={shouldReduceMotion ? false : { y: 10, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { y: 0, opacity: 1 }}
              transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.15 }}
              className="flex items-center justify-center gap-2"
            >
              <Zap className="h-6 w-6 text-yellow-500" />
              <span className="text-xl font-semibold">+{xpEarned} XP</span>
            </motion.div>
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
