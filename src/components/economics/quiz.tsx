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
import { Brain, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react'
import { questions, type Question } from '@/lib/quiz-questions'
const QUIZ_TIME = 30 // seconds per question

type QuizState = 'idle' | 'active' | 'answered' | 'finished'

export const EconomicsQuiz = memo(function EconomicsQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [timeExpired, setTimeExpired] = useState(false)
  const addQuizResult = useEconomicsStore((s) => s.addQuizResult)
  const { toast } = useToast()
  const { t } = useI18n()

  // Ref to track current score value synchronously (avoids stale closure in nextQuestion)
  const scoreRef = useRef(score)
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  // Ref to track current question index inside interval callbacks
  const currentQuestionRef = useRef(currentQuestion)
  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])

  // Guard to prevent race condition between timer and handleAnswer
  const hasTransitionedRef = useRef(false)

  // Detect when time ran out (set by timer effect, reset when starting next question)
  const isTimeUp = timeExpired && timeLeft === 0

  const startQuiz = useCallback(() => {
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    shuffled.length = Math.min(shuffled.length, 10)
    setShuffledQuestions(shuffled)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswers(new Array(shuffled.length).fill(null))
    setTimeLeft(QUIZ_TIME)
    setTimeExpired(false)
    setQuizState('active')
  }, [])

  // Timer countdown — auto-advances when time runs out
  useEffect(() => {
    if (quizState !== 'active') return
    hasTransitionedRef.current = false // Reset guard when starting new question
    let isMounted = true
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time expired — handle inside setState updater to avoid cascading setState
          // Use microtask to ensure state update is applied first
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
      if (hasTransitionedRef.current) return // Timer already transitioned
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
    setCurrentQuestion((q) => q + 1)
    setSelectedAnswer(null)
    setTimeLeft(QUIZ_TIME)
    setTimeExpired(false)
    setQuizState('active')
  }, [currentQuestion, shuffledQuestions, addQuizResult, toast, t])

  // Keyboard shortcuts: 1-4 to answer, Enter/Space to continue
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('quiz.economicTheoryTitle')}
          </CardTitle>
          <CardDescription>
            {t('quiz.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">{t('quiz.questionsInBank')}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">10</div>
              <div className="text-sm text-muted-foreground">{t('quiz.questionsInQuiz')}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">30{t('quiz.secondsSuffix')}</div>
              <div className="text-sm text-muted-foreground">{t('quiz.perQuestion')}</div>
            </div>
          </div>
          <Button onClick={startQuiz} size="lg" className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            {t('quiz.startQuiz')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quizState === 'finished') {
    const percentage = Math.round((score / shuffledQuestions.length) * 100)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('quiz.resultsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div aria-live="polite" className="text-center space-y-2">
            <div className="text-5xl font-bold">
              {score}/{shuffledQuestions.length}
            </div>
            <div className="text-lg text-muted-foreground">{t('quiz.correctAnswers')}</div>
            <Progress value={percentage} className="h-3" />
            <Badge
              variant={percentage >= 75 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
              className="text-base px-4 py-1"
            >
              {percentage >= 75 ? t('quiz.excellent') : percentage >= 50 ? t('quiz.good') : t('quiz.needsImprovement')}
            </Badge>
          </div>

          <div className="space-y-3">
            {shuffledQuestions.map((q, i) => (
              <div
                key={q.id}
                className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  answers[i] === q.correctAnswer
                    ? 'bg-green-50 dark:bg-green-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                }`}
              >
                {answers[i] === q.correctAnswer ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium">{q.question}</div>
                  {answers[i] !== q.correctAnswer && (
                    <div className="text-muted-foreground mt-1">
                      {t('quiz.correctAnswer')} {q.options[q.correctAnswer]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={startQuiz} className="w-full" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('quiz.playAgain')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const question = shuffledQuestions[currentQuestion]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {t('quiz.questionOf').replace('{current}', String(currentQuestion + 1)).replace('{total}', String(shuffledQuestions.length))}
          </Badge>
          <Badge variant={getDifficultyColor(question.difficulty)}>
            {question.difficulty === 'easy' ? t('quiz.difficultyEasy') : question.difficulty === 'medium' ? t('quiz.difficultyMedium') : t('quiz.difficultyHard')}
          </Badge>
          <Badge variant="outline">{t(question.topic)}</Badge>
        </div>
        <div className="flex items-center gap-1" role="timer" aria-live="polite" aria-atomic="true">
          <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500' : ''}`} />
          <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            {timeLeft}{t('quiz.secondsSuffix')}
          </span>
        </div>
      </div>

      <Progress value={((currentQuestion + 1) / shuffledQuestions.length) * 100} className="h-2" />

      {isTimeUp && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 text-center space-y-3">
            <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              {t('quiz.timeUp')}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('quiz.timeUpDescription')}
            </p>
            <Button onClick={nextQuestion} variant="destructive">
              {t('quiz.continue')}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isTimeUp && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted rounded border">1-4</kbd>
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
              let optionClass = 'border-2 rounded-lg p-3 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              if (quizState === 'answered') {
                if (idx === question.correctAnswer) {
                  optionClass += ' border-green-500 bg-green-50 dark:bg-green-950/30'
                } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                  optionClass += ' border-red-500 bg-red-50 dark:bg-red-950/30'
                } else {
                  optionClass += ' opacity-50'
                }
              } else if (selectedAnswer === idx) {
                optionClass += ' border-primary'
              } else {
                optionClass += ' border-transparent hover:border-muted-foreground/30'
              }

              return (
                <div
                  key={`quiz-option-${idx}`}
                  className={optionClass}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                      <span className="text-muted-foreground mr-1.5 font-mono text-xs">{idx + 1}.</span>
                      {option}
                    </Label>
                  </div>
                </div>
              )
            })}
          </RadioGroup>

          {quizState === 'answered' && (
            <div className="p-4 bg-primary/5 rounded-lg text-sm space-y-2">
              <div className="font-semibold">
                {selectedAnswer === question.correctAnswer ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> {t('quiz.correctExclamation')}
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> {t('quiz.incorrectExclamation')}
                  </span>
                )}
              </div>
              <div>{question.explanation}</div>
            </div>
          )}

          {quizState === 'answered' && (
            <Button onClick={nextQuestion} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              {currentQuestion + 1 >= shuffledQuestions.length
                ? t('quiz.showResults')
                : t('quiz.nextQuestion')}
            </Button>
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex gap-1">
        {shuffledQuestions.map((_, i) => (
          <div
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
            className={`h-2 flex-1 rounded-full ${
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
