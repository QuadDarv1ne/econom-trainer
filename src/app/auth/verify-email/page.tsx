'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GraduationCap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

function VerifyEmailContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<string | null>(searchParams.get('status'))
  const submittedRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email || status || submittedRef.current) return
    submittedRef.current = true
    formRef.current?.submit()
  }, [token, email, status])

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.verifyEmail.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <CardDescription>{t('auth.verifyEmail.success')}</CardDescription>
            <Link href="/auth/login" className="text-primary hover:underline">
              {t('auth.verifyEmail.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'invalid' || status === 'expired' || status === 'error') {
    const message =
      status === 'invalid'
        ? t('auth.verifyEmail.invalid')
        : status === 'expired'
          ? t('auth.verifyEmail.expired')
          : t('auth.verifyEmail.error')
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.verifyEmail.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Link href="/" className="text-primary hover:underline">
              {t('auth.verifyEmail.backToHome')}
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">{t('auth.verifyEmail.title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="space-y-4">
          {token && email ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <CardDescription>
                {t('auth.verifyEmail.verifying') || 'Verifying your email...'}
              </CardDescription>
            </>
          ) : (
            <>
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
              <Alert variant="default">
                <AlertDescription>{t('auth.verifyEmail.pending')}</AlertDescription>
              </Alert>
            </>
          )}
          <Link href="/" className="text-primary hover:underline">
            {t('auth.verifyEmail.backToHome')}
          </Link>
        </div>
      </CardContent>
    </Card>
    <form ref={formRef} method="POST" action="/api/auth/verify-email" className="hidden">
      <input type="hidden" name="token" value={token || ''} />
      <input type="hidden" name="email" value={email || ''} />
    </form>
    </>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
