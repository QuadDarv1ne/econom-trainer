'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ShimmerButton, BackgroundParticles } from '@/components/shared/animated-helpers'
import { GraduationCap, AlertCircle, Loader2, KeyRound, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordInput } from '@/components/ui/password-input';

function validateCallbackUrl(url: string): string {
  if (!url.startsWith('/')) return '/dashboard';
  if (url.startsWith('//') || url.startsWith('\\\\')) return '/dashboard';
  try {
    const parsed = new URL(url);
    if (parsed.origin !== window.location.origin) return '/dashboard';
  } catch {
    return '/dashboard';
  }
  return url;
}

function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = validateCallbackUrl(searchParams.get('callbackUrl') || '/dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        twoFactorCode: show2FA ? twoFactorCode : undefined,
        rememberMe,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        if (result.error === 'TwoFactorRequired' || result.error === 'Error: TwoFactorRequired') {
          setShow2FA(true);
          setError(t('auth.login.twoFactorCode'));
        } else if (result.error === 'CredentialsSignin') {
          setError(show2FA ? t('auth.error.invalidCode') : t('auth.error.invalidCredentials'));
        } else if (result.error === 'RateLimitExceeded' || result.error === 'Error: RateLimitExceeded') {
          setError(t('auth.error.rateLimitExceeded'));
        } else {
          setError(t('auth.error.loginError'));
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t('auth.error.genericError'));
    } finally {
      setLoading(false);
    }
  }, [email, password, show2FA, twoFactorCode, rememberMe, callbackUrl, router, t]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md"
    >
      <Card className="border-primary/10 shadow-2xl shadow-primary/5 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3 text-center pb-4">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">
              {show2FA ? t('auth.login.verifyTitle') : t('auth.login.title')}
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {show2FA ? t('auth.login.twoFactorHint') : t('auth.login.subtitle')}
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {!show2FA ? (
                <motion.div
                  key="login-fields"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">{t('auth.login.password')}</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-primary/80 hover:text-primary hover:underline transition-colors"
                      >
                        {t('auth.login.forgotPassword')}
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label htmlFor="remember" className="text-sm font-normal leading-tight cursor-pointer select-none">
                      {t('auth.login.rememberMe')}
                      <span className="block text-xs text-muted-foreground font-normal">
                        {t('auth.login.extendedSession')}
                      </span>
                    </Label>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="2fa-fields"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <Label htmlFor="twoFactor" className="flex items-center gap-2 text-sm font-medium justify-center">
                      <KeyRound className="h-4 w-4" />
                      {t('auth.login.twoFactorCode')}
                    </Label>
                    <div className="flex justify-center py-2">
                      <InputOTP
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={setTwoFactorCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-10 text-lg" />
                          <InputOTPSlot index={1} className="h-12 w-10 text-lg" />
                          <InputOTPSlot index={2} className="h-12 w-10 text-lg" />
                        </InputOTPGroup>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className="h-12 w-10 text-lg" />
                          <InputOTPSlot index={4} className="h-12 w-10 text-lg" />
                          <InputOTPSlot index={5} className="h-12 w-10 text-lg" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShow2FA(false); setTwoFactorCode(''); setError(''); }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mx-auto"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      {t('auth.login.backToLogin') || 'Back to login'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileTap={{ scale: 0.98 }}
              className="pt-1"
            >
              <ShimmerButton
                type="submit"
                className="w-full h-11 text-white"
                disabled={loading}
              >
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
                      {t('auth.login.loading')}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="submit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {show2FA ? t('auth.login.verify2FA') : t('auth.login.submit')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </ShimmerButton>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 flex items-center justify-center gap-4 text-sm"
          >
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3 w-3" />
              {t('auth.login.backToHome')}
            </Link>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-muted-foreground">{t('auth.login.noAccount')}</span>{' '}
            <Link href="/auth/register" className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors">
              {t('auth.login.signUp')}
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}



export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background relative overflow-hidden">
      <BackgroundParticles count={25} className="opacity-20" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
