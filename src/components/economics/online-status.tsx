"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-provider";
import { useAutoSync } from "@/hooks/use-sync";

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);

    updateStatus();

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return isOnline
}

export function OnlineStatusIndicator() {
  const { t } = useI18n();
  const isOnline = useOnlineStatus()
  useAutoSync();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <Badge
        variant="destructive"
        className="gap-2 px-3 py-2 text-sm font-medium shadow-lg"
      >
        <WifiOff className="w-4 h-4" />
        {t('network.offline')}
      </Badge>
    </div>
  );
}

export function NetworkStatus() {
  const { t } = useI18n();
  const isOnline = useOnlineStatus()

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      <span className={`text-sm ${isOnline ? "text-green-500" : "text-red-500"}`}>
        {isOnline ? t('network.online') : t('network.offlineShort')}
      </span>
    </div>
  );
}