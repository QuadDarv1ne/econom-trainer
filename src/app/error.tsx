'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n-provider';
import { logError } from '@/lib/log-error';
import { AlertTriangle, RefreshCw, Home, Github } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    logError('error-boundary', error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">
            {t('error.title')}
          </CardTitle>
          <CardDescription>
            {t('error.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isDevelopment && (
            <details className="rounded-md bg-muted p-3 text-sm">
              <summary className="cursor-pointer font-medium text-muted-foreground">
                {t('error.details')}
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
                {t('error.unknown')}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('error.retry')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              {t('error.goHome')}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => window.open('https://github.com/QuadDarv1ne/econom-trainer/issues/new', '_blank', 'noopener,noreferrer')}
          >
            <Github className="mr-2 h-4 w-4" />
            {t('error.reportBug')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
