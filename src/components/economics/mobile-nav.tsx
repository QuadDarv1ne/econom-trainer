'use client'

import { memo, useMemo, useCallback } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Home, Landmark, SlidersHorizontal, DollarSign, Wrench, type LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

interface Category {
  id: string
  icon: LucideIcon
  labelKey: string
}

const categories: Category[] = [
  { id: 'home', icon: Home, labelKey: 'home.tab.home' },
  { id: 'macro', icon: Landmark, labelKey: 'home.cat.macro' },
  { id: 'micro', icon: SlidersHorizontal, labelKey: 'home.cat.micro' },
  { id: 'finance', icon: DollarSign, labelKey: 'home.cat.finance' },
  { id: 'tools', icon: Wrench, labelKey: 'home.cat.tools' },
]

interface MobileNavProps {
  activeTab: string
  onCategoryPress: (categoryId: string) => void
  categoryModuleIds: Record<string, string[]>
}

export const MobileNav = memo(function MobileNav({
  activeTab,
  onCategoryPress,
  categoryModuleIds,
}: MobileNavProps) {
  const { t } = useI18n()
  const shouldReduceMotion = useReducedMotion()

  const activeCategory = useMemo(() => {
    if (activeTab === 'home') return 'home'
    for (const [catId, moduleIds] of Object.entries(categoryModuleIds)) {
      if (moduleIds.includes(activeTab)) return catId
    }
    return null
  }, [activeTab, categoryModuleIds])

  const handlePress = useCallback(
    (catId: string) => {
      if (catId === activeCategory) return
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(6) } catch { /* noop */ }
      }
      onCategoryPress(catId)
    },
    [activeCategory, onCategoryPress]
  )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t glass"
      role="navigation"
      aria-label={t('home.mobileNavLabel') || 'Category navigation'}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => handlePress(cat.id)}
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors duration-200 min-w-[56px] tap-target-sm ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground/70 active:text-foreground active:bg-accent/50'
              }`}
              aria-label={t(cat.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <AnimatePresence>
                {isActive && !shouldReduceMotion && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
              {isActive && shouldReduceMotion && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl" />
              )}
              <Icon
                className={`h-5 w-5 relative z-10 transition-all duration-200 ${
                  isActive ? 'scale-110 drop-shadow-sm' : ''
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] relative z-10 leading-tight transition-all duration-200 ${
                  isActive ? 'font-bold tracking-wide' : 'font-medium'
                }`}
              >
                {t(cat.labelKey)}
              </span>
              <AnimatePresence>
                {isActive && !shouldReduceMotion && (
                  <motion.span
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-0 h-1 w-1 rounded-full bg-primary z-10"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </div>
    </nav>
  )
})
