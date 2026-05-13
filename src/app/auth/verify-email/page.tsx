'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';

function VerifyEmailContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const success = searchParams.get('verified');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('auth.verifyEmail.title', 'ru')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {success ? (
            <div className="space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <CardDescription>{t('auth.verifyEmail.success', 'ru')}</CardDescription>
              <Link href="/auth/login" className="text-primary hover:underline">
                {t('auth.verifyEmail.backToLogin', 'ru')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto" />
              <Alert variant="default">
                <AlertDescription>{t('auth.verifyEmail.pending', 'ru')}</AlertDescription>
              </Alert>
              <Link href="/" className="text-primary hover:underline">
                {t('auth.verifyEmail.backToHome', 'ru')}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
