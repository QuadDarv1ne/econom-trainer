'use client';

import type React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
  delay?: number;
}

const gradientClasses = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-pink-500',
  green: 'from-green-500 to-emerald-500',
  orange: 'from-orange-500 to-amber-500',
  pink: 'from-pink-500 to-rose-500',
  cyan: 'from-cyan-500 to-blue-500',
};

export function StatsCard({ icon: Icon, title, value, subtitle, gradient, delay = 0 }: StatsCardProps) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, delay }}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border shadow-lg hover:shadow-2xl transition-all duration-300">
        {/* Gradient background overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses[gradient]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        {/* Animated blob */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${gradientClasses[gradient]} rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
        
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientClasses[gradient]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <motion.div
              animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${gradientClasses[gradient]} animate-pulse`} />
            </motion.div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className={`h-1 w-full bg-gradient-to-r ${gradientClasses[gradient]}`} />
      </div>
    </motion.div>
  );
}
