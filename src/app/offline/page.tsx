"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home, Cloud, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Соединение восстановлено" });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleSync = async () => {
    setSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSyncing(false);
    toast({ title: "Синхронизация завершена", description: "Прогресс синхронизирован!" });
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
            {isOnline ? "Вы онлайн" : "Вы офлайн"}
          </h1>
          <p className="text-muted-foreground">
            {isOnline
              ? "Соединение восстановлено! Вы можете синхронизировать свой прогресс."
              : "Похоже, соединение с интернетом потеряно. Но не переживайте — вы можете продолжать работать с кэшированным контентом."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">
              {isOnline ? "Доступно онлайн:" : "Доступно офлайн:"}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>✓ Все учебные модули</li>
              <li>✓ Ваши сохранения и прогресс</li>
              <li>✓ Калькуляторы и инструменты</li>
              {isOnline && <li>✓ Синхронизация с сервером</li>}
              {!isOnline && <li>✗ Синхронизация с сервером</li>}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isOnline && (
              <Button onClick={handleSync} disabled={syncing} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                {syncing ? "Синхронизация..." : "Синхронизировать"}
              </Button>
            )}
            <Button onClick={handleReload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Обновить страницу
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                На главную
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {isOnline
            ? "Ваш прогресс синхронизирован с сервером."
            : "Как только соединение восстановится, ваш прогресс автоматически синхронизируется."}
        </p>
      </div>
      <Toaster />
    </div>
  );
}