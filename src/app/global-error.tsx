'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t, translations } from '@/lib/i18n';
import { logError } from '@/lib/log-error';
import { AlertTriangle, RefreshCw, Home, Github } from 'lucide-react';

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
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    logError('global-error', error);
  }, [error]);

  return (
    <html lang={locale}>
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-destructive">
                {t('globalError.title', locale)}
              </CardTitle>
              <CardDescription>
                {t('globalError.description', locale)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {isDevelopment && (
                <details className="rounded-md bg-muted p-3 text-sm">
                  <summary className="cursor-pointer font-medium text-muted-foreground">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all text-xs font-mono text-destructive">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
              {!isDevelopment && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    {t('error.unknown', locale)}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={reset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('globalError.reload', locale)}
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = '/')} className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  {t('globalError.goHome', locale)}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => window.open('https://github.com/QuadDarv1ne/econom-trainer/issues/new', '_blank', 'noopener,noreferrer')}
              >
                <Github className="mr-2 h-4 w-4" />
                Report this bug on GitHub
              </Button>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
