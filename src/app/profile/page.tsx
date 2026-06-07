'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { signOutAndClearStore } from '@/lib/sign-out';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthMeter } from '@/components/shared/password-strength-meter';
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
  LogOut,
  Zap,
  Trophy,
  BookOpen,
  Target,
} from 'lucide-react';
import { useEconomicsStore, getLevelFromXP } from '@/store/economics-store';
import { useI18n } from '@/lib/i18n-provider';
import { formatDate as formatLocaleDate } from '@/lib/i18n';
import { checkPasswordStrength } from '@/lib/password-strength';
import { useProfile, useProgressSync } from '@/hooks/use-profile';
import { useAutoDismiss } from '@/hooks/use-auto-dismiss';
import { RESEND_COOLDOWN_SECONDS } from '@/lib/constants';
import { AlertBanner } from '@/components/ui/alert-banner';
import { safeErrorMessage } from '@/lib/safe-error';
import { AppHeader } from '@/components/shared/app-header';
import { TwoFAManagement } from '@/components/shared/two-fa-management'
import { SafeUserInitials, SafeUserContent, SafeAvatarImage } from '@/components/shared/safe-user-content';
import { ProgressStats } from '@/components/shared/progress-stats';
import { StatsCard } from '@/components/shared/stats-card';
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
    reader.onload = async (ev) => {
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
            setProfile(data);
            update();
          }
        }
      } catch {
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
          update();
        }
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
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
              <div className="h-5 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <AppHeader title={t('profile.title')} variant="full" />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <AlertBanner type="error" message={error} onDismiss={() => setError('')} closeLabel={t('auth.error.close') || 'Close'} />
        <AlertBanner type="success" message={success} onDismiss={() => setSuccess('')} closeLabel={t('auth.error.close') || 'Close'} />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Zap}
            title={t('home.header.xpLabel')}
            value={totalXP.toLocaleString()}
            gradient="orange"
            delay={0}
          />
          <StatsCard
            icon={Trophy}
            title={t('profile.level')}
            value={getLevelFromXP(totalXP).level.toString()}
            gradient="purple"
            delay={0.1}
          />
          <StatsCard
            icon={BookOpen}
            title={t('profile.modulesCompleted')}
            value={moduleInteractionsCount}
            gradient="blue"
            delay={0.2}
          />
          <StatsCard
            icon={Target}
            title={t('profile.quizzesTaken')}
            value={quizResultsCount}
            gradient="green"
            delay={0.3}
          />
        </div>

        <Tabs defaultValue="personal" className="space-y-6" onValueChange={() => { setError(''); setSuccess(''); }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              {t('profile.personalInfo')}
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              {t('profile.accountSettings')}
            </TabsTrigger>
            <TabsTrigger value="progress">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('dashboard.tab.progress')}
            </TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            {/* Avatar Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24">
                      <SafeAvatarImage src={profile?.image ?? null} />
                      <AvatarFallback className="text-2xl"><SafeUserInitials name={profile?.name ?? null} /></AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { fileInputRef.current?.click(); } }}
                      aria-label={t('profile.changeAvatar') || 'Change avatar'}
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold"><SafeUserContent>{profile?.name || t('dashboard.progress.student')}</SafeUserContent></h3>
                    <p className="text-muted-foreground"><SafeUserContent>{profile?.email}</SafeUserContent></p>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{t('profile.role')}: {profile?.role}</Badge>
                      {profile?.emailVerified ? (
                        <Badge variant="default" className="bg-green-500">
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
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-2" />
                    {t('profile.avatar.change')}
                  </Button>
                  {profile?.image && (
                    <Button size="sm" variant="outline" onClick={removeAvatar}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('profile.avatar.remove')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); updateProfile(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('dashboard.profile.name')}</Label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('dashboard.profile.namePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('dashboard.profile.email')}</Label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span><SafeUserContent>{profile?.email}</SafeUserContent></span>
                      </div>
                      {!profile?.emailVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={sendVerificationEmail}
                          disabled={sendingVerification || resendCooldown > 0}
                        >
                          {sendingVerification ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : resendCooldown > 0 ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <Mail className="h-3 w-3" />
                          )}
                          <span className="ml-2">
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
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('dashboard.profile.phonePlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('profile.memberSince')}</Label>
                    <p className="text-muted-foreground">{formatDate(profile?.createdAt ?? null)}</p>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('dashboard.profile.save')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Change */}
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

                    {/* Password Strength Meter */}
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
                      <p className="text-xs text-red-500">{t('profile.passwordMismatch')}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={changingPassword || !allPasswordRequirementsMet}>
                    {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('profile.changePassword')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <TwoFAManagement
              twoFactorEnabled={!!profile?.twoFactorEnabled}
              onTwoFactorChange={(enabled) => {
                setProfile((p) => (p ? { ...p, twoFactorEnabled: enabled } : null));
                update();
              }}
              setError={setError}
              setSuccess={setSuccess}
            />

            {/* Session Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  {t('profile.activeSessions')}
                </CardTitle>
                <CardDescription>{t('profile.activeSessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t('profile.currentSession')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('profile.lastActive')}: {formatLocaleDate(new Date(), locale)}
                      </p>
                    </div>
                  </div>
                  <Badge>{t('profile.currentSession')}</Badge>
                </div>

                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/profile/revoke-sessions', { method: 'POST' });
                      if (res.ok) {
                        signOutAndClearStore({ callbackUrl: '/auth/login' });
                      }
                    } catch {
                      setError(t('auth.error.sessionError'));
                    }
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('profile.revokeAll')}
                </Button>
              </CardContent>
            </Card>

            {/* Delete Account */}
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
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
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
                      <Button variant="destructive" onClick={deleteAccount} disabled={deleting}>
                        {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t('profile.deleteAccount')}
                      </Button>
                      <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}>
                        {t('auth.error.tryAgain')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <ProgressStats
              totalXP={totalXP}
              userName={profile?.name ?? null}
              quizResultsCount={quizResultsCount}
              moduleInteractionsCount={moduleInteractionsCount}
              onSync={syncProgress}
              syncing={syncing}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
