"use client";

import { useEffect, useRef } from "react";
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
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onDismissRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs]);
}
