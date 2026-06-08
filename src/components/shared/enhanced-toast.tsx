'use client';

import type React from 'react';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const typeConfig = {
  success: { icon: CheckCircle2, bg: 'from-green-500 to-emerald-600', iconBg: 'bg-green-500' },
  error: { icon: AlertCircle, bg: 'from-red-500 to-rose-600', iconBg: 'bg-red-500' },
  info: { icon: Info, bg: 'from-blue-500 to-cyan-600', iconBg: 'bg-blue-500' },
  warning: { icon: AlertTriangle, bg: 'from-yellow-500 to-amber-600', iconBg: 'bg-yellow-500' },
};

export function EnhancedToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef(toasts);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((message: string, duration?: number) => showToast(message, 'success', duration), [showToast]);
  const error = useCallback((message: string, duration?: number) => showToast(message, 'error', duration), [showToast]);
  const info = useCallback((message: string, duration?: number) => showToast(message, 'info', duration), [showToast]);
  const warning = useCallback((message: string, duration?: number) => showToast(message, 'warning', duration), [showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toastsRef.current.length > 0) {
        dismiss(toastsRef.current[0].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const config = typeConfig[toast.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ duration: 0.3, type: 'spring' }}
                className="pointer-events-auto"
              >
                <div className="relative overflow-hidden rounded-xl shadow-2xl border border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                  <div className="flex items-start gap-3 p-4">
                    <div className={cn('h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg', config.iconBg)}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</p>
                    <button
                      onClick={() => dismiss(toast.id)}
                      className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Progress bar */}
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: (toast.duration ?? 4000) / 1000, ease: 'linear' }}
                    className={cn('h-0.5 w-full bg-gradient-to-r', config.bg)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useEnhancedToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useEnhancedToast must be used within EnhancedToastProvider');
  }
  return context;
}
