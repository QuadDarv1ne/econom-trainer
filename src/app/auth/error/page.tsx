'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';

export default function AuthErrorPage() {
  const { t } = useI18n();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl">{t('auth.error.title')}</CardTitle>
        <CardDescription>{t('auth.error.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Link href="/auth/login">
            <Button className="w-full">{t('auth.error.tryAgain')}</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {t('auth.error.backToHome')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
