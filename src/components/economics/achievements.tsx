'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useEconomicsStore, getLevelFromXP, getLevelTitle, getLevelColor } from '@/store/economics-store'
import {
  Trophy,
  Flame,
  Brain,
  Calculator,
  TrendingUp,
  Target,
  Star,
  Zap,
  Award,
  Crown,
  Medal,
  Swords,
  Scale,
  TrendingDown,
  Rocket,
  GraduationCap,
  Receipt,
  BarChart3,
  ArrowLeftRight,
  RotateCcw,
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  unlocked: boolean
  progress: number // 0-100
  xpReward: number
}

export function Achievements() {
  const quizResults = useEconomicsStore((s) => s.quizResults)
  const gdpResults = useEconomicsStore((s) => s.gdpResults)
  const financeResults = useEconomicsStore((s) => s.financeResults)
  const elasticityResults = useEconomicsStore((s) => s.elasticityResults)
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const resetProgress = useEconomicsStore((s) => s.resetProgress)

  const xpState = getLevelFromXP(totalXP)
  const levelTitle = getLevelTitle(xpState.level)
  const levelColor = getLevelColor(xpState.level)

  const quizCorrect = quizResults.reduce((sum, r) => sum + r.score, 0)
  const financeCorrect = financeResults.filter((r) => r.correct).length
  const totalSessions = quizResults.length + gdpResults.length + financeResults.length + elasticityResults.length

  // Compute streak
  let maxFinanceStreak = 0
  let currentStreak = 0
  for (const r of financeResults) {
    if (r.correct) { currentStreak++; maxFinanceStreak = Math.max(maxFinanceStreak, currentStreak) }
    else { currentStreak = 0 }
  }

  // Compute max quiz score ratio
  let maxQuizRatio = 0
  for (const r of quizResults) {
    if (r.total > 0) maxQuizRatio = Math.max(maxQuizRatio, r.score / r.total)
  }
  const hasPerfectQuiz = quizResults.some((r) => r.score === r.total && r.total > 0)

  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first-quiz',
      title: 'Первый квиз',
      description: 'Пройдите свой первый квиз',
      icon: Brain,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      unlocked: quizResults.length > 0,
      progress: quizResults.length > 0 ? 100 : 0,
      xpReward: 50,
    },
    {
      id: 'quiz-master',
      title: 'Знаток экономики',
      description: 'Наберите 80%+ в квизе',
      icon: Crown,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      unlocked: maxQuizRatio >= 0.8,
      progress: Math.min(100, Math.round(maxQuizRatio * 100)),
      xpReward: 200,
    },
    {
      id: 'gdp-calc',
      title: 'Макроэкономист',
      description: 'Рассчитайте ВВП 3 раза',
      icon: Calculator,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      unlocked: gdpResults.length >= 3,
      progress: Math.min(100, Math.round((gdpResults.length / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'finance-streak',
      title: 'Точность',
      description: 'Решите 5 финансовых задач правильно',
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      unlocked: financeCorrect >= 5,
      progress: Math.min(100, Math.round((financeCorrect / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'streak-3',
      title: 'Серия 3',
      description: 'Дайте 3 правильных ответа подряд',
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      unlocked: maxFinanceStreak >= 3,
      progress: Math.min(100, Math.round((maxFinanceStreak / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'ten-sessions',
      title: 'Трудоголик',
      description: 'Проведите 10 тренировок',
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      unlocked: totalSessions >= 10,
      progress: Math.min(100, Math.round((totalSessions / 10) * 100)),
      xpReward: 150,
    },
    {
      id: 'perfect-quiz',
      title: 'Перфекционист',
      description: 'Пройдите квиз без ошибок',
      icon: Star,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      unlocked: hasPerfectQuiz,
      progress: Math.min(100, Math.round(maxQuizRatio * 100)),
      xpReward: 300,
    },
    {
      id: 'finance-10',
      title: 'Финансист',
      description: 'Решите 10 финансовых задач',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      unlocked: financeResults.length >= 10,
      progress: Math.min(100, Math.round((financeResults.length / 10) * 100)),
      xpReward: 200,
    },
    {
      id: 'quiz-5',
      title: 'Постоянство',
      description: 'Пройдите 5 квизов',
      icon: Medal,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      unlocked: quizResults.length >= 5,
      progress: Math.min(100, Math.round((quizResults.length / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'all-modules',
      title: 'Универсал',
      description: 'Используйте все типы тренировок',
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      unlocked: quizResults.length > 0 && gdpResults.length > 0 && financeResults.length > 0 && elasticityResults.length > 0,
      progress: ((quizResults.length > 0 ? 25 : 0) + (gdpResults.length > 0 ? 25 : 0) + (financeResults.length > 0 ? 25 : 0) + (elasticityResults.length > 0 ? 25 : 0)),
      xpReward: 250,
    },
    {
      id: 'elasticity-master',
      title: 'Эластичность',
      description: 'Рассчитайте 3 вида эластичности',
      icon: Scale,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      unlocked: elasticityResults.length >= 3,
      progress: Math.min(100, Math.round((elasticityResults.length / 3) * 100)),
      xpReward: 150,
    },
    {
      id: 'streak-7',
      title: 'Серия 7',
      description: 'Дайте 7 правильных ответов подряд',
      icon: Flame,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      unlocked: maxFinanceStreak >= 7,
      progress: Math.min(100, Math.round((maxFinanceStreak / 7) * 100)),
      xpReward: 200,
    },
    {
      id: 'phillips-explorer',
      title: 'Исследователь Филлипса',
      description: 'Проведите 3+ тренировки по макро',
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      unlocked: totalSessions >= 3,
      progress: Math.min(100, Math.round((totalSessions / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'game-theorist',
      title: 'Теоретик игр',
      description: 'Проведите 5+ тренировок',
      icon: Swords,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      unlocked: totalSessions >= 5,
      progress: Math.min(100, Math.round((totalSessions / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'marathon',
      title: 'Марафонец',
      description: 'Проведите 25 тренировок',
      icon: Rocket,
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
      unlocked: totalSessions >= 25,
      progress: Math.min(100, Math.round((totalSessions / 25) * 100)),
      xpReward: 300,
    },
    {
      id: 'scholar',
      title: 'Академик',
      description: 'Достигните 90%+ в квизе',
      icon: GraduationCap,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      unlocked: maxQuizRatio >= 0.9,
      progress: Math.min(100, Math.round(maxQuizRatio * 100)),
      xpReward: 400,
    },
    {
      id: 'tax-expert',
      title: 'Налоговый эксперт',
      description: 'Проведите 8+ тренировок',
      icon: Receipt,
      color: 'text-lime-600',
      bg: 'bg-lime-50 dark:bg-lime-950/30',
      unlocked: totalSessions >= 8,
      progress: Math.min(100, Math.round((totalSessions / 8) * 100)),
      xpReward: 150,
    },
    {
      id: 'ppf-master',
      title: 'КПВ-мастер',
      description: 'Проведите 12+ тренировок',
      icon: ArrowLeftRight,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      unlocked: totalSessions >= 12,
      progress: Math.min(100, Math.round((totalSessions / 12) * 100)),
      xpReward: 200,
    },
    {
      id: 'cost-analyst',
      title: 'Аналитик издержек',
      description: 'Проведите 15+ тренировок',
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      unlocked: totalSessions >= 15,
      progress: Math.min(100, Math.round((totalSessions / 15) * 100)),
      xpReward: 200,
    },
  ], [quizResults, gdpResults, financeResults, elasticityResults, quizCorrect, financeCorrect, totalSessions, maxFinanceStreak, maxQuizRatio, hasPerfectQuiz])

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalBadgeXP = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left">
              <div className={`text-4xl font-bold ${levelColor}`}>
                Ур. {xpState.level}
              </div>
              <div className={`text-lg font-semibold ${levelColor}`}>
                {levelTitle}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {totalXP.toLocaleString('ru-RU')} XP всего
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Прогресс до уровня {xpState.level + 1}</span>
                <span className="font-medium">{xpState.xpInCurrentLevel.toLocaleString('ru-RU')} / {xpState.xpToNextLevel.toLocaleString('ru-RU')} XP</span>
              </div>
              <Progress value={(xpState.xpInCurrentLevel / xpState.xpToNextLevel) * 100} className="h-3" />
              <div className="text-xs text-muted-foreground mt-2">
                Осталось {(xpState.xpToNextLevel - xpState.xpInCurrentLevel).toLocaleString('ru-RU')} XP до следующего уровня
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-2 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{unlockedCount}/{achievements.length}</div>
            <div className="text-xs text-muted-foreground">Достижений</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{totalBadgeXP.toLocaleString('ru-RU')}</div>
            <div className="text-xs text-muted-foreground">XP за бейджи</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{Math.round((unlockedCount / achievements.length) * 100)}%</div>
            <div className="text-xs text-muted-foreground">Прогресс</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{xpState.level}</div>
            <div className="text-xs text-muted-foreground">Уровень</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {achievements.map((ach) => {
          const Icon = ach.icon
          return (
            <Card
              key={ach.id}
              className={`transition-all duration-200 ${
                ach.unlocked
                  ? 'border-2 border-yellow-500/30 shadow-sm'
                  : 'opacity-70'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-xl ${ach.bg} flex items-center justify-center ${ach.unlocked ? '' : 'grayscale'}`}>
                    <Icon className={`h-5 w-5 ${ach.color}`} />
                  </div>
                  {ach.unlocked && (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      +{ach.xpReward} XP
                    </Badge>
                  )}
                  {!ach.unlocked && (
                    <Badge variant="outline" className="text-xs">
                      {ach.xpReward} XP
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm">{ach.title}</CardTitle>
                <CardDescription className="text-xs">{ach.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress value={ach.progress} className="h-1.5" />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {ach.progress}%
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reset */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Сбросить прогресс</div>
            <div className="text-xs text-muted-foreground">Удалить все результаты, XP и достижения</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { if (confirm('Вы уверены? Все данные будут удалены.')) resetProgress() }}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Сбросить
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
