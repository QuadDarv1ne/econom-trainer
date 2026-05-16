import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEconomicsStore } from '@/store/economics-store';
import { useI18n } from '@/lib/i18n-provider';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  role: string;
  twoFactorEnabled: boolean;
  emailVerified: Date | null;
  createdAt: Date;
}

/**
 * Shared hook for profile management: auth guard, fetch, update.
 * Used by both dashboard and profile pages.
 */
export function useProfile() {
  const { data: _session, status, update } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError(t('dashboard.profile.saveError'));
      }
    } catch (e) {
      console.error(e);
      setError(t('dashboard.profile.saveError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const updateProfile = useCallback(async (name: string, phone: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccess(t('dashboard.profile.updated'));
        await update();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError(t('dashboard.profile.saveError'));
    } finally {
      setSaving(false);
    }
  }, [t, update]);

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
  };
}

/**
 * Shared hook for syncing local zustand progress to server.
 */
export function useProgressSync() {
  const { t } = useI18n();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  const syncProgress = useCallback(async () => {
    setSyncing(true);
    setSyncError('');
    setSyncSuccess('');
    try {
      const store = useEconomicsStore.getState();
      const res = await fetch('/api/progress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalXP: store.totalXP,
          quizResults: store.quizResults,
          moduleHistory: store.moduleInteractions,
          achievements: store.unlockedAchievements,
        }),
      });

      if (res.ok) {
        setSyncSuccess(t('dashboard.progress.synced'));
      }
    } catch {
      setSyncError(t('dashboard.progress.syncError'));
    } finally {
      setSyncing(false);
    }
  }, [t]);

  return { syncing, syncError, syncSuccess, setSyncError, setSyncSuccess, syncProgress };
}
