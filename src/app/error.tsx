'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-destructive">
            Произошла ошибка
          </CardTitle>
          <CardDescription>
            К сожалению, возникла непредвиденная ошибка. Попробуйте обновить страницу или вернитесь позже.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-md bg-muted p-3">
            <p className="break-all text-sm font-mono text-muted-foreground">
              {error.message || 'Unknown error'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Попробовать снова
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/')} className="flex-1">
              На главную
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
