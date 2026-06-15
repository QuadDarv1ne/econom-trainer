'use client'

import { memo, type ComponentType } from 'react'
import { motion } from 'framer-motion'
import { CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, TrendingUp, Zap, Sparkles, ChevronRight } from 'lucide-react'
import type { ModuleMeta } from '@/lib/module-data'
import { useI18n } from '@/lib/i18n-provider'

interface ModuleCardProps {
  mod: ModuleMeta & { icon: ComponentType<{ className?: string }> }
  progress: number
  onClick: () => void
  index: number
  shouldReduceMotion: boolean | null
}

export const ModuleCard = memo(function ModuleCard({
  mod,
  progress,
  onClick,
  index,
  shouldReduceMotion,
}: ModuleCardProps) {
  const { t } = useI18n()
  const Icon = mod.icon
  const isExplored = progress > 0

  return (
    <motion.div
      layout={!shouldReduceMotion}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={shouldReduceMotion ? {} : { y: -6, transition: { duration: 0.2 } }}
    >
      <button
        className="group relative w-full text-left cursor-pointer h-full rounded-2xl border bg-card p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 active:shadow-md active:scale-[0.98]"
        onClick={onClick}
        aria-label={t(mod.titleKey)}
      >
        {/* Animated border gradient on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-primary/20 blur-sm" />
        </div>

        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <motion.div
                className={`h-14 w-14 rounded-2xl ${mod.bg} flex items-center justify-center relative shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-2 group-hover:ring-primary/30 transition-all duration-300`}
                whileHover={shouldReduceMotion ? {} : { scale: 1.12, rotate: index % 2 === 0 ? [0, -4, 4, 0] : [0, 4, -4, 0] }}
              >
                <Icon className={`h-6 w-6 ${mod.color} transition-transform duration-300 group-hover:scale-110`} />
                {isExplored && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0 }}
                    animate={shouldReduceMotion ? {} : { scale: 1 }}
                    className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-lg shadow-green-500/30 ring-2 ring-background"
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {mod.xpReward > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800 group-hover:border-yellow-300 dark:group-hover:border-yellow-700 group-hover:shadow-sm transition-all duration-300 whitespace-nowrap"
                  >
                    <Zap className="h-3 w-3 text-yellow-500 mr-0.5 shrink-0" />
                    +{mod.xpReward}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className="text-[10px] px-2 py-0.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300 whitespace-nowrap"
                >
                  {t(mod.categoryKey)}
                </Badge>
              </div>
            </div>
            <CardTitle className={`text-base mt-3 line-clamp-1 transition-all duration-300 ${isExplored ? 'group-hover:text-primary' : ''}`}>
              {t(mod.titleKey)}
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2 leading-relaxed">
              {t(mod.descriptionKey)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {isExplored ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{t('home.card.progress')}</span>
                  <span className="font-bold tabular-nums text-primary">{progress}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  {progress >= 100 && (
                    <motion.div
                      className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-green-500/30 to-transparent rounded-full"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between group/callout">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/70 group-hover:text-primary transition-all duration-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('home.card.start')}
                  <TrendingUp className="h-3.5 w-3.5 group-hover/callout:translate-x-0.5 transition-transform duration-300" />
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            )}
          </CardContent>
        </div>
      </button>
    </motion.div>
  )
})
