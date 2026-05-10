'use client'

import { Providers } from './providers'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl mb-8">Страница не найдена</p>
          <Button asChild>
            <Link href="/">Вернуться на главную</Link>
          </Button>
        </div>
      </div>
    </Providers>
  )
}
