'use client';

import type React from 'react';
import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, KeyRound, CheckCircle2, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/shared/password-strength-meter';
import { REDIRECT_DELAY_MS } from '@/lib/constants';
import { safeErrorMessage } from '@/lib/safe-error';

function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    }
  }, [])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordStrength.minLength'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(safeErrorMessage(data, t('auth.error.resetError')));
      } else {
        setSuccess(true);
        redirectTimerRef.current = setTimeout(() => router.push('/auth/login'), REDIRECT_DELAY_MS);
      }
    } catch {
      setError(t('auth.error.genericError'));
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, token, router, t]);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('auth.error.missingToken')}</AlertDescription>
            </Alert>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

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
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              {success ? (
                <CheckCircle2 className="h-7 w-7 text-white" />
              ) : (
                <KeyRound className="h-7 w-7 text-white" />
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">
              {success ? t('auth.resetPassword.successTitle') : t('auth.resetPassword.title')}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {success ? t('auth.resetPassword.successDesc') : t('auth.resetPassword.subtitle')}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-2"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('auth.resetPassword.successTitle')}
                </div>
                <Button onClick={() => router.push('/auth/login')} className="w-full h-11 font-semibold">
                  {t('auth.forgotPassword.backToLogin')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={onSubmit} className="space-y-4">
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">{t('auth.resetPassword.newPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <PasswordStrengthMeter password={password} t={t} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('auth.resetPassword.confirmPassword')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <AnimatePresence>
                      {confirmPassword && password !== confirmPassword && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-red-500 flex items-center gap-1"
                        >
                          <AlertCircle className="h-3 w-3" />
                          {t('profile.passwordMismatch')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full h-11 font-semibold relative overflow-hidden group" disabled={loading}>
                      <AnimatePresence mode="wait">
                        {loading ? (
                          <motion.span
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                          >
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('auth.resetPassword.loading')}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="submit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {t('auth.resetPassword.submit')}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
