import type { Session } from 'next-auth'
import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEconomicsStore } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { logError } from '@/lib/log-error'
import { safeErrorMessage } from '@/lib/safe-error'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  image: string | null
  role: string
  twoFactorEnabled: boolean
  emailVerified: Date | null
  createdAt: Date
}

interface UseProfileReturn {
  status: 'authenticated' | 'loading' | 'unauthenticated'
  profile: UserProfile | null
  loading: boolean
  saving: boolean
  error: string
  success: string
  setError: React.Dispatch<React.SetStateAction<string>>
  setSuccess: React.Dispatch<React.SetStateAction<string>>
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>
  fetchProfile: () => Promise<void>
  updateProfile: (updateName?: string, updatePhone?: string) => Promise<void>
  update: () => Promise<Session | null>
  name: string
  setName: React.Dispatch<React.SetStateAction<string>>
  phone: string
  setPhone: React.Dispatch<React.SetStateAction<string>>
}

interface UseProgressSyncReturn {
  syncing: boolean
  syncError: string
  syncSuccess: string
  setSyncError: React.Dispatch<React.SetStateAction<string>>
  setSyncSuccess: React.Dispatch<React.SetStateAction<string>>
  syncProgress: () => Promise<void>
}

/**
 * Shared hook for profile management: auth guard, fetch, update.
 * Used by both dashboard and profile pages.
 */
export function useProfile(): UseProfileReturn {
  const { data: _session, status, update } = useSession()
  const { t } = useI18n()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setName(data.name || '')
        setPhone(data.phone || '')
      } else {
        const data = await res.json().catch((e) => {
          logError('fetch-profile-json', e)
          return null
        })
        setError(safeErrorMessage(data, tRef.current('dashboard.profile.fetchError')))
      }
    } catch (e) {
      logError('fetch-profile', e)
      setError(tRef.current('dashboard.profile.fetchError'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      queueMicrotask(async () => {
        try {
          const res = await fetch('/api/profile')
          if (cancelled) return
          if (res.ok) {
            const data = await res.json()
            setProfile(data)
            setName(data.name || '')
            setPhone(data.phone || '')
          } else {
            const data = await res.json().catch((e) => {
              logError('fetch-profile-json', e)
              return null
            })
            setError(safeErrorMessage(data, tRef.current('dashboard.profile.fetchError')))
          }
        } catch (e) {
          if (!cancelled) {
            logError('fetch-profile', e)
            setError(tRef.current('dashboard.profile.fetchError'))
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })
    }
    return () => { cancelled = true }
  }, [status, router])

  const updateProfile = useCallback(
    async (updateName?: string, updatePhone?: string) => {
      setSaving(true)
      setError('')
      setSuccess('')

      const bodyName = updateName !== undefined ? updateName : name
      const bodyPhone = updatePhone !== undefined ? updatePhone : phone

      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: bodyName, phone: bodyPhone }),
        })

        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          setName(data.name || '')
          setPhone(data.phone || '')
          setSuccess(t('dashboard.profile.updated'))
          await update()
        } else {
          const data = await res.json()
          setError(safeErrorMessage(data, t('dashboard.profile.saveError')))
        }
      } catch {
        setError(t('dashboard.profile.saveError'))
      } finally {
        setSaving(false)
      }
    },
    [t, update, name, phone]
  )

  return {
    status,
    profile,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    setProfile,
    fetchProfile,
    updateProfile,
    update,
    name,
    setName,
    phone,
    setPhone,
  }
}

/**
 * Shared hook for syncing local zustand progress to server.
 * Automatically syncs on:
 * - Mount (if authenticated and has local progress)
 * - Browser 'online' event with debounce
 * - Periodic background sync every 5 minutes
 * - Manual trigger via syncProgress()
 */
export function useProgressSync(): UseProgressSyncReturn {
  const { t } = useI18n()
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [syncSuccess, setSyncSuccess] = useState('')
  const lastSyncedAtRef = useRef(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncingRef = useRef(syncing)
  useEffect(() => { syncingRef.current = syncing }, [syncing])

  const doSync = useCallback(async () => {
    setSyncing(true)
    setSyncError('')
    setSyncSuccess('')
    try {
      const store = useEconomicsStore.getState()
      const { level } = store.getXPState()
      const res = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalXP: store.totalXP,
          level,
          quizResults: store.quizResults,
          moduleHistory: store.moduleInteractions,
          achievements: store.unlockedAchievements,
        }),
      })

      if (res.ok) {
        const serverData = await res.json()
        // Update local store with server's merged values
        if (serverData.totalXP !== undefined) {
          useEconomicsStore.setState({ totalXP: serverData.totalXP })
        }
        lastSyncedAtRef.current = Date.now()
        setSyncSuccess(t('dashboard.progress.synced'))
      } else {
        setSyncError(t('dashboard.progress.syncError'))
      }
    } catch {
      setSyncError(t('dashboard.progress.syncError'))
    } finally {
      setSyncing(false)
    }
  }, [t])

  // Debounced sync to prevent rapid-fire requests
  const scheduleSync = useCallback(() => {
    const now = Date.now()
    if (now - lastSyncedAtRef.current < 30_000) return // skip if synced within 30s
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      doSync()
      debounceTimerRef.current = null
    }, 2000)
  }, [doSync])

  // Auto-sync on online event and periodic background sync
  useEffect(() => {
    // Initial sync after a short delay (let store hydrate from localStorage)
    const initialTimer = setTimeout(() => {
      const store = useEconomicsStore.getState()
      const hasProgress =
        store.totalXP > 0 ||
        store.quizResults.length > 0 ||
        store.moduleInteractions.length > 0
      if (hasProgress) {
        doSync()
      }
    }, 3000)

    // Sync on reconnect
    window.addEventListener('online', scheduleSync)

    // Periodic background sync every 5 minutes
    const periodicTimer = setInterval(() => {
      const hasProgress = useEconomicsStore.getState().totalXP > 0
      if (hasProgress && !syncingRef.current) {
        scheduleSync()
      }
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(periodicTimer)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      window.removeEventListener('online', scheduleSync)
    }
  }, [doSync, scheduleSync])

  // Expose manual sync for explicit user action
  const syncProgress = useCallback(() => {
    lastSyncedAtRef.current = 0 // bypass debounce
    return doSync()
  }, [doSync])

  return { syncing, syncError, syncSuccess, setSyncError, setSyncSuccess, syncProgress }
}
