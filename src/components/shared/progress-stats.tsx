'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, User, Zap, CheckCircle2, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

interface ProgressStatsProps {
  totalXP: number
  userName: string | null
  quizResultsCount: number
  moduleInteractionsCount: number
  onSync: () => void
  syncing: boolean
}

export function ProgressStats({
  totalXP,
  userName,
  quizResultsCount,
  moduleInteractionsCount,
  onSync,
  syncing,
}: ProgressStatsProps) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t('dashboard.progress.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.progress.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{totalXP}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.progress.totalXP')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <User className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-3xl font-bold">{userName || t('dashboard.progress.student')}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.progress.account')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{quizResultsCount}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.progress.quizzes')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-3xl font-bold">{moduleInteractionsCount}</div>
              <div className="text-sm text-muted-foreground">{t('dashboard.progress.sessions')}</div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={onSync} disabled={syncing} className="w-full">
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {t('dashboard.progress.sync')}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {t('dashboard.progress.note')}
        </p>
      </CardContent>
    </Card>
  )
}
