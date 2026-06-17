'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, User, Zap, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

interface ProgressStatsProps {
  totalXP: number
  userName: string | null
  quizResultsCount: number
  moduleInteractionsCount: number
  onSync: () => void
  syncing: boolean
}

const statCards = [
  { icon: Zap, labelKey: 'dashboard.progress.totalXP', color: 'from-yellow-500 to-amber-500', textColor: 'text-yellow-500' },
  { icon: User, labelKey: 'dashboard.progress.account', color: 'from-blue-500 to-cyan-500', textColor: 'text-blue-500' },
  { icon: CheckCircle2, labelKey: 'dashboard.progress.quizzes', color: 'from-green-500 to-emerald-500', textColor: 'text-green-500' },
  { icon: BarChart3, labelKey: 'dashboard.progress.sessions', color: 'from-purple-500 to-pink-500', textColor: 'text-purple-500' },
]

export const ProgressStats = memo(function ProgressStats({
  totalXP,
  userName,
  quizResultsCount,
  moduleInteractionsCount,
  onSync,
  syncing,
}: ProgressStatsProps) {
  const { t } = useI18n()
  const values = [totalXP, userName || t('dashboard.progress.student'), quizResultsCount, moduleInteractionsCount]

  return (
    <Card className="border-primary/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t('dashboard.progress.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.progress.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((item, i) => {
            const Icon = item.icon
            const value = values[i]
            return (
              <motion.div
                key={item.labelKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Card className="overflow-hidden group border-primary/5 h-full">
                  <CardContent className="pt-6 text-center relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t(item.labelKey)}</div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={onSync}
            disabled={syncing}
            className="w-full h-11 font-semibold relative overflow-hidden group"
            type="button"
          >
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
            {t('dashboard.progress.sync')}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground text-center">{t('dashboard.progress.note')}</p>
      </CardContent>
    </Card>
  )
})
