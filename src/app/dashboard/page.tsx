'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Shield, Loader2, BarChart3 } from 'lucide-react';
import { useEconomicsStore } from '@/store/economics-store';
import { useI18n } from '@/lib/i18n-provider';
import { useProfile, useProgressSync } from '@/hooks/use-profile';
import { ALERT_AUTO_DISMISS_MS } from '@/lib/constants';
import { AlertBanner } from '@/components/ui/alert-banner';
import { AppHeader } from '@/components/shared/app-header';
import { TwoFAManagement } from '@/components/shared/two-fa-management';
import { ProgressStats } from '@/components/shared/progress-stats';

export default function DashboardPage() {
  const { t } = useI18n();
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

  const totalXP = useEconomicsStore((s) => s.totalXP);
  const quizResultsCount = useEconomicsStore((s) => s.quizResults.length);
  const moduleInteractionsCount = useEconomicsStore((s) => s.moduleInteractions.length);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), ALERT_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error, setError]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), ALERT_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [success, setSuccess]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={t('dashboard.title')} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AlertBanner type="error" message={error} onDismiss={() => setError('')} closeLabel={t('common.close') || 'Close'} />
        <AlertBanner type="success" message={success} onDismiss={() => setSuccess('')} closeLabel={t('common.close') || 'Close'} />

        <Tabs defaultValue="profile" className="space-y-6" onValueChange={() => { setError(''); setSuccess(''); }}>
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
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{profile?.email}</span>
                      {profile?.emailVerified ? (
                        <Badge variant="secondary" className="text-xs">{t('dashboard.profile.emailVerified')}</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">{t('profile.emailUnverified')}</Badge>
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
            <TwoFAManagement
              twoFactorEnabled={!!profile?.twoFactorEnabled}
              onTwoFactorChange={(enabled) => {
                setProfile((p) => (p ? { ...p, twoFactorEnabled: enabled } : null));
                update();
              }}
              setError={setError}
              setSuccess={setSuccess}
            />
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
