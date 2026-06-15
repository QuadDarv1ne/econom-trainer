'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import React, { useState, type ReactNode } from 'react'

interface FloatingParticle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface BackgroundParticlesProps {
  count?: number
  className?: string
  color?: string
}

export function BackgroundParticles({
  count = 20,
  className,
  color = 'rgba(99, 102, 241, 0.1)',
}: BackgroundParticlesProps) {
  const [particles] = useState<FloatingParticle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: seededRandom(i * 7 + 1) * 100,
      y: seededRandom(i * 13 + 5) * 100,
      size: seededRandom(i * 17 + 3) * 4 + 2,
      duration: seededRandom(i * 23 + 9) * 20 + 15,
      delay: seededRandom(i * 31 + 11) * 5,
    }))
  )

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'gradient'
  delay?: number
}

export function AnimatedCard({
  children,
  variant = 'default',
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  const variants = {
    default: 'bg-card border border-border shadow-sm hover:shadow-md',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border-primary/20 shadow-lg',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'rounded-2xl transition-all duration-300',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface ShimmerButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function ShimmerButton({
  children,
  variant = 'primary',
  className,
  ...props
}: ShimmerButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_100%]',
    secondary: 'bg-gradient-to-r from-secondary via-muted to-secondary bg-[length:200%_100%]',
    ghost: 'bg-gradient-to-r from-transparent via-primary/10 to-transparent bg-[length:200%_100%]',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-lg font-semibold transition-all duration-300',
        'hover:shadow-lg active:shadow-sm',
        'py-3 px-6 text-white',
        variants[variant],
        className
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: ReactNode
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'stroke-primary',
  children,
}: ProgressRingProps) {
  const normalizedRadius = size / 2 - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-muted"
        />
        <motion.circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

interface RippleEffectProps {
  onClick: () => void
  children: ReactNode
  className?: string
}

export function RippleEffect({ onClick, children, className }: RippleEffectProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([])

  const createRipple = (event: React.MouseEvent) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y,
    }

    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)
  }

  return (
    <button
      onClick={(e) => {
        createRipple(e)
        onClick()
      }}
      className={cn('relative overflow-hidden', className)}
    >
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-primary/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
      {children}
    </button>
  )
}
