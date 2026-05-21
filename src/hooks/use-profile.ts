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

interface UseProfileReturn {
  status: 'authenticated' | 'loading' | 'unauthenticated';
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string;
  success: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setSuccess: React.Dispatch<React.SetStateAction<string>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updateName?: string, updatePhone?: string) => Promise<void>;
  update: () => Promise<void>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
}

interface UseProgressSyncReturn {
  syncing: boolean;
  syncError: string;
  syncSuccess: string;
  setSyncError: React.Dispatch<React.SetStateAction<string>>;
  setSyncSuccess: React.Dispatch<React.SetStateAction<string>>;
  syncProgress: () => Promise<void>;
}

/**
 * Shared hook for profile management: auth guard, fetch, update.
 * Used by both dashboard and profile pages.
 */
export function useProfile(): UseProfileReturn {
  const { data: _session, status, update } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
      } else {
        setError(t('dashboard.profile.fetchError'));
      }
    } catch (e) {
      console.error(e);
      setError(t('dashboard.profile.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  const updateProfile = useCallback(async (updateName?: string, updatePhone?: string) => {
    setSaving(true);
    setError('');
    setSuccess('');

    const bodyName = updateName !== undefined ? updateName : name;
    const bodyPhone = updatePhone !== undefined ? updatePhone : phone;

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: bodyName, phone: bodyPhone }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
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
  }, [t, update, name, phone]);

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
  };
}

/**
 * Shared hook for syncing local zustand progress to server.
 */
export function useProgressSync(): UseProgressSyncReturn {
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
      const { level } = store.getXPState();
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
      });

      if (res.ok) {
        const serverData = await res.json();
        // Update local store with server's merged values
        if (serverData.totalXP !== undefined) {
          useEconomicsStore.setState({ totalXP: serverData.totalXP });
        }
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
