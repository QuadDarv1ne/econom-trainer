'use client';

import type React from 'react';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2, KeyRound, CheckCircle2, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';
import { PasswordInput } from '@/components/ui/password-input';
import { checkPasswordStrength } from '@/lib/password-strength';
import { REDIRECT_DELAY_MS } from '@/lib/constants';

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

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  useEffect(() => {
    if (!token) {
      setError(t('auth.error.missingToken'));
    }
  }, [token, t]);

  async function onSubmit(e: React.FormEvent) {
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
        setError(data.error || t('auth.error.resetError'));
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), REDIRECT_DELAY_MS);
      }
    } catch {
      setError(t('auth.error.genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardHeader>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>{t('auth.resetPassword.successTitle')}</CardTitle>
          <CardDescription>{t('auth.resetPassword.successDesc')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.resetPassword.title')}</CardTitle>
          <CardDescription>{t('auth.resetPassword.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.resetPassword.newPassword')}</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              {password && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t('passwordStrength.label')}</span>
                    <span className="text-xs font-medium">{t(passwordStrength.label)}</span>
                  </div>
                  <Progress
                    value={(passwordStrength.score / 4) * 100}
                    className={`h-1 ${passwordStrength.color}`}
                  />

                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {[
                      { key: 'passwordStrength.minLength', met: passwordStrength.requirements.minLength },
                      { key: 'passwordStrength.hasUpper', met: passwordStrength.requirements.hasUpper },
                      { key: 'passwordStrength.hasLower', met: passwordStrength.requirements.hasLower },
                      { key: 'passwordStrength.hasNumber', met: passwordStrength.requirements.hasNumber },
                      { key: 'passwordStrength.hasSpecial', met: passwordStrength.requirements.hasSpecial },
                    ].map(({ key, met }) => (
                      <div key={key} className="flex items-center gap-1 text-xs">
                        {met ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                          {t(key)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">{t('profile.passwordMismatch')}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.resetPassword.loading')}</>
              ) : (
                t('auth.resetPassword.submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
