'use client';

import type React from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordInput } from '@/components/ui/password-input';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Shield,
  QrCode,
  Copy,
  Check,
  Loader2,
  LogOut,
  Home,
  BarChart3,
  Zap,
  AlertCircle,
  CheckCircle2,
  Camera,
  Trash2,
  KeyRound,
  Clock,
  Monitor,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useEconomicsStore } from '@/store/economics-store';
import { useI18n } from '@/lib/i18n-provider';
import { formatDate as formatLocaleDate } from '@/lib/i18n';
import { checkPasswordStrength } from '@/lib/password-strength';
import { useProfile, useProgressSync } from '@/hooks/use-profile';

export default function ProfilePage() {
  const { t, locale } = useI18n();
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

  // 2FA
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [settingUp2FA, setSettingUp2FA] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

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
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success, setSuccess]);

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
      if (!imageData) {
        setError(t('auth.error.avatarUploadError'));
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageData as string }),
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          update();
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
        setProfile(data);
        update();
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
        signOut({ callbackUrl: '/auth/login' });
      } else {
        setError(data.error);
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
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        setError(data.error);
      }
    } catch {
      setError(t('auth.error.verificationSendError'));
    } finally {
      setSendingVerification(false);
    }
  }

  async function setup2FA() {
    setSettingUp2FA(true);
    setError('');

    try {
      const res = await fetch('/api/auth/two-factor/setup', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowQR(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError(t('auth.error.2faSetupError'));
    } finally {
      setSettingUp2FA(false);
    }
  }

  async function verify2FA() {
    setVerifying2FA(true);
    setError('');

    try {
      const res = await fetch('/api/auth/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        setShowQR(false);
        setProfile((p) => (p ? { ...p, twoFactorEnabled: true } : null));
        update();
      } else {
        setError(data.error);
      }
    } catch {
      setError(t('auth.error.2faVerifyError'));
    } finally {
      setVerifying2FA(false);
    }
  }

  async function disable2FA() {
    setDisabling2FA(true);
    setError('');
    try {
      const res = await fetch('/api/auth/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((p) => (p ? { ...p, twoFactorEnabled: false } : null));
        setQrCode('');
        setSecret('');
        setBackupCodes([]);
        setDisablePassword('');
        setSuccess(t('dashboard.security.disable'));
        update();
      } else {
        setError(data.error);
      }
    } catch {
      setError(t('auth.error.2faDisableError'));
    } finally {
      setDisabling2FA(false);
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
        signOut({ callbackUrl: '/' });
      } else {
        setError(data.error);
      }
    } catch {
      setError(t('auth.error.accountDeleteError'));
    } finally {
      setDeleting(false);
    }
  }

  function getInitials(name: string | null) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-lg font-bold">{t('profile.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                {t('dashboard.home')}
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                {t('dashboard.title')}
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('dashboard.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{error}</span>
              <button onClick={() => setError('')} className="shrink-0" aria-label={t('auth.error.close') || 'Close'}>
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="flex items-center justify-between gap-2 text-green-700 dark:text-green-400">
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="shrink-0" aria-label={t('auth.error.close') || 'Close'}>
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="space-y-6" onValueChange={() => { setError(''); setSuccess(''); }}>
          <TabsList>
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
                      {profile?.image ? <AvatarImage src={profile.image} /> : null}
                      <AvatarFallback className="text-2xl">{getInitials(profile?.name ?? null)}</AvatarFallback>
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
                    <h3 className="text-xl font-semibold">{profile?.name || t('dashboard.progress.student')}</h3>
                    <p className="text-muted-foreground">{profile?.email}</p>
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
                        <span>{profile?.email}</span>
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

            {/* 2FA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('dashboard.security.title')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.security.desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {t('dashboard.security.enabled')}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="disable-2fa-password">{t('profile.password')}</Label>
                      <PasswordInput
                        id="disable-2fa-password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder={t('auth.login.password')}
                      />
                    </div>

                    <Button variant="destructive" onClick={disable2FA} disabled={disabling2FA || !disablePassword}>
                      {disabling2FA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.login.loading')}</> : t('dashboard.security.disable')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('dashboard.security.warning')}
                      </AlertDescription>
                    </Alert>

                    {!showQR && (
                      <Button onClick={setup2FA} disabled={settingUp2FA}>
                        {settingUp2FA ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="mr-2 h-4 w-4" />
                        )}
                        {t('dashboard.security.setup')}
                      </Button>
                    )}

                    {showQR && (
                      <div className="space-y-4 pt-4">
                        <Separator />
                        <div className="text-center space-y-2">
                          <h4 className="font-semibold">{t('dashboard.security.scanQr')}</h4>
                          <div className="inline-block p-4 bg-white rounded-lg">
                            <img src={qrCode} alt={t('dashboard.security.qrCodeAlt') || 'QR Code'} className="w-48 h-48" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">{t('dashboard.security.manualEntry')}</h4>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-3 py-2 rounded text-sm font-mono">{secret}</code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(secret);
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 2000);
                              }}
                            >
                              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">{t('dashboard.security.enterCode')}</h4>
                          <div className="flex flex-col gap-2">
                            <InputOTP
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={setTwoFactorCode}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                              </InputOTPGroup>
                              <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                              </InputOTPGroup>
                            </InputOTP>
                            <Button onClick={verify2FA} disabled={verifying2FA} className="self-start">
                              {verifying2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dashboard.security.verify')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {showBackupCodes && (
                      <div className="space-y-4 pt-4">
                        <Separator />
                        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <AlertDescription className="text-amber-700 dark:text-amber-400">
                            <strong>{t('dashboard.security.saveCodes')}</strong>
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-2">
                          {backupCodes.map((code, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-muted px-3 py-2 rounded"
                            >
                              <code className="font-mono text-sm">{code}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(code);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Button onClick={() => setShowBackupCodes(false)}>
                          {t('dashboard.security.savedCodes')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
                        signOut({ callbackUrl: '/auth/login' });
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t('dashboard.progress.title')}
                </CardTitle>
                <CardDescription>{t('dashboard.progress.desc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold">{totalXP}</div>
                      <div className="text-sm text-muted-foreground">{t('dashboard.progress.totalXP')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <User className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold">{profile?.name || t('dashboard.progress.student')}</div>
                      <div className="text-sm text-muted-foreground">{t('dashboard.progress.account')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold">{quizResultsCount}</div>
                      <div className="text-sm text-muted-foreground">{t('dashboard.progress.quizzes')}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold">{moduleInteractionsCount}</div>
                      <div className="text-sm text-muted-foreground">{t('dashboard.progress.sessions')}</div>
                    </CardContent>
                  </Card>
                </div>

                <Button onClick={syncProgress} disabled={syncing} className="w-full">
                  {syncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {t('dashboard.progress.sync')}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  {t('dashboard.progress.note')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function PasswordStrengthMeter({ password, t }: { password: string; t: (key: string) => string }) {
  const strength = checkPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{t('passwordStrength.label')}</span>
        <span className="text-xs font-medium">{t(strength.label)}</span>
      </div>
      <Progress
        value={(strength.score / 4) * 100}
        className={`h-1 ${strength.color}`}
      />

      <div className="grid grid-cols-2 gap-1 pt-1">
        {[
          { key: 'passwordStrength.minLength', met: strength.requirements.minLength },
          { key: 'passwordStrength.hasUpper', met: strength.requirements.hasUpper },
          { key: 'passwordStrength.hasLower', met: strength.requirements.hasLower },
          { key: 'passwordStrength.hasNumber', met: strength.requirements.hasNumber },
          { key: 'passwordStrength.hasSpecial', met: strength.requirements.hasSpecial },
        ].map(({ key, met }) => (
          <div key={key} className="flex items-center gap-1 text-xs">
            {met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
              {t(key)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
