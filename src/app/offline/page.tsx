"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home, CheckCircle, Wifi, Signal, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useEconomicsStore } from "@/store/economics-store";
import { useI18n } from "@/lib/i18n-provider";
import { safeErrorMessage } from "@/lib/safe-error";
import { motion } from "framer-motion";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function OfflinePage() {
  const isOnline = useOnlineStatus();
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const totalXP = useEconomicsStore((s) => s.totalXP)
  const quizResults = useEconomicsStore((s) => s.quizResults)
  const moduleInteractions = useEconomicsStore((s) => s.moduleInteractions)
  const unlockedAchievements = useEconomicsStore((s) => s.unlockedAchievements);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalXP,
          quizResults,
          moduleHistory: moduleInteractions,
          achievements: unlockedAchievements,
        }),
      });

      if (res.ok) {
        toast({ title: t('offline.syncCompleted'), description: t('offline.syncSuccess') });
      } else {
        const data = await res.json();
        toast({ title: t('offline.syncErrorTitle'), description: safeErrorMessage(data, t('offline.syncError')), variant: "destructive" });
      }
    } catch {
      toast({ title: t('offline.syncErrorTitle'), description: t('offline.syncCheckConnection'), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  }, [totalXP, quizResults, moduleInteractions, unlockedAchievements, toast, t]);

  useEffect(() => {
    const showToast = () => toast({ title: t('offline.connectionRestored') });
    window.addEventListener("online", showToast);
    return () => window.removeEventListener("online", showToast);
  }, [toast, t]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-4"
      >
        <Card className="border-primary/10 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-4">
            <motion.div
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg ${
                isOnline
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30'
              }`}>
                <motion.div
                  animate={isOnline ? {} : { rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isOnline ? (
                    <Wifi className="h-10 w-10 text-white" />
                  ) : (
                    <WifiOff className="h-10 w-10 text-white" />
                  )}
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <CardTitle className="text-2xl font-bold tracking-tight">
                {isOnline ? t('offline.youAreOnline') : t('offline.youAreOffline')}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {isOnline
                  ? t('offline.onlineDesc')
                  : t('offline.offlineDesc')}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl glass-card p-4 space-y-2"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Signal className={`h-4 w-4 ${isOnline ? 'text-green-500' : 'text-muted-foreground'}`} />
                {isOnline ? t('offline.onlineAvailable') : t('offline.offlineAvailable')}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {[
                  { label: t('offline.modules'), ok: true },
                  { label: t('offline.saves'), ok: true },
                  { label: t('offline.tools'), ok: true },
                  { label: t('offline.syncAvailable'), ok: isOnline },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center ${
                      item.ok ? 'bg-green-100 dark:bg-green-950/40' : 'bg-red-100 dark:bg-red-950/40'
                    }`}>
                      {item.ok ? (
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <WifiOff className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <span className={item.ok ? '' : 'text-muted-foreground/60'}>{item.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-2"
            >
              {isOnline && (
                <Button onClick={handleSync} disabled={syncing} className="flex-1 gap-2 relative overflow-hidden group">
                  {syncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  )}
                  {syncing ? t('offline.syncing') : t('offline.syncBtn')}
                </Button>
              )}
              <Button onClick={handleReload} variant="secondary" className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                {t('offline.reload')}
              </Button>
              <Button variant="outline" asChild className="flex-1 gap-2">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  {t('offline.backToHome')}
                </Link>
              </Button>
            </motion.div>

            {!isOnline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-center text-muted-foreground"
              >
                {t('offline.autoSyncFooter')}
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>
      <Toaster />
    </div>
  );
}
