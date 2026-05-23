'use client'

import React from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { GraduationCap, Home, User, BarChart3, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n-provider'

interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
  showLabel?: boolean
}

interface AppHeaderProps {
  title: string
  variant?: 'simple' | 'full'
}

export function AppHeader({ title, variant = 'simple' }: AppHeaderProps) {
  const { t } = useI18n()

  const navLinks: NavLink[] = variant === 'full'
    ? [
        { href: '/', label: t('dashboard.home'), icon: <Home className="h-4 w-4 mr-2" />, showLabel: true },
        { href: '/dashboard', label: t('dashboard.title'), icon: <BarChart3 className="h-4 w-4 mr-2" />, showLabel: true },
      ]
    : [
        { href: '/', label: t('dashboard.home'), icon: <Home className="h-4 w-4" /> },
        { href: '/profile', label: t('profile.title'), icon: <User className="h-4 w-4" /> },
      ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-lg font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size={link.showLabel ? 'sm' : 'icon'} className={link.showLabel ? '' : 'h-8 w-8'}>
                {link.icon}
                {link.showLabel && <span>{link.label}</span>}
                {!link.showLabel && <span className="sr-only">{link.label}</span>}
              </Button>
            </Link>
          ))}
          <Button variant="ghost" size={variant === 'full' ? 'sm' : 'icon'} className={variant === 'full' ? '' : 'h-8 w-8'} onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className={variant === 'full' ? 'h-4 w-4 mr-2' : 'h-4 w-4'} />
            {variant === 'full' && <span>{t('dashboard.signOut')}</span>}
            {variant !== 'full' && <span className="sr-only">{t('dashboard.signOut')}</span>}
          </Button>
        </div>
      </div>
    </header>
  )
}
