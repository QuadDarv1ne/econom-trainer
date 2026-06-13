'use client';

import type React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  indicatorClassName,
  showValue = false,
  size = 'md',
  gradient = true,
}: AnimatedProgressProps) {
  const shouldReduceMotion = useReducedMotion()
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('relative', className)}>
      {/* Background bar */}
      <div className={cn(
        'w-full rounded-full bg-muted overflow-hidden',
        sizeClasses[size]
      )}>
        {/* Animated progress bar */}
        <motion.div
          initial={shouldReduceMotion ? false : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full relative',
            gradient
              ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500'
              : indicatorClassName
          )}
        >
          {/* Shimmer effect */}
          {gradient && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={shouldReduceMotion ? {} : { x: ['-100%', '200%'] }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          )}
          
          {/* Pulse dots */}
          {gradient && percentage > 0 && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 bg-white rounded-full shadow-lg"
              animate={shouldReduceMotion ? {} : { 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1],
              }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
      
      {/* Value indicator */}
      {showValue && (
        <div className="absolute -top-6 right-0">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap"
          >
            {Math.round(percentage)}%
          </motion.div>
          {/* Arrow pointer */}
          <div className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-primary" />
        </div>
      )}
    </div>
  );
}
