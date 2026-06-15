'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useI18n } from '@/lib/i18n-provider'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Button that triggers PWA install prompt when app is installable.
 * Automatically hides when app is already installed or not installable.
 */
export function InstallPWAButton() {
  const { isInstallable, isInstalled, triggerInstall } = useInstallPrompt()
  const { t } = useI18n()

  return (
    <AnimatePresence>
      {isInstallable && !isInstalled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-20 right-4 z-40 sm:bottom-24"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={triggerInstall}
            className="gap-2 relative overflow-hidden group shadow-lg hover:shadow-xl bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Download className="h-4 w-4" />
            </motion.span>
            <span className="hidden sm:inline">{t('pwa.installApp')}</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
