'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n-provider';
import { logError } from '@/lib/log-error';

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-destructive">
            {t('error.title')}
          </CardTitle>
          <CardDescription>
            {t('error.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-md bg-muted p-3">
            <p className="break-all text-sm font-mono text-muted-foreground">
              {error.message || t('error.unknown')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              {t('error.retry')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
              {t('error.goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
