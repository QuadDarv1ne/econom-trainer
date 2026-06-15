'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rounded' | 'card'
  delay?: number
}

export function Skeleton({ className, variant = 'text', delay = 0 }: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full',
    circular: 'rounded-full aspect-square',
    rounded: 'rounded-lg',
    card: 'rounded-2xl',
  }

  return (
    <motion.div
      className={cn(
        'bg-muted rounded-md',
        variants[variant],
        'relative overflow-hidden',
        className
      )}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, delay }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
    </motion.div>
  )
}

export function CardSkeleton({ lines = 3, delay = 0 }: { lines?: number; delay?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" className="h-12 w-12" delay={delay} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" delay={delay + 0.1} />
          <Skeleton className="h-4 w-1/2" delay={delay + 0.2} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" delay={delay + 0.3 + i * 0.1} />
      ))}
    </div>
  )
}

export function ModuleCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-0 overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton variant="circular" className="h-14 w-14" delay={0} />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" delay={0.1} />
            <Skeleton className="h-5 w-20" delay={0.2} />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" delay={0.3} />
          <Skeleton className="h-4 w-full" delay={0.4} />
          <Skeleton className="h-4 w-2/3" delay={0.5} />
        </div>
        <Skeleton variant="rounded" className="h-8 w-full" delay={0.6} />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton variant="circular" className="h-10 w-10" delay={0} />
        <Skeleton className="h-6 w-16" delay={0.1} />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" delay={0.2} />
        <Skeleton className="h-4 w-32" delay={0.3} />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4 py-6">
      <Skeleton variant="circular" className="h-12 w-12" delay={0} />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-7 w-48" delay={0.1} />
        <Skeleton className="h-4 w-64" delay={0.2} />
      </div>
    </div>
  )
}

export function TabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" delay={i * 0.1} />
        ))}
      </div>
      <CardSkeleton lines={5} delay={0.3} />
    </div>
  )
}

export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" delay={i * 0.1} />
          <Skeleton className="h-11 w-full" delay={i * 0.1 + 0.05} />
        </div>
      ))}
      <Skeleton className="h-11 w-32" delay={0.4} />
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <Skeleton variant="circular" className="h-10 w-10" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex border-b pb-2">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" delay={i * 0.05} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-8 flex-1"
              delay={rowIndex * 0.1 + colIndex * 0.02}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
