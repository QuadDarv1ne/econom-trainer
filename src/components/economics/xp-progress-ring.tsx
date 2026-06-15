'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface XpProgressRingProps {
  level: number
  currentXp: number
  xpForNextLevel: number
  shouldReduceMotion: boolean | null
  className?: string
}

export const XpProgressRing = memo(function XpProgressRing({
  level,
  currentXp,
  xpForNextLevel,
  shouldReduceMotion,
  className = '',
}: XpProgressRingProps) {
  const progress = xpForNextLevel > 0 ? currentXp / xpForNextLevel : 0
  const size = 40
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={shouldReduceMotion ? {} : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
          className="text-yellow-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
          {level}
        </span>
      </div>
    </div>
  )
})

interface MobileXpPillProps {
  level: number
  totalXp: number
  currentXp: number
  xpForNextLevel: number
  shouldReduceMotion: boolean | null
  formatNumber: (v: number) => string
  xpLabel: string
}

export const MobileXpPill = memo(function MobileXpPill({
  level,
  totalXp,
  currentXp,
  xpForNextLevel,
  shouldReduceMotion,
  formatNumber,
  xpLabel,
}: MobileXpPillProps) {
  return (
    <div className="flex sm:hidden items-center gap-1.5">
      <XpProgressRing
        level={level}
        currentXp={currentXp}
        xpForNextLevel={xpForNextLevel}
        shouldReduceMotion={shouldReduceMotion}
      />
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-200 dark:border-yellow-800">
        <Zap className="h-3 w-3 text-yellow-500" />
        <span className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-400">
          {formatNumber(totalXp)} {xpLabel}
        </span>
      </div>
    </div>
  )
})
