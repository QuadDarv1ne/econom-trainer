'use client'

import { useState, memo, useRef, useEffect, type ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateId } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const toastIcons: Record<ToastType, ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const toastColors: Record<ToastType, string> = {
  success: 'border-green-500/50 bg-green-50 dark:bg-green-950/30 text-green-900 dark:text-green-100',
  error: 'border-red-500/50 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100',
  info: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100',
  warning: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100',
}

export function useToastNotification() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const removeToast = (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = { id, duration: 5000, ...toast }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      const timer = setTimeout(() => removeToast(id), newToast.duration)
      timersRef.current.set(id, timer)
    }

    return id
  }

  const success = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'success', title, message, duration })

  const error = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'error', title, message, duration })

  const info = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'info', title, message, duration })

  const warning = (title: string, message?: string, duration?: number) =>
    addToast({ type: 'warning', title, message, duration })

  return { toasts, success, error, info, warning, removeToast }
}

export const ToastContainer = memo(function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-[400px] pb-14 sm:pb-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'rounded-xl border-l-4 shadow-lg backdrop-blur-sm p-4 cursor-pointer',
                toastColors[toast.type]
              )}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-start gap-3">
                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{toast.title}</p>
                  {toast.message && (
                    <p className="text-xs mt-1 opacity-90 line-clamp-2">{toast.message}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeToast(toast.id)
                  }}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
})
