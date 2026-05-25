'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

/**
 * Button that triggers PWA install prompt when app is installable.
 * Automatically hides when app is already installed or not installable.
 */
export function InstallPWAButton() {
  const { isInstallable, isInstalled, triggerInstall } = useInstallPrompt()

  if (!isInstallable || isInstalled) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={triggerInstall}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}
