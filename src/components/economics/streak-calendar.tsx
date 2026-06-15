'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useEconomicsStore } from '@/store/economics-store'

interface StreakCalendarProps {
  shouldReduceMotion: boolean | null
}

export const StreakCalendar = memo(function StreakCalendar({ shouldReduceMotion }: StreakCalendarProps) {
  const dailyChallenges = useEconomicsStore((s) => s.dailyChallenges)

  const last7Days = useMemo(() => {
    const days: { date: string; label: string; completed: boolean; score: number | null; isToday: boolean }[] = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' })
      const challenge = dailyChallenges.find((c) => c.date === dateStr)
      days.push({
        date: dateStr,
        label: dayLabel,
        completed: !!challenge,
        score: challenge ? challenge.score : null,
        isToday: i === 0,
      })
    }
    return days
  }, [dailyChallenges])

  return (
    <div className="flex items-end justify-center gap-1.5" role="img" aria-label="7-day streak calendar">
      {last7Days.map((day, i) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
            className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
              day.completed
                ? day.score === 3
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm shadow-amber-500/30'
                  : day.score !== null && day.score >= 2
                    ? 'bg-green-500 text-white shadow-sm shadow-green-500/30'
                    : 'bg-muted-foreground/20 text-muted-foreground'
                : day.isToday
                  ? 'border-2 border-dashed border-primary/40 text-primary/60'
                  : 'bg-muted/50 text-muted-foreground/40'
            }`}
            title={`${day.date}: ${day.completed ? `${day.score}/3` : 'Not completed'}`}
          >
            {day.completed ? (day.score === 3 ? '★' : day.score) : day.isToday ? '·' : ''}
          </motion.div>
          <span className={`text-[9px] leading-none ${day.isToday ? 'font-bold text-primary' : 'text-muted-foreground/60'}`}>
            {day.label}
          </span>
        </div>
      ))}
    </div>
  )
})
