'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n-provider';

export default function AuthErrorPage() {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-md"
    >
      <Card className="border-destructive/20 shadow-2xl shadow-destructive/5 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-3 text-center pb-4">
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-destructive to-rose-500 flex items-center justify-center shadow-lg shadow-destructive/25">
              <AlertCircle className="h-7 w-7 text-white" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.error.title')}</CardTitle>
            <CardDescription className="text-sm mt-1">{t('auth.error.subtitle')}</CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-2"
          >
            <Button asChild className="w-full h-11 font-semibold relative overflow-hidden group">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('auth.error.tryAgain')}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-11">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('auth.error.backToHome')}
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
