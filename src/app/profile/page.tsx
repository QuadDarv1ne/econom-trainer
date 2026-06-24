'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { signOutAndClearStore } from '@/lib/sign-out'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthMeter } from '@/components/shared/password-strength-meter'
import dynamic from 'next/dynamic'
const BackgroundParticles = dynamic(() => import('@/components/shared/animated-helpers').then(m => ({ default: m.BackgroundParticles })), { ssr: false })
import { Skeleton, StatsCardSkeleton } from '@/components/shared/loading-skeleton'
import {
  User,
  Mail,
  Phone,
  Shield,
  Check,
  Loader2,
  BarChart3,
  Camera,
  Trash2,
  KeyRound,
  Clock,
  Monitor,
  AlertTriangle,
  AlertCircle,
  LogOut,
  Zap,
  Trophy,
  BookOpen,
  Target,
} from 'lucide-react';
import { useEconomicsStore, getLevelFromXP, getLevelTitle } from '@/store/economics-store';
import { useI18n } from '@/lib/i18n-provider';
import { formatDate as formatLocaleDate } from '@/lib/i18n';
import { checkPasswordStrength } from '@/lib/password-strength';
import { useProfile, useProgressSync } from '@/hooks/use-profile';
import { useAutoDismiss } from '@/hooks/use-auto-dismiss';
import { RESEND_COOLDOWN_SECONDS } from '@/lib/constants';
import { AlertBanner } from '@/components/ui/alert-banner';
import { safeErrorMessage } from '@/lib/safe-error';
import { AppHeader } from '@/components/shared/app-header';
const TwoFAManagement = dynamic(() => import('@/components/shared/two-fa-management').then(m => ({ default: m.TwoFAManagement })), { ssr: false })
import { SafeUserInitials, SafeUserContent, SafeAvatarImage } from '@/components/shared/safe-user-content';
import { ProgressStats } from '@/components/shared/progress-stats';
import { useEnhancedToast } from '@/components/shared/enhanced-toast';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { success: showToastSuccess, error: showToastError } = useEnhancedToast();
  const {
    status,
    profile,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    setProfile,
    update,
    name,
    setName,
    phone,
    setPhone,
    updateProfile,
  } = useProfile();
  const { syncing, syncProgress } = useProgressSync();

  // Profile edit
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false }, []);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Email verification
  const [sendingVerification, setSendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Local progress display
  const totalXP = useEconomicsStore((s) => s.totalXP);
  const quizResultsCount = useEconomicsStore((s) => s.quizResults.length);
  const moduleInteractionsCount = useEconomicsStore((s) => s.moduleInteractions.length);

  // Password strength
  const passwordStrength = useMemo(() => checkPasswordStrength(newPassword), [newPassword]);
  const allPasswordRequirementsMet = Object.values(passwordStrength.requirements).every(Boolean);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-dismiss alerts
  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  // Show toast notifications
  useEffect(() => {
    if (success) {
      showToastSuccess(success);
    }
  }, [success, showToastSuccess]);

  useEffect(() => {
    if (error) {
      showToastError(error);
    }
  }, [error, showToastError]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (!file.type.startsWith('image/')) {
      setError(t('auth.error.avatarSelect'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('auth.error.avatarSize'));
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onerror = () => {
      if (!mountedRef.current) return;
      setError(t('auth.error.avatarUploadError'));
    };
    reader.onload = async (ev) => {
      if (!mountedRef.current) return;
      const imageData = ev.target?.result;
      if (!imageData || typeof imageData !== 'string') {
        setError(t('auth.error.avatarUploadError'));
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && 'id' in data) {
            if (!mountedRef.current) return;
            setProfile(data);
            await update();
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        } else {
          const data = await res.json().catch(() => null);
          if (!mountedRef.current) return;
          setError(safeErrorMessage(data, t('auth.error.avatarUploadError')));
        }
      } catch {
        if (!mountedRef.current) return;
        setError(t('auth.error.avatarUploadError'));
      }
    };
    reader.readAsDataURL(file);
  }

  async function removeAvatar() {
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: '' }),
      });

      if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && 'id' in data) {
            setProfile(data);
            await update();
          }
        } else {
          const data = await res.json().catch(() => null);
          setError(safeErrorMessage(data, t('auth.error.avatarRemoveError')));
        }
      } catch {
        setError(t('auth.error.avatarRemoveError'));
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('auth.error.minPasswordLength'));
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(t('profile.passwordUpdated'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        // Sign out since all sessions are invalidated by password change
        signOutAndClearStore({ callbackUrl: '/auth/login' });
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')));
      }
    } catch {
      setError(t('auth.error.serverError'));
    } finally {
      setChangingPassword(false);
    }
  }

  async function sendVerificationEmail() {
    setSendingVerification(true);
    setError('');

    try {
      const res = await fetch('/api/profile/verify-email', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setSuccess(t('profile.verificationSent'));
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')));
      }
    } catch {
      setError(t('auth.error.verificationSendError'));
    } finally {
      setSendingVerification(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await res.json();

      if (res.ok) {
        signOutAndClearStore({ callbackUrl: '/' });
      } else {
        setError(safeErrorMessage(data, t('auth.error.serverError')));
      }
    } catch {
      setError(t('auth.error.accountDeleteError'));
    } finally {
      setDeleting(false);
    }
  }


  function formatDate(date: Date | null) {
    if (!date) return '';
    return formatLocaleDate(date, locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <header className="sticky top-0 z-50 border-b glass">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="rounded" className="h-9 w-9" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" delay={0.1} />
              <Skeleton variant="rounded" className="h-48 w-full" delay={0.2} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative">
      <BackgroundParticles count={20} className="opacity-20" />
      <AppHeader title={t('profile.title')} variant="full" />

      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertBanner type="error" message={error} onDismiss={() => setError('')} closeLabel={t('auth.error.close') || 'Close'} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertBanner type="success" message={success} onDismiss={() => setSuccess('')} closeLabel={t('auth.error.close') || 'Close'} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border border-primary/20 shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground group-hover:text-primary/80 transition-colors duration-300">{t('home.header.xpLabel')}</p>
                <motion.p
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  className="text-3xl font-bold tabular-nums"
                >
                  {totalXP.toLocaleString()}
                </motion.p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-shadow duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (getLevelFromXP(totalXP).xpInCurrentLevel / getLevelFromXP(totalXP).xpToNextLevel) * 100)}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {getLevelFromXP(totalXP).xpInCurrentLevel} / {getLevelFromXP(totalXP).xpToNextLevel} XP
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/5 border border-purple-500/20 shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground group-hover:text-purple-500/80 transition-colors duration-300">{t('profile.level')}</p>
                <p className="text-3xl font-bold">{getLevelFromXP(totalXP).level}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-shadow duration-300">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-purple-500 mt-2">
              {getLevelTitle(getLevelFromXP(totalXP).level)}
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-blue-500/5 border border-blue-500/20 shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground group-hover:text-blue-500/80 transition-colors duration-300">{t('profile.modulesCompleted')}</p>
                <p className="text-3xl font-bold">{moduleInteractionsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-shadow duration-300">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-green-500/5 border border-green-500/20 shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground group-hover:text-green-500/80 transition-colors duration-300">{t('profile.quizzesTaken')}</p>
                <p className="text-3xl font-bold">{quizResultsCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-500/30 transition-shadow duration-300">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          <Tabs defaultValue="personal" className="space-y-6" onValueChange={() => { setError(''); setSuccess(''); }}>
          <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
            <TabsTrigger value="personal" className="text-xs sm:text-sm tap-target-sm">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('profile.personalInfo')}</span>
              <span className="sm:hidden">{t('profile.personalInfo').split(' ')[0]}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm tap-target-sm">
              <Shield className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('profile.accountSettings')}</span>
              <span className="sm:hidden">{t('profile.accountSettings').split(' ')[0]}</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm tap-target-sm">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('dashboard.tab.progress')}</span>
              <span className="sm:hidden">{t('dashboard.tab.progress').split(' ')[0]}</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
          <TabsContent value="personal" className="space-y-6">
            <motion.div
              key="personal-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group shrink-0">
                    <Avatar className="h-24 w-24 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
                      <SafeAvatarImage src={profile?.image ?? null} />
                      <AvatarFallback className="text-2xl"><SafeUserInitials name={profile?.name ?? null} /></AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { fileInputRef.current?.click(); } }}
                      aria-label={t('profile.changeAvatar') || 'Change avatar'}
                    >
                      <Camera className="h-6 w-6 text-white drop-shadow-sm" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h3 className="text-xl font-semibold truncate"><SafeUserContent>{profile?.name || t('dashboard.progress.student')}</SafeUserContent></h3>
                    <p className="text-muted-foreground truncate"><SafeUserContent>{profile?.email}</SafeUserContent></p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="capitalize">{t('profile.role')}: {profile?.role}</Badge>
                      {profile?.emailVerified ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          {t('dashboard.profile.emailVerified')}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">{t('profile.emailUnverified')}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="interactive-scale">
                    <Camera className="h-4 w-4 mr-2" />
                    {t('profile.avatar.change')}
                  </Button>
                  {profile?.image && (
                    <Button size="sm" variant="outline" onClick={removeAvatar} className="interactive-scale">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('profile.avatar.remove')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('dashboard.profile.name')}</Label>
                    <div className="relative group/input">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('dashboard.profile.namePlaceholder')}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.profile.email')}</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate"><SafeUserContent>{profile?.email}</SafeUserContent></span>
                      </div>
                      {!profile?.emailVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={sendVerificationEmail}
                          disabled={sendingVerification || resendCooldown > 0}
                          className="shrink-0"
                        >
                          {sendingVerification ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : resendCooldown > 0 ? (
                            <Clock className="h-3 w-3 mr-1" />
                          ) : (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          <span>
                            {resendCooldown > 0
                              ? `${resendCooldown}${t('quiz.secondsSuffix')}`
                              : t('profile.verifyEmail')}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('dashboard.profile.phone')}</Label>
                    <div className="relative group/input">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within/input:text-primary" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('dashboard.profile.phonePlaceholder')}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('profile.memberSince')}</Label>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-primary/40" />
                      {formatDate(profile?.createdAt ?? null)}
                    </p>
                  </div>

                  <Button type="submit" disabled={saving} className="interactive-scale">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('dashboard.profile.save')}
                  </Button>
                </form>
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <motion.div
              key="security-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  {t('profile.changePassword')}
                </CardTitle>
                <CardDescription>{t('profile.accountSettingsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                    <PasswordInput
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                    <PasswordInput
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    {newPassword && (
                      <div className="space-y-2 pt-2">
                        <PasswordStrengthMeter password={newPassword} t={t} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">{t('profile.confirmNewPassword')}</Label>
                    <PasswordInput
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="h-3 w-3" />
                        {t('profile.passwordMismatch')}
                      </motion.p>
                    )}
                  </div>
                  <Button type="submit" disabled={changingPassword || !allPasswordRequirementsMet} className="interactive-scale">
                    {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('profile.changePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <TwoFAManagement
              twoFactorEnabled={!!profile?.twoFactorEnabled}
              onTwoFactorChange={async (enabled) => {
                setProfile((p) => (p ? { ...p, twoFactorEnabled: enabled } : null));
                await update();
              }}
              setError={setError}
              setSuccess={setSuccess}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  {t('profile.activeSessions')}
                </CardTitle>
                <CardDescription>{t('profile.activeSessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{t('profile.currentSession')}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t('profile.lastActive')}: {formatLocaleDate(new Date(), locale)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 ml-2">{t('profile.currentSession')}</Badge>
                </div>

                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/profile/revoke-sessions', { method: 'POST' });
                      if (res.ok) {
                        signOutAndClearStore({ callbackUrl: '/auth/login' });
                      } else {
                        setError(t('auth.error.sessionError'));
                      }
                    } catch {
                      setError(t('auth.error.sessionError'));
                    }
                  }}
                  className="interactive-scale"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('profile.revokeAll')}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {t('profile.deleteAccount')}
                </CardTitle>
                <CardDescription>{t('profile.deleteAccountDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {!showDeleteConfirm ? (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="interactive-scale">
                    {t('profile.deleteAccount')}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{t('profile.deleteWarning')}</AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="deletePassword">{t('profile.deleteConfirm')}</Label>
                      <PasswordInput
                        id="deletePassword"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button variant="destructive" onClick={deleteAccount} disabled={deleting} className="interactive-scale">
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('profile.deleteAccount')}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} className="interactive-scale">
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <motion.div
              key="progress-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <ProgressStats
                totalXP={totalXP}
                userName={profile?.name ?? null}
                quizResultsCount={quizResultsCount}
                moduleInteractionsCount={moduleInteractionsCount}
                onSync={syncProgress}
                syncing={syncing}
              />
            </motion.div>
          </TabsContent>
          </AnimatePresence>
        </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
