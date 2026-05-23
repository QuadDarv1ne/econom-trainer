'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

interface AlertBannerProps {
  type: 'error' | 'success'
  message: string
  onDismiss: () => void
  closeLabel?: string
}

export function AlertBanner({ type, message, onDismiss, closeLabel = 'Close' }: AlertBannerProps) {
  if (!message) return null

  return (
    <Alert
      variant={type === 'error' ? 'destructive' : 'default'}
      className={
        type === 'success'
          ? 'mb-4 border-green-500 bg-green-50 dark:bg-green-950/20'
          : 'mb-4'
      }
    >
      {type === 'error' ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      <AlertDescription
        className={
          type === 'success'
            ? 'flex items-center justify-between gap-2 text-green-700 dark:text-green-400'
            : 'flex items-center justify-between gap-2'
        }
      >
        <span>{message}</span>
        <button onClick={onDismiss} className="shrink-0" aria-label={closeLabel}>
          <X className="h-4 w-4" />
        </button>
      </AlertDescription>
    </Alert>
  )
}
