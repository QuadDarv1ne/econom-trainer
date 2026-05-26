'use client'

import { useRef, useCallback } from 'react'
import { useEconomicsStore, MODULE_XP, ModuleId } from '@/store/economics-store'

/**
 * Shared hook for awarding XP on first module interaction per session.
 * Uses useRef to ensure XP is awarded only once, even if the callback
 * is invoked multiple times (e.g., on every slider change).
 */
export function useModuleXP(moduleId: ModuleId, action = 'interact') {
  const hasEarnedRef = useRef(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  return useCallback(() => {
    if (!hasEarnedRef.current) {
      hasEarnedRef.current = true
      addModuleInteraction({ moduleId, action, xpEarned: MODULE_XP[moduleId] })
    }
  }, [addModuleInteraction, moduleId, action])
}
