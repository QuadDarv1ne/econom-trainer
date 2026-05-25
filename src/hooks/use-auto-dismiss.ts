"use client";

import { useEffect } from "react";
import { ALERT_AUTO_DISMISS_MS } from "@/lib/constants";

/**
 * Auto-dismisses alert messages after a configurable timeout.
 * Call once for each message state that should auto-dismiss.
 */
export function useAutoDismiss(
  message: string | undefined,
  onDismiss: () => void,
  durationMs: number = ALERT_AUTO_DISMISS_MS,
) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onDismiss(), durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);
}
