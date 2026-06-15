'use client';

import type React from 'react';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2, Mail, User, Phone, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/shared/password-strength-meter';
import { checkPasswordStrength } from '@/lib/password-strength';
import { REDIRECT_DELAY_MS } from '@/lib/constants';
import { safeErrorMessage } from '@/lib/safe-error';

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.error.minPasswordLength'));
      return;
    }

    const { requirements } = passwordStrength;
    const allRequirementsMet = Object.values(requirements).every(Boolean);
    if (!allRequirementsMet) {
      setError(t('passwordStrength.weak'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(safeErrorMessage(data, t('auth.error.registrationError')));
      } else {
        setSuccess(true);
        redirectTimerRef.current = setTimeout(() => router.push('/auth/login'), REDIRECT_DELAY_MS);
      }
    } catch {
      setError(t('auth.error.genericError'));
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, passwordStrength, email, name, phone, router, t]);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-green-500/20 shadow-2xl shadow-green-500/5">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-2xl font-bold">{t('auth.register.successTitle')}</CardTitle>
              <CardDescription className="text-sm mt-2">{t('auth.register.successDesc')}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm">
                <Mail className="h-4 w-4" />
                {t('profile.verificationSent')}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {t('auth.register.redirectNotice')}
              </p>
            </motion.div>
          </CardContent>
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
              <Sparkles className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.register.title')}</CardTitle>
            <CardDescription className="text-sm mt-1">{t('auth.register.subtitle')}</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
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
              <Label htmlFor="name" className="text-sm font-medium">{t('auth.register.name')}</Label>
              <div className="relative group/input">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.register.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
              <div className="relative group/input">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.register.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                {t('auth.register.phone')}
                <span className="text-muted-foreground font-normal"> ({t('auth.register.optional')})</span>
              </Label>
              <div className="relative group/input">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('auth.register.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{t('auth.register.password')}</Label>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  required
                  autoComplete="new-password"
                />
              </div>
              <PasswordStrengthMeter password={password} t={t} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('auth.register.confirmPassword')}</Label>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
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

            <motion.div whileTap={{ scale: 0.98 }} className="pt-1">
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
                      {t('auth.register.loading')}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="submit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {t('auth.register.submit')}
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-5 flex items-center justify-center gap-4 text-sm"
          >
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3 w-3" />
              {t('auth.login.backToHome')}
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-muted-foreground">{t('auth.register.hasAccount')}</span>{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors">
              {t('auth.register.signIn')}
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
