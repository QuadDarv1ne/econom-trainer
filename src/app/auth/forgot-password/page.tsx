'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, CheckCircle2, ArrowLeft, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';
import { safeErrorMessage } from '@/lib/safe-error';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(safeErrorMessage(data, t('auth.error.saveError')));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('auth.error.genericError'));
    } finally {
      setLoading(false);
    }
  }, [email, t]);

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
                <Lock className="h-7 w-7 text-white" />
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">
              {success ? t('auth.forgotPassword.successTitle') : t('auth.forgotPassword.title')}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {success ? t('auth.forgotPassword.successDesc') : t('auth.forgotPassword.subtitle')}
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
                  <Mail className="h-4 w-4" />
                  {t('auth.forgotPassword.successTitle')}
                </div>
                <Link href="/auth/login">
                  <Button className="w-full h-11 font-semibold">
                    {t('auth.forgotPassword.backToLogin')}
                  </Button>
                </Link>
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
                    <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        required
                        autoComplete="email"
                      />
                    </div>
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
                            {t('auth.forgotPassword.loading')}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="submit"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {t('auth.forgotPassword.submit')}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>

                  <div className="text-center text-sm pt-1">
                    <Link href="/auth/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <ArrowLeft className="h-3 w-3" />
                      {t('auth.forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
