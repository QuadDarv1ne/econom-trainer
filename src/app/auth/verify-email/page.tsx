'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Mail } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

function VerifyEmailContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const [status] = useState<string | null>(searchParams.get('status'))
  const submittedRef = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email || status || submittedRef.current) return
    submittedRef.current = true
    formRef.current?.submit()
  }, [token, email, status])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md"
    >
      <Card className="border-primary/10 shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3 text-center pb-4">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${
              status === 'success'
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25'
                : status === 'invalid' || status === 'expired' || status === 'error'
                  ? 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'
                  : 'bg-gradient-to-br from-primary to-purple-600 shadow-primary/25'
            }`}>
              {status === 'success' ? (
                <CheckCircle2 className="h-7 w-7 text-white" />
              ) : status === 'invalid' || status === 'expired' || status === 'error' ? (
                <AlertCircle className="h-7 w-7 text-white" />
              ) : (
                <Mail className="h-7 w-7 text-white" />
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.verifyEmail.title')}</CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {!status && token && email && (
              <div className="space-y-4 py-4">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                <CardDescription className="text-base">
                  {t('auth.verifyEmail.verifying') || 'Verifying your email...'}
                </CardDescription>
              </div>
            )}

            {!status && !token && !email && (
              <div className="space-y-4 py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  {t('auth.verifyEmail.pending')}
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex justify-center"
                >
                  <CheckCircle2 className="h-20 w-20 text-green-500" />
                </motion.div>
                <CardDescription className="text-base">{t('auth.verifyEmail.success')}</CardDescription>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  {t('auth.verifyEmail.backToLogin')}
                </Link>
              </div>
            )}

            {(status === 'invalid' || status === 'expired' || status === 'error') && (
              <div className="space-y-4 py-2">
                <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {status === 'invalid'
                      ? t('auth.verifyEmail.invalid')
                      : status === 'expired'
                        ? t('auth.verifyEmail.expired')
                        : t('auth.verifyEmail.error')}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {status && (
              <div className="pt-2">
                <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {t('auth.verifyEmail.backToHome')}
                </Link>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
      <form ref={formRef} method="POST" action="/api/auth/verify-email" className="hidden">
        <input type="hidden" name="token" value={token || ''} />
        <input type="hidden" name="email" value={email || ''} />
      </form>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
