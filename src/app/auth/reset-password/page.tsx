'use client';

import type React from 'react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
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
        setError(safeErrorMessage(data, t('auth.error.resetError')));
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
            <AlertDescription>{t('auth.error.missingToken')}</AlertDescription>
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

              <PasswordStrengthMeter password={password} t={t} />
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
