"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * Debounces a value by the specified delay.
 * Returns the debounced value that updates only after the delay has elapsed.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
