'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t, translations } from '@/lib/i18n';
import { logError } from '@/lib/log-error';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function getLocale(): 'ru' | 'en' | 'zh' {
  if (typeof window === 'undefined') return 'ru';
  try {
    const stored = localStorage.getItem('locale');
    if (stored && stored in translations) return stored as 'ru' | 'en' | 'zh';
  } catch {
    // localStorage may be unavailable
  }
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('ru')) return 'ru';
  return 'en';
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale] = useState<'ru' | 'en' | 'zh'>(getLocale());

  useEffect(() => {
    logError('global-error', error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-destructive">
                {t('globalError.title', locale)}
              </CardTitle>
              <CardDescription>
                {t('globalError.description', locale)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-md bg-muted p-3">
                <p className="break-all text-sm font-mono text-muted-foreground">
                  {error.message || t('error.unknown', locale)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={reset} className="flex-1">
                  {t('globalError.reload', locale)}
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = '/')} className="flex-1">
                  {t('globalError.goHome', locale)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
