'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

interface CelebrationProps {
  active: boolean
  particleCount?: number
}

const COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4']

export const Celebration = memo(function Celebration({ active, particleCount = 24 }: CelebrationProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 300,
        y: -(Math.random() * 200 + 80),
        rotation: Math.random() * 360,
        size: Math.random() * 6 + 4,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: Math.random() * 1 + 1.5,
      })),
    [particleCount],
  )

  if (!active) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            scale: 0,
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <div
            className="rounded-sm"
            style={{
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
})
