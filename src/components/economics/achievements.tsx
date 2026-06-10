'use client'

import type React from 'react'
import { useMemo, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useEconomicsStore, getLevelTitle, getLevelColor } from '@/store/economics-store'
import { getLevelFromXP } from '@/lib/xp-utils'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumberLocale } from '@/lib/i18n'
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
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const { t, locale } = useI18n()
  const quizResults = useEconomicsStore((s) => s.quizResults)
  const gdpResults = useEconomicsStore((s) => s.gdpResults)
  const financeResults = useEconomicsStore((s) => s.financeResults)
  const elasticityResults = useEconomicsStore((s) => s.elasticityResults)
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const unlockAchievement = useEconomicsStore((s) => s.unlockAchievement)
  const resetProgress = useEconomicsStore((s) => s.resetProgress)

  const xpState = getLevelFromXP(totalXP)
  const levelTitle = getLevelTitle(xpState.level)
  const levelColor = getLevelColor(xpState.level)

  const unlockedAchievements = useEconomicsStore((s) => s.unlockedAchievements)

  const achievements: Achievement[] = useMemo(() => {
    // Compute intermediate values inside useMemo to avoid invalidating on every store change
    const finCorrect = financeResults.filter((r) => r.correct).length
    const sessions = quizResults.length + gdpResults.length + financeResults.length + elasticityResults.length

    // Compute streak
    let maxFinStreak = 0
    let currentStreak = 0
    for (const r of financeResults) {
      if (r.correct) { currentStreak++; maxFinStreak = Math.max(maxFinStreak, currentStreak) }
      else { currentStreak = 0 }
    }

    // Compute max quiz score ratio
    let maxQRatio = 0
    for (const r of quizResults) {
      if (r.total > 0) maxQRatio = Math.max(maxQRatio, r.score / r.total)
    }
    const perfectQuiz = quizResults.some((r) => r.score === r.total && r.total > 0)

    return [
    {
      id: 'first-quiz',
      title: t('achievement.firstQuiz.title'),
      description: t('achievement.firstQuiz.desc'),
      icon: Brain,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      unlocked: quizResults.length > 0,
      progress: quizResults.length > 0 ? 100 : 0,
      xpReward: 50,
    },
    {
      id: 'quiz-master',
      title: t('achievement.quizMaster.title'),
      description: t('achievement.quizMaster.desc'),
      icon: Crown,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      unlocked: maxQRatio >= 0.8,
      progress: Math.min(100, Math.round(maxQRatio * 100)),
      xpReward: 200,
    },
    {
      id: 'gdp-calc',
      title: t('achievement.gdpCalc.title'),
      description: t('achievement.gdpCalc.desc'),
      icon: Calculator,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      unlocked: gdpResults.length >= 3,
      progress: Math.min(100, Math.round((gdpResults.length / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'finance-streak',
      title: t('achievement.financeStreak.title'),
      description: t('achievement.financeStreak.desc'),
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      unlocked: finCorrect >= 5,
      progress: Math.min(100, Math.round((finCorrect / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'streak-3',
      title: t('achievement.streak3.title'),
      description: t('achievement.streak3.desc'),
      icon: Flame,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      unlocked: maxFinStreak >= 3,
      progress: Math.min(100, Math.round((maxFinStreak / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'ten-sessions',
      title: t('achievement.tenSessions.title'),
      description: t('achievement.tenSessions.desc'),
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      unlocked: sessions >= 10,
      progress: Math.min(100, Math.round((sessions / 10) * 100)),
      xpReward: 150,
    },
    {
      id: 'perfect-quiz',
      title: t('achievement.perfectQuiz.title'),
      description: t('achievement.perfectQuiz.desc'),
      icon: Star,
      color: 'text-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      unlocked: perfectQuiz,
      progress: Math.min(100, Math.round(maxQRatio * 100)),
      xpReward: 300,
    },
    {
      id: 'finance-10',
      title: t('achievement.finance10.title'),
      description: t('achievement.finance10.desc'),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      unlocked: financeResults.length >= 10,
      progress: Math.min(100, Math.round((financeResults.length / 10) * 100)),
      xpReward: 200,
    },
    {
      id: 'quiz-5',
      title: t('achievement.quiz5.title'),
      description: t('achievement.quiz5.desc'),
      icon: Medal,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      unlocked: quizResults.length >= 5,
      progress: Math.min(100, Math.round((quizResults.length / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'all-modules',
      title: t('achievement.allModules.title'),
      description: t('achievement.allModules.desc'),
      icon: Award,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      unlocked: quizResults.length > 0 && gdpResults.length > 0 && financeResults.length > 0 && elasticityResults.length > 0,
      progress: ((quizResults.length > 0 ? 25 : 0) + (gdpResults.length > 0 ? 25 : 0) + (financeResults.length > 0 ? 25 : 0) + (elasticityResults.length > 0 ? 25 : 0)),
      xpReward: 250,
    },
    {
      id: 'elasticity-master',
      title: t('achievement.elasticityMaster.title'),
      description: t('achievement.elasticityMaster.desc'),
      icon: Scale,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
      unlocked: elasticityResults.length >= 3,
      progress: Math.min(100, Math.round((elasticityResults.length / 3) * 100)),
      xpReward: 150,
    },
    {
      id: 'streak-7',
      title: t('achievement.streak7.title'),
      description: t('achievement.streak7.desc'),
      icon: Flame,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      unlocked: maxFinStreak >= 7,
      progress: Math.min(100, Math.round((maxFinStreak / 7) * 100)),
      xpReward: 200,
    },
    {
      id: 'phillips-explorer',
      title: t('achievement.phillipsExplorer.title'),
      description: t('achievement.phillipsExplorer.desc'),
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      unlocked: sessions >= 3,
      progress: Math.min(100, Math.round((sessions / 3) * 100)),
      xpReward: 100,
    },
    {
      id: 'game-theorist',
      title: t('achievement.gameTheorist.title'),
      description: t('achievement.gameTheorist.desc'),
      icon: Swords,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      unlocked: sessions >= 5,
      progress: Math.min(100, Math.round((sessions / 5) * 100)),
      xpReward: 150,
    },
    {
      id: 'marathon',
      title: t('achievement.marathon.title'),
      description: t('achievement.marathon.desc'),
      icon: Rocket,
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30',
      unlocked: sessions >= 25,
      progress: Math.min(100, Math.round((sessions / 25) * 100)),
      xpReward: 300,
    },
    {
      id: 'scholar',
      title: t('achievement.scholar.title'),
      description: t('achievement.scholar.desc'),
      icon: GraduationCap,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      unlocked: maxQRatio >= 0.9,
      progress: Math.min(100, Math.round(maxQRatio * 100)),
      xpReward: 400,
    },
    {
      id: 'tax-expert',
      title: t('achievement.taxExpert.title'),
      description: t('achievement.taxExpert.desc'),
      icon: Receipt,
      color: 'text-lime-600',
      bg: 'bg-lime-50 dark:bg-lime-950/30',
      unlocked: sessions >= 8,
      progress: Math.min(100, Math.round((sessions / 8) * 100)),
      xpReward: 150,
    },
    {
      id: 'ppf-master',
      title: t('achievement.ppfMaster.title'),
      description: t('achievement.ppfMaster.desc'),
      icon: ArrowLeftRight,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      unlocked: sessions >= 12,
      progress: Math.min(100, Math.round((sessions / 12) * 100)),
      xpReward: 200,
    },
    {
      id: 'cost-analyst',
      title: t('achievement.costAnalyst.title'),
      description: t('achievement.costAnalyst.desc'),
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      unlocked: sessions >= 15,
      progress: Math.min(100, Math.round((sessions / 15) * 100)),
      xpReward: 200,
    },
  ]
  }, [quizResults, gdpResults, financeResults, elasticityResults, t])

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalBadgeXP = achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.xpReward, 0)

  // Award XP for newly unlocked achievements (idempotent via processedRef)
  const processedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    // If store was reset (unlockedAchievements cleared), reset processed set too
    if (unlockedAchievements.length === 0) {
      processedRef.current.clear()
    }
    for (const ach of achievements) {
      if (ach.unlocked && !processedRef.current.has(ach.id)) {
        processedRef.current.add(ach.id)
        unlockAchievement(ach.id, ach.xpReward)
      }
    }
  }, [achievements, unlockAchievement, unlockedAchievements])

  return (
    <div className="space-y-6">
      {/* Level & XP Card */}
      <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left">
              <div className={`text-4xl font-bold ${levelColor}`}>
                {t('achievements.level')} {xpState.level}
              </div>
              <div className={`text-lg font-semibold ${levelColor}`}>
                {levelTitle}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {formatNumberLocale(locale, totalXP)} {t('achievements.totalXP')}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('achievements.progressToLevel')} {xpState.level + 1}</span>
                <span className="font-medium">{formatNumberLocale(locale, xpState.xpInCurrentLevel)} / {formatNumberLocale(locale, xpState.xpToNextLevel)} XP</span>
              </div>
              <Progress value={(xpState.xpInCurrentLevel / xpState.xpToNextLevel) * 100} className="h-3" />
              <div className="text-xs text-muted-foreground mt-2">
                {t('achievements.remaining')} {formatNumberLocale(locale, xpState.xpToNextLevel - xpState.xpInCurrentLevel)} {t('achievements.toNextLevel')}
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
            <div className="text-xs text-muted-foreground">{t('achievements.achievementsCount')}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{formatNumberLocale(locale, totalBadgeXP)}</div>
            <div className="text-xs text-muted-foreground">{t('achievements.badgeXP')}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{Math.round((unlockedCount / achievements.length) * 100)}%</div>
            <div className="text-xs text-muted-foreground">{t('achievements.progress')}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <GraduationCap className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{xpState.level}</div>
            <div className="text-xs text-muted-foreground">{t('achievements.levelLabel')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      {unlockedCount === 0 && (
        <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/20">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold mb-2">{t('achievements.emptyTitle')}</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">{t('achievements.emptyDescription')}</p>
          </CardContent>
        </Card>
      )}
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
                    <Badge className="bg-yellow-500 text-yellow-950 text-xs">
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
      <Dialog>
        <DialogTrigger asChild>
          <Card className="border-dashed cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t('achievements.resetTitle')}</div>
                <div className="text-xs text-muted-foreground">{t('achievements.resetDescription')}</div>
              </div>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('achievements.resetButton')}
              </Button>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('achievements.confirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('achievements.confirmDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-destructive/10 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              {t('achievements.willDelete')}
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>{t('achievements.deleteXP')}</li>
              <li>{t('achievements.deleteBadges')}</li>
              <li>{t('achievements.deleteModuleStats')}</li>
              <li>{t('achievements.deleteResults')}</li>
            </ul>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                {t('achievements.cancel')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                await resetProgress()
              }}
            >
              {t('achievements.resetConfirmButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
