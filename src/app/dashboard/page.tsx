'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PasswordInput } from '@/components/ui/password-input';
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
} from 'lucide-react';
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

export default function DashboardPage() {
  const { status, update } = useSession();
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile edit
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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

  // Local progress sync
  const totalXP = useEconomicsStore((s) => s.totalXP);
  const quizResultsCount = useEconomicsStore((s) => s.quizResults.length);
  const moduleInteractionsCount = useEconomicsStore((s) => s.moduleInteractions.length);
  const [syncing, setSyncing] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router, fetchProfile]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
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
        update();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError(t('dashboard.profile.saveError'));
    } finally {
      setSaving(false);
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
        setSuccess(t('dashboard.security.disabled'));
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

  async function syncProgress() {
    setSyncing(true);
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
        setSuccess(t('dashboard.progress.synced'));
      }
    } catch {
      setError(t('dashboard.progress.syncError'));
    } finally {
      setSyncing(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h1 className="text-lg font-bold">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                {t('dashboard.home')}
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {t('profile.title')}
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              {t('dashboard.tab.profile')}
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              {t('dashboard.tab.security')}
            </TabsTrigger>
            <TabsTrigger value="progress">
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('dashboard.tab.progress')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.profile.title')}</CardTitle>
                <CardDescription>{t('dashboard.profile.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={updateProfile} className="space-y-4">
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{profile?.email}</span>
                      {profile?.emailVerified && (
                        <Badge variant="secondary" className="text-xs">{t('dashboard.profile.emailVerified')}</Badge>
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
                    <Label>{t('dashboard.profile.accountId')}</Label>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{profile?.id}</code>
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
                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
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
                          <div className="flex gap-2">
                            <Input
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              placeholder="000000"
                              maxLength={6}
                              className="text-center text-2xl tracking-widest max-w-[200px]"
                            />
                            <Button onClick={verify2FA} disabled={verifying2FA}>
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
