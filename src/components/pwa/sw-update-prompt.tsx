'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RefreshCw, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n-provider'

export function ServiceWorkerUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = () => setUpdateAvailable(true)

    navigator.serviceWorker.addEventListener('controllerchange', handleUpdate)

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

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50"
        >
          <div className="glass-card rounded-xl p-4 flex items-center justify-between gap-3 max-w-sm mx-auto sm:mx-0 shadow-xl shadow-primary/5">
            <div className="flex-1 flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shrink-0 shadow-md"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <div>
                <p className="text-sm font-medium">{t('pwa.updateAvailable') || 'New version available'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('pwa.updateMessage') || 'Reload to get the latest features'}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleReload}
              className="shrink-0 h-9 relative overflow-hidden group"
            >
              <RefreshCw className="h-4 w-4 mr-1 group-hover:rotate-180 transition-transform duration-500" />
              {t('pwa.updateReload') || 'Reload'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
