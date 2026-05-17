"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home, Cloud, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useEconomicsStore } from "@/store/economics-store";
import { useI18n } from "@/lib/i18n-provider";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const storeState = useEconomicsStore((s) => ({
    totalXP: s.totalXP,
    quizResults: s.quizResults,
    moduleInteractions: s.moduleInteractions,
    unlockedAchievements: s.unlockedAchievements,
  }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalXP: storeState.totalXP,
          quizResults: storeState.quizResults,
          moduleHistory: storeState.moduleInteractions,
          achievements: storeState.unlockedAchievements,
        }),
      });

      if (res.ok) {
        toast({ title: t('offline.syncCompleted'), description: t('offline.syncSuccess') });
      } else {
        const data = await res.json();
        toast({ title: t('offline.syncErrorTitle'), description: data.error || t('offline.syncError'), variant: "destructive" });
      }
    } catch {
      toast({ title: t('offline.syncErrorTitle'), description: t('offline.syncCheckConnection'), variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);

    updateStatus();

    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: t('offline.connectionRestored') });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast, t]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            {isOnline ? (
              <Cloud className="w-24 h-24 text-green-500" />
            ) : (
              <>
                <WifiOff className="w-24 h-24 text-muted-foreground" />
                <div className="absolute inset-0 animate-ping opacity-20">
                  <WifiOff className="w-24 h-24 text-muted-foreground" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {isOnline ? t('offline.youAreOnline') : t('offline.youAreOffline')}
          </h1>
          <p className="text-muted-foreground">
            {isOnline
              ? t('offline.onlineDesc')
              : t('offline.offlineDesc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">
              {isOnline ? t('offline.onlineAvailable') : t('offline.offlineAvailable')}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>✓ {t('offline.modules')}</li>
              <li>✓ {t('offline.saves')}</li>
              <li>✓ {t('offline.tools')}</li>
              {isOnline && <li>✓ {t('offline.syncAvailable')}</li>}
              {!isOnline && <li>✗ {t('offline.syncUnavailable')}</li>}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isOnline && (
              <Button onClick={handleSync} disabled={syncing} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {syncing ? t('offline.syncing') : t('offline.syncBtn')}
              </Button>
            )}
            <Button onClick={handleReload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t('offline.reload')}
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                {t('offline.backToHome')}
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {isOnline
            ? t('offline.syncSuccessFooter')
            : t('offline.autoSyncFooter')}
        </p>
      </div>
      <Toaster />
    </div>
  );
}
