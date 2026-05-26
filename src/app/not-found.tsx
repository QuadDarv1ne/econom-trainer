import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { t, getServerLocale, type Locale } from '@/lib/server-locale'

export default async function NotFound() {
  const locale = await getServerLocale()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">{t('notFound.description', locale as Locale)}</p>
        <Button asChild>
          <Link href="/">{t('notFound.backHome', locale as Locale)}</Link>
        </Button>
      </div>
    </div>
  )
}
