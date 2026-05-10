"use client";

import Link from "next/link";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <WifiOff className="w-24 h-24 text-muted-foreground" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <WifiOff className="w-24 h-24 text-muted-foreground" />
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Вы офлайн</h1>
          <p className="text-muted-foreground">
            Похоже, соединение с интернетом потеряно. Но не переживайте — вы можете продолжать работать с кэшированным контентом.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">Что доступно офлайн:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>✓ Все учебные модули</li>
              <li>✓ Ваши сохранения и прогресс</li>
              <li>✓ Калькуляторы и инструменты</li>
              <li>✗ Синхронизация с сервером</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleReload} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
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
          Как только соединение восстановится, ваш прогресс автоматически синхронизируется.
        </p>
      </div>
    </div>
  );
}