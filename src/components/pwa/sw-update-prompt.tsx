'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

/**
 * Shows a toast-like notification when a new service worker is available.
 * Allows user to reload the page to activate the update.
 */
export function ServiceWorkerUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = () => setUpdateAvailable(true)

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('controllerchange', handleUpdate)

    // Also listen for custom messages from SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATE_AVAILABLE') {
        setUpdateAvailable(true)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate)
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [])

  const handleReload = () => {
    window.location.reload()
  }

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 animate-in slide-in-from-bottom-4 fade-in-50 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center justify-between gap-3 max-w-sm mx-auto sm:mx-0">
        <div className="flex-1">
          <p className="text-sm font-medium">New version available</p>
          <p className="text-xs text-muted-foreground">Reload to get the latest features</p>
        </div>
        <Button size="sm" onClick={handleReload} className="shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" />
          Reload
        </Button>
      </div>
    </div>
  )
}
