'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled aria-label={t('theme.lightTooltip')}>
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const tooltip =
    theme === 'light'
      ? t('theme.lightTooltip')
      : theme === 'dark'
        ? t('theme.darkTooltip')
        : t('theme.systemTooltip')

  const icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 transition-all duration-200 hover:bg-primary/5"
      onClick={cycleTheme}
      title={tooltip}
      aria-label={tooltip}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme || 'system'}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {icon === Moon ? (
            <Moon className="h-4 w-4" />
          ) : icon === Sun ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Monitor className="h-4 w-4" />
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  )
});
