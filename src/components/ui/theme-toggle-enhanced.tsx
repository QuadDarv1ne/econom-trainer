'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Laptop } from 'lucide-react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { useI18n } from '@/lib/i18n-provider'

const emptySubscribe = () => () => {}

export function ThemeToggleEnhanced() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const { t } = useI18n()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const getIcon = () => {
    if (theme === 'system') return <Laptop className="h-4 w-4" />
    return resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const options = [
    {
      value: 'light',
      label: t('theme.light'),
      desc: t('theme.lightDesc'),
      icon: Sun,
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      value: 'dark',
      label: t('theme.dark'),
      desc: t('theme.darkDesc'),
      icon: Moon,
      iconBg: 'bg-slate-800',
      iconColor: 'text-slate-300',
    },
    {
      value: 'system',
      label: t('theme.system'),
      desc: t('theme.systemDesc'),
      icon: Laptop,
      iconBg: 'bg-gradient-to-br from-slate-100 to-slate-800',
      iconColor: 'text-foreground',
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative overflow-hidden group transition-all duration-300 hover:bg-primary/10 hover:scale-110"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${theme ?? 'system'}-${resolvedTheme ?? 'system'}`}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {getIcon()}
            </motion.div>
          </AnimatePresence>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {options.map((opt) => {
          const Icon = opt.icon
          const isActive = theme === opt.value
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex items-center gap-3 cursor-pointer transition-colors"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`h-8 w-8 rounded-lg ${opt.iconBg} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${opt.iconColor}`} />
              </motion.div>
              <div className="flex-1">
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-muted-foreground">{opt.desc}</div>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2 w-2 rounded-full bg-green-500"
                />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
