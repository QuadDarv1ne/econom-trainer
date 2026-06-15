'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n-provider';
import { logError } from '@/lib/log-error';
import { AlertTriangle, RefreshCw, Home, Github, Bug, ChevronDown } from 'lucide-react';

function useSafeI18n(): { t: (key: string) => string; locale: string } {
  try {
    return useI18n();
  } catch {
    return { t: (key: string) => key, locale: 'en' };
  }
}

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useSafeI18n();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    logError('error-boundary', error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-background to-background" />
        <div className="absolute top-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-destructive/5 blur-3xl animate-glow-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <Card className="border-destructive/20 shadow-2xl shadow-destructive/5 backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-4">
            <motion.div
              className="flex justify-center mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-destructive to-rose-500 flex items-center justify-center shadow-lg shadow-destructive/25">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-2xl font-bold text-destructive">{t('error.title')}</CardTitle>
              <CardDescription className="text-sm mt-1">{t('error.description')}</CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {isDevelopment ? (
                <div className="rounded-xl bg-muted/50 border border-border/50 overflow-hidden">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      {t('error.details')}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <pre className="p-3 pt-0 overflow-x-auto whitespace-pre-wrap break-all text-xs font-mono text-destructive">
                          {error.message}
                          {error.stack && `\n\n${error.stack}`}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/50 border border-border/50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t('error.unknown')}</p>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button onClick={reset} className="w-full h-11 font-semibold relative overflow-hidden group">
                  <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  {t('error.retry')}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                <Button variant="outline" onClick={() => router.push('/')} className="w-full h-11">
                  <Home className="mr-2 h-4 w-4" />
                  {t('error.goHome')}
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground transition-colors h-9 hover:bg-accent/50"
                onClick={() => window.open('https://github.com/QuadDarv1ne/econom-trainer/issues/new', '_blank', 'noopener,noreferrer')}
              >
                <Github className="mr-2 h-4 w-4" />
                {t('error.reportBug')}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
