'use client';

import type React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rounded' | 'card';
  width?: string;
  height?: string;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion()
  const baseClass = 'bg-muted rounded';
  
  const variantClasses = {
    text: 'rounded-sm',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
    card: 'rounded-2xl',
  };

  return (
    <motion.div
      className={cn(
        baseClass,
        variantClasses[variant],
        'overflow-hidden relative',
        width && width,
        height && height,
        className
      )}
      animate={shouldReduceMotion ? {} : { opacity: [0.4, 0.8, 0.4] }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={shouldReduceMotion ? {} : { x: ['-100%', '200%'] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
}

export function SkeletonCard({ className, showAvatar = true, showTitle = true, showDescription = true }: SkeletonCardProps) {
  return (
    <div className={cn('p-4 space-y-3', className)}>
      <div className="flex items-start gap-3">
        {showAvatar && <Skeleton variant="circular" className="h-12 w-12 flex-shrink-0" />}
        <div className="flex-1 space-y-2">
          {showTitle && <Skeleton className="h-5 w-3/4" />}
          {showDescription && <Skeleton className="h-4 w-full" />}
          {showDescription && <Skeleton className="h-4 w-2/3" />}
        </div>
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  variant?: 'text' | 'card';
}

export function SkeletonList({ count = 5, variant = 'text' }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} className="h-12 w-full" />
      ))}
    </div>
  );
}
