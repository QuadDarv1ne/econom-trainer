'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface AchievementBadgeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: 'gold' | 'silver' | 'bronze' | 'purple' | 'blue' | 'green';
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gradientClasses = {
  gold: 'from-yellow-400 to-amber-500',
  silver: 'from-gray-300 to-gray-400',
  bronze: 'from-orange-400 to-orange-600',
  purple: 'from-purple-400 to-pink-500',
  blue: 'from-blue-400 to-cyan-500',
  green: 'from-green-400 to-emerald-500',
};

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const iconSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function AchievementBadge({
  icon: Icon,
  title,
  description,
  gradient,
  unlocked,
  size = 'md',
  className,
}: AchievementBadgeProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, rotate: unlocked ? 5 : 0 }}
      className={cn('relative', className)}
    >
      {/* Badge container */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center shadow-lg',
          sizeClasses[size],
          unlocked
            ? `bg-gradient-to-br ${gradientClasses[gradient]} ring-4 ring-white dark:ring-gray-900`
            : 'bg-gray-200 dark:bg-gray-800 grayscale'
        )}
      >
        {/* Glow effect for unlocked badges */}
        {unlocked && (
          <>
            <motion.div
              className={cn('absolute inset-0 rounded-full bg-gradient-to-br', gradientClasses[gradient])}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className={cn('absolute -inset-1 rounded-full bg-gradient-to-br', gradientClasses[gradient])}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}

        {/* Icon */}
        <Icon
          className={cn(
            unlocked
              ? 'relative z-10 text-white'
              : 'relative z-10 text-gray-400 dark:text-gray-500',
            iconSizeClasses[size],
            unlocked ? 'opacity-100' : 'opacity-50'
          )}
        />

        {/* Lock overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-black/50 rounded-full p-1">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Title and description */}
      <div className="mt-3 text-center">
        <p className={cn('font-semibold text-sm', unlocked ? 'text-foreground' : 'text-muted-foreground')}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

interface AchievementsGridProps {
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    gradient: 'gold' | 'silver' | 'bronze' | 'purple' | 'blue' | 'green';
    unlocked: boolean;
  }>;
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {achievements.map((achievement, index) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <AchievementBadge
            icon={achievement.icon}
            title={achievement.title}
            description={achievement.description}
            gradient={achievement.gradient}
            unlocked={achievement.unlocked}
            size="md"
          />
        </motion.div>
      ))}
    </div>
  );
}
