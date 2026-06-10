'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

export const ThemeToggle = memo(function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)

  // Using a callback ref pattern to avoid setState in effect
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
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

  return (
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={cycleTheme} title={tooltip}>
      {theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : theme === 'light' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </Button>
  )
});
