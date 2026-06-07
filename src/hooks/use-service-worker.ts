'use client'

import { useEffect, useRef } from 'react'
import { logError } from '@/lib/log-error'

/**
 * Hook that registers the service worker for PWA/offline support.
 * Only runs in browser environment and checks for SW support.
 */
export function useServiceWorker() {
  const registeredRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    // Skip if already registered or no SW support
    if (registeredRef.current || !('serviceWorker' in navigator)) {
      return
    }

    // Wait for page load to not block initial render
    const registerSW = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(() => {
          if (!cancelled) {
            registeredRef.current = true
          }
        })
        .catch((error) => {
          if (!cancelled) {
            logError('service-worker', error)
            registeredRef.current = false
          }
        })
    }

    // Register after initial load to not block first paint
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => {
        cancelled = true
        window.removeEventListener('load', registerSW)
      }
    }

    return () => {
      cancelled = true
    }
  }, [])
}
