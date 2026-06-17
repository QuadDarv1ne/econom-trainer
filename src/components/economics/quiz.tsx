'use client'

import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useEconomicsStore } from '@/store/economics-store'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { generateId } from '@/lib/utils'
import { Brain, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, Sparkles, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { questions, type Question } from '@/lib/quiz-questions'
import { Celebration } from '@/components/shared/celebration'
const QUIZ_TIME = 30

type QuizState = 'idle' | 'active' | 'answered' | 'finished'

const stagger = {
  animate: {
    transition: { staggerChildren: 0.05 },
  },
}

const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
}

export const EconomicsQuiz = memo(function EconomicsQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [timeExpired, setTimeExpired] = useState(false)
  const [questionKey, setQuestionKey] = useState(0)
  const addQuizResult = useEconomicsStore((s) => s.addQuizResult)
  const { toast } = useToast()
  const { t } = useI18n()

  const scoreRef = useRef(score)
  useEffect(() => { scoreRef.current = score }, [score])

  const currentQuestionRef = useRef(currentQuestion)
  useEffect(() => { currentQuestionRef.current = currentQuestion }, [currentQuestion])

  const hasTransitionedRef = useRef(false)

  const isTimeUp = timeExpired && timeLeft === 0

  const startQuiz = useCallback(() => {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    shuffled.length = Math.min(shuffled.length, 10)
    hasTransitionedRef.current = false
    setShuffledQuestions(shuffled)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswers(new Array(shuffled.length).fill(null))
    setTimeLeft(QUIZ_TIME)
    setTimeExpired(false)
    setQuestionKey((k) => k + 1)
    setQuizState('active')
  }, [])

  useEffect(() => {
    if (quizState !== 'active') return
    hasTransitionedRef.current = false
    let isMounted = true
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          queueMicrotask(() => {
            if (!isMounted || hasTransitionedRef.current) return
            hasTransitionedRef.current = true
            setTimeExpired(true)
            setAnswers((prev) => {
              const next = [...prev]
              next[currentQuestionRef.current] = null
              return next
            })
            setSelectedAnswer(null)
            setQuizState('answered')
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [quizState])

  const handleAnswer = useCallback(
    (answer: number | null) => {
      if (quizState !== 'active') return
      if (hasTransitionedRef.current) return
      hasTransitionedRef.current = true
      setSelectedAnswer(answer)
      setAnswers((prev) => {
        const next = [...prev]
        next[currentQuestionRef.current] = answer
        return next
      })

      const isCorrect = answer === shuffledQuestions[currentQuestion]?.correctAnswer
      if (isCorrect) setScore((s) => s + 1)

      setQuizState('answered')
    },
    [quizState, currentQuestion, shuffledQuestions]
  )

  const nextQuestion = useCallback(() => {
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      const finalScore = scoreRef.current
      addQuizResult({
        id: generateId(),
        topic: t('quiz.topicEconomicTheory'),
        score: finalScore,
        total: shuffledQuestions.length,
        date: new Date().toISOString(),
      })
      setQuizState('finished')
      toast({
        title: t('quiz.finishedTitle'),
        description: `${t('quiz.finishedDescription')} ${finalScore} ${t('quiz.of')} ${shuffledQuestions.length}`,
      })
      return
    }
    hasTransitionedRef.current = false
    setCurrentQuestion((q) => q + 1)
    setSelectedAnswer(null)
    setTimeLeft(QUIZ_TIME)
    setTimeExpired(false)
    setQuestionKey((k) => k + 1)
    setQuizState('active')
  }, [currentQuestion, shuffledQuestions, addQuizResult, toast, t])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizState === 'active' && !hasTransitionedRef.current) {
        const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
        const idx = keyMap[e.key]
        if (idx !== undefined && idx < shuffledQuestions[currentQuestion]?.options.length) {
          e.preventDefault()
          handleAnswer(idx)
        }
      }
      if (quizState === 'answered' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        nextQuestion()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quizState, currentQuestion, shuffledQuestions, handleAnswer, nextQuestion])

  const getDifficultyColor = (d: Question['difficulty']): "secondary" | "default" | "destructive" => {
    if (d === 'easy') return 'secondary'
    if (d === 'medium') return 'default'
    return 'destructive'
  }

  if (quizState === 'idle') {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[4rem]" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              {t('quiz.economicTheoryTitle')}
            </CardTitle>
            <CardDescription>
              {t('quiz.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-3 gap-3 text-center">
              {[
                { value: questions.length, label: t('quiz.questionsInBank'), icon: Brain, gradient: 'from-primary/10 to-purple-600/10' },
                { value: '10', label: t('quiz.questionsInQuiz'), icon: Target, gradient: 'from-green-500/10 to-emerald-600/10' },
                { value: `30${t('quiz.secondsSuffix')}`, label: t('quiz.perQuestion'), icon: Clock, gradient: 'from-amber-500/10 to-orange-600/10' },
              ].map((item, _i) => (
                <motion.div
                  key={item.label}
                  variants={fadeSlideUp}
                  className={`p-4 rounded-xl bg-gradient-to-br ${item.gradient} border border-primary/5`}
                >
                  <item.icon className="h-4 w-4 mx-auto mb-1.5 text-primary" />
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </motion.div>
              ))}
            </motion.div>
            <Button
              onClick={startQuiz}
              size="lg"
              className="w-full h-12 font-semibold relative overflow-hidden group"
            >
              <Brain className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              {t('quiz.startQuiz')}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (quizState === 'finished') {
    const percentage = Math.round((score / shuffledQuestions.length) * 100)
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden relative">
          <Celebration active={percentage >= 75} />
          <div className="absolute top-0 left-0 h-40 w-40 bg-gradient-to-br from-green-500/10 to-transparent rounded-br-[4rem]" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {t('quiz.resultsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              aria-live="polite"
              className="text-center space-y-2"
            >
              <div className="text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                {score}/{shuffledQuestions.length}
              </div>
              <div className="text-lg text-muted-foreground">{t('quiz.correctAnswers')}</div>
              <div className="relative h-3 w-full max-w-xs mx-auto">
                <Progress value={percentage} className="h-3" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Badge
                  variant={percentage >= 75 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
                  className="text-base px-5 py-1.5"
                >
                  {percentage >= 75 ? t('quiz.excellent') : percentage >= 50 ? t('quiz.good') : t('quiz.needsImprovement')}
                </Badge>
              </motion.div>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="initial"
              animate="animate"
              className="space-y-2"
            >
              {shuffledQuestions.map((q, i) => (
                <motion.div
                  key={q.id}
                  variants={fadeSlideUp}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className={`p-3 rounded-xl text-sm flex items-start gap-3 border transition-shadow duration-300 ${
                    answers[i] === q.correctAnswer
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 hover:shadow-md hover:shadow-green-500/10'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 hover:shadow-md hover:shadow-red-500/10'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 ${
                    answers[i] === q.correctAnswer
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}>
                    {answers[i] === q.correctAnswer ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{q.question}</div>
                    {answers[i] !== q.correctAnswer && (
                      <div className="text-muted-foreground mt-1 text-xs">
                        {t('quiz.correctAnswer')} {q.options[q.correctAnswer]}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <Button
              onClick={startQuiz}
              className="w-full h-12 font-semibold relative overflow-hidden group"
              size="lg"
            >
              <RotateCcw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              {t('quiz.playAgain')}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const question = shuffledQuestions[currentQuestion]
  const timerPercentage = (timeLeft / QUIZ_TIME) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t('quiz.questionOf').replace('{current}', String(currentQuestion + 1)).replace('{total}', String(shuffledQuestions.length))}
          </Badge>
          <Badge variant={getDifficultyColor(question.difficulty)} className="text-xs">
            {question.difficulty === 'easy' ? t('quiz.difficultyEasy') : question.difficulty === 'medium' ? t('quiz.difficultyMedium') : t('quiz.difficultyHard')}
          </Badge>
          <Badge variant="outline" className="text-xs">{t(question.topic)}</Badge>
        </div>
        <motion.div
          className="flex items-center gap-1.5"
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          animate={timeLeft <= 10 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Clock className={`h-4 w-4 ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : ''}`} />
          <span className={`font-mono font-bold text-sm ${timeLeft <= 5 ? 'text-red-500' : timeLeft <= 10 ? 'text-amber-500' : ''}`}>
            {timeLeft}{t('quiz.secondsSuffix')}
          </span>
        </motion.div>
      </div>

      <div className="relative h-2">
        <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="h-2" />
      </div>

      <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            timeLeft <= 5 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-primary'
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

      <AnimatePresence mode="wait">
        {isTimeUp && (
          <motion.div
            key="timeup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/30 shadow-lg shadow-red-500/10">
              <CardContent className="p-5 text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="text-lg font-bold text-red-600 flex items-center justify-center gap-2"
                >
                  <Clock className="h-5 w-5" />
                  {t('quiz.timeUp')}
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  {t('quiz.timeUpDescription')}
                </p>
                <Button onClick={nextQuestion} variant="destructive" className="relative overflow-hidden group">
                  {t('quiz.continue')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isTimeUp && (
          <motion.div
            key={`question-${questionKey}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card className="border-primary/10 shadow-xl shadow-primary/5 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border">1-4</kbd>
                  {t('quiz.keyboardHint')}
                </p>
                <RadioGroup
                  role="radiogroup"
                  aria-label={t('quiz.answerOptions')}
                  value={selectedAnswer !== null ? selectedAnswer.toString() : ''}
                  onValueChange={(v) => {
                    if (quizState !== 'active') return
                    const idx = parseInt(v, 10)
                    if (isNaN(idx)) return
                    handleAnswer(idx)
                  }}
                  disabled={quizState === 'answered'}
                >
                  {question.options.map((option, idx) => {
                    let optionClass = 'border-2 rounded-xl p-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    if (quizState === 'answered') {
                      if (idx === question.correctAnswer) {
                        optionClass += ' border-green-500 bg-green-50 dark:bg-green-950/30'
                      } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                        optionClass += ' border-red-500 bg-red-50 dark:bg-red-950/30'
                      } else {
                        optionClass += ' opacity-50'
                      }
                    } else if (selectedAnswer === idx) {
                      optionClass += ' border-primary bg-primary/5'
                    } else {
                      optionClass += ' border-transparent hover:border-primary/30 hover:bg-accent/50'
                    }

                    return (
                      <motion.div
                        key={`quiz-option-${idx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.2 }}
                        whileHover={quizState === 'active' ? { scale: 1.02 } : {}}
                        whileTap={quizState === 'active' ? { scale: 0.98 } : {}}
                        className={optionClass}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                          <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                            <span className="text-muted-foreground mr-1.5 font-mono text-xs">{idx + 1}.</span>
                            {option}
                          </Label>
                        </div>
                      </motion.div>
                    )
                  })}
                </RadioGroup>

                <AnimatePresence>
                  {quizState === 'answered' && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className={`p-4 rounded-xl text-sm space-y-2 border ${
                        selectedAnswer === question.correctAnswer
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                      }`}
                    >
                      <div className="font-semibold">
                        {selectedAnswer === question.correctAnswer ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="text-green-600 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-4 w-4" /> {t('quiz.correctExclamation')}
                          </motion.span>
                        ) : (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="text-red-600 flex items-center gap-1.5"
                          >
                            <XCircle className="h-4 w-4" /> {t('quiz.incorrectExclamation')}
                          </motion.span>
                        )}
                      </div>
                      <div>{question.explanation}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {quizState === 'answered' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <Button
                        onClick={nextQuestion}
                        className="w-full h-11 font-semibold relative overflow-hidden group"
                      >
                        <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                        {currentQuestion + 1 >= shuffledQuestions.length
                          ? t('quiz.showResults')
                          : t('quiz.nextQuestion')}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1.5">
        {shuffledQuestions.map((_, i) => (
          <motion.div
            key={i}
            role="progressbar"
            aria-label={i < currentQuestion
              ? answers[i] === shuffledQuestions[i]?.correctAnswer ? t('quiz.a11y.correct') : t('quiz.a11y.incorrect')
              : i === currentQuestion ? t('quiz.a11y.current') : t('quiz.a11y.unanswered')}
            aria-valuenow={
              i < currentQuestion ? (answers[i] === shuffledQuestions[i]?.correctAnswer ? 100 : 0)
              : i === currentQuestion ? 50 : 0
            }
            aria-valuemin={0}
            aria-valuemax={100}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 200, damping: 15 }}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              i < currentQuestion
                ? answers[i] === shuffledQuestions[i]?.correctAnswer
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentQuestion
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
})
