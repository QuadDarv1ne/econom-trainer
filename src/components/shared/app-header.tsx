'use client'

import type { ReactNode } from 'react'
import { useMemo, memo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Home, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n-provider'
import { signOutAndClearStore } from '@/lib/sign-out'

interface NavLink {
  href: string
  label: string
  icon: ReactNode
  showLabel?: boolean
}

interface AppHeaderProps {
  title: string
  variant?: 'simple' | 'full'
}

export const AppHeader = memo(function AppHeader({ title, variant = 'simple' }: AppHeaderProps) {
  const { t } = useI18n()

  const navLinks: NavLink[] = useMemo(() => variant === 'full'
    ? [
        { href: '/', label: t('dashboard.home'), icon: <Home className="h-4 w-4 mr-2" />, showLabel: true },
        { href: '/profile', label: t('profile.title'), icon: <User className="h-4 w-4 mr-2" />, showLabel: true },
      ]
    : [
        { href: '/', label: t('dashboard.home'), icon: <Home className="h-4 w-4" /> },
        { href: '/profile', label: t('profile.title'), icon: <User className="h-4 w-4" /> },
      ], [variant, t])

  return (
    <header className="sticky top-0 z-50 border-b glass transition-all duration-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" aria-label={t('home.title')} className="flex items-center gap-3 group">
          <motion.div
            className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <h1 className="text-lg font-bold gradient-text">{title}</h1>
        </Link>
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size={link.showLabel ? 'sm' : 'icon'} className={link.showLabel ? 'transition-all duration-200 hover:bg-primary/5' : 'h-8 w-8 transition-all duration-200 hover:bg-primary/5'}>
                  {link.icon}
                  {link.showLabel && <span>{link.label}</span>}
                  {!link.showLabel && <span className="sr-only">{link.label}</span>}
                </Button>
              </Link>
            ))}
          </div>
          <Button variant="ghost" size={variant === 'full' ? 'sm' : 'icon'} className={`transition-all duration-200 hover:bg-primary/5 ${variant === 'full' ? '' : 'h-8 w-8'}`} onClick={() => signOutAndClearStore({ callbackUrl: '/' })}>
            <LogOut className={variant === 'full' ? 'h-4 w-4 mr-2' : 'h-4 w-4'} />
            {variant === 'full' && <span>{t('dashboard.signOut')}</span>}
            {variant !== 'full' && <span className="sr-only">{t('dashboard.signOut')}</span>}
          </Button>
        </div>
      </div>
    </header>
  )
})
