"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-provider";
import { useAutoSync } from "@/hooks/use-sync";
import { useOnlineStatus } from "@/hooks/use-online-status";

export const OnlineStatusIndicator = memo(function OnlineStatusIndicator() {
  const { t } = useI18n();
  const isOnline = useOnlineStatus()
  useAutoSync();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-4 sm:bottom-20 z-50"
          aria-live="polite"
          role="status"
        >
          <Badge
            variant="destructive"
            className="gap-2 px-3 py-2 text-sm font-medium shadow-lg shadow-destructive/25"
          >
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <WifiOff className="w-4 h-4" />
            </motion.span>
            {t('network.offline')}
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const NetworkStatus = memo(function NetworkStatus() {
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
});