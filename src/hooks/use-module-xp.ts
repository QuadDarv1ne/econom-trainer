'use client'

import { useCallback } from 'react'
import { useEconomicsStore, MODULE_XP, ModuleId } from '@/store/economics-store'

/**
 * Shared hook for awarding XP on first module interaction per session.
 * Uses sessionStorage to persist XP award state across unmount/remount cycles,
 * preventing XP farming by remounting the component.
 */
export function useModuleXP(moduleId: ModuleId, action = 'interact') {
  const key = `xp_earned_${moduleId}`
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

  return useCallback(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return

    addModuleInteraction({ moduleId, action, xpEarned: MODULE_XP[moduleId] })

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, '1')
    }
  }, [addModuleInteraction, moduleId, action, key])
}
