'use client';

import type React from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'shadow-lg hover:shadow-xl',
  secondary: 'bg-secondary hover:bg-secondary/80',
  outline: 'border-2 bg-transparent hover:bg-accent',
  ghost: 'bg-transparent hover:bg-accent',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-xl',
};

const gradientClasses = {
  blue: 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
  purple: 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
  green: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
  orange: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
  pink: 'from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
};

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', size = 'md', gradient = 'purple', loading, children, disabled, onClick, ...props }, ref) => {
    const baseClass = 'relative font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
    
    if (variant === 'primary') {
      return (
        <button
          ref={ref}
          className={cn(
            baseClass,
            sizeClasses[size],
            `bg-gradient-to-r ${gradientClasses[gradient]}`,
            variantClasses[variant],
            'text-white',
            'hover:scale-105 active:scale-98',
            className
          )}
          disabled={disabled || loading}
          onClick={onClick}
          {...props}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {children}
            </span>
          ) : (
            children
          )}
          {/* Glow effect */}
          <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r ${gradientClasses[gradient]} blur-lg opacity-30 hover:opacity-50 transition-opacity duration-300 -z-10`} />
        </button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClass,
          sizeClasses[size],
          variantClasses[variant],
          'hover:scale-105 active:scale-98',
          className
        )}
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
