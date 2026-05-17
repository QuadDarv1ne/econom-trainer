'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n-provider'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">{t('notFound.description')}</p>
        <Button asChild>
          <Link href="/">{t('notFound.backHome')}</Link>
        </Button>
      </div>
    </div>
  )
}
