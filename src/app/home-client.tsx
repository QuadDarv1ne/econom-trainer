'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { signOutAndClearStore } from '@/lib/sign-out'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import type { Session } from 'next-auth'

const DailyChallenge = dynamic(() => import('@/components/economics/daily-challenge').then(m => ({ default: m.DailyChallenge })), { ssr: false })

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEconomicsStore, getLevelTitle, getLevelColor, getModuleInteractionCount } from '@/store/economics-store'
import { getLevelFromXP } from '@/lib/xp-utils'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumber, type Locale } from '@/lib/i18n'
import { LanguageToggle } from '@/components/economics/language-toggle'
import {
  GraduationCap,
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle2,
  LayoutGrid,
  LogIn,
  UserCircle,
  Shield,
  LogOut,
  Lock,
} from 'lucide-react'
import { ModuleSkeleton } from '@/components/economics/module-skeleton'
import {
  modulesWithIcons,
  tabItemsWithIcons,
  categoryBreaks,
  cardVariants,
  moduleComponents,
  ThemeToggle,
} from '@/lib/module-registry'
import { modules, tabItems } from '@/lib/module-data'
import type { ModuleMeta, TabMeta } from '@/lib/module-data'

interface HomeClientProps {
  session: Session | null
  locale: Locale
  visibleModules: ModuleMeta[]
  visibleTabItems: TabMeta[]
  visibleCategoryBreaks: Set<string>
  totalModules: number
  t: (key: string) => string
  fmt: (value: number) => string
}

// Icon map keyed by module id for server-provided modules
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const m of modulesWithIcons) { iconMap[m.id] = m.icon; }
const tabIconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const t of tabItemsWithIcons) { tabIconMap[t.value] = t.icon; }

export function HomeClient({
  session: serverSession,
  locale: serverLocale,
  visibleModules: serverVisibleModules,
  visibleTabItems: serverVisibleTabItems,
  visibleCategoryBreaks: serverVisibleCategoryBreaks,
  totalModules,
  t: serverT,
  fmt: serverFmt,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState('home')
  const { data: clientSession } = useSession()
  const router = useRouter()
  const { t: clientT, locale: clientLocale } = useI18n()
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const moduleInteractions = useEconomicsStore((s) => s.moduleInteractions)
  const xpState = getLevelFromXP(totalXP)
  const levelTitle = getLevelTitle(xpState.level)
  const levelColor = getLevelColor(xpState.level)

  const session = clientSession ?? serverSession

  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])

  const t = hydrated ? clientT : serverT
  const locale = hydrated ? clientLocale : serverLocale
  const visibleModules = hydrated
    ? (session ? modulesWithIcons : modulesWithIcons.filter((m) => m.public))
    : serverVisibleModules.map(m => ({ ...m, icon: iconMap[m.id] ?? GraduationCap }))
  const visibleTabItems = hydrated
    ? (session ? tabItemsWithIcons : tabItemsWithIcons.filter((item) => item.value === 'home' || modules.find((m) => m.id === item.value)?.public))
    : serverVisibleTabItems.map(ti => ({ ...ti, icon: tabIconMap[ti.value] ?? GraduationCap }))
  const visibleCategoryBreaks = hydrated
    ? (session ? categoryBreaks : new Set([...categoryBreaks].filter((id) => modules.find((m) => m.id === id)?.public)))
    : serverVisibleCategoryBreaks
  const fmt = hydrated ? (v: number) => formatNumber(v, clientLocale) : serverFmt

  const userInitials = (session?.user?.name && session.user.name.trim())
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() || '?'

  const moduleProgress = useMemo(() => {
    const progress: Record<string, number> = {}
    for (const mod of visibleModules) {
      const count = getModuleInteractionCount(moduleInteractions, mod.id)
      progress[mod.id] = Math.min(100, Math.round((count / 3) * 100))
    }
    return progress
  }, [moduleInteractions, visibleModules])

  const exploredCount = useMemo(() => {
    return visibleModules.filter((m) => moduleProgress[m.id] > 0).length
  }, [moduleProgress, visibleModules])

  const ActiveModule = activeTab !== 'home' && activeTab in moduleComponents ? moduleComponents[activeTab as keyof typeof moduleComponents] : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1"
            onClick={() => setActiveTab('home')}
            aria-label={t('home.title')}
          >
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t('home.title')}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t('home.header.subtitle')}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {totalXP > 0 && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className={levelColor}>{t('home.header.levelAbbr')}{xpState.level}</span>
                <span className="text-muted-foreground">{fmt(totalXP)} {t('home.header.xpLabel')}</span>
              </Badge>
            )}
            <LanguageToggle />
            <ThemeToggle />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{session.user?.name || t('level.student')}</span>
                      <span className="text-xs text-muted-foreground">{session.user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t('dashboard.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <Shield className="mr-2 h-4 w-4" />
                    {t('dashboard.tab.security')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOutAndClearStore({ callbackUrl: '/' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('dashboard.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('auth.login.submit')}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 -mx-4 px-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-auto p-1 gap-0.5 bg-transparent">
                {visibleTabItems.map((item, idx) => (
                  <span key={item.value} className="inline-flex items-center">
                    {idx > 0 && visibleCategoryBreaks.has(item.value) && (
                      <Separator orientation="vertical" className="h-6 mx-1" />
                    )}
                    {idx === 1 && !visibleCategoryBreaks.has(item.value) && (
                      <Separator orientation="vertical" className="h-6 mx-1" />
                    )}
                    <TabsTrigger
                      value={item.value}
                      className="text-xs px-2.5 py-1.5 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      title={t(item.labelKey)}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden md:inline">{t(item.labelKey)}</span>
                    </TabsTrigger>
                  </span>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <TabsContent value="home" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3 py-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                <Sparkles className="h-4 w-4" />
                {t('home.hero.badge')}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t('home.hero.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                {t('home.hero.subtitle')}
              </p>
              {totalXP > 0 && (
                <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className={`font-bold text-lg ${levelColor}`}>{t('home.hero.level')} {xpState.level} — {levelTitle}</span>
                    <span className="text-muted-foreground text-sm">({fmt(totalXP)} {t('home.header.xpLabel')})</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{exploredCount}/{totalModules} {t('home.hero.modulesExplored')}</span>
                  </div>
                </div>
              )}
            </motion.div>

            <Suspense fallback={<ModuleSkeleton />}>
              <DailyChallenge />
            </Suspense>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {visibleModules.map((mod, i) => {
                  const Icon = mod.icon
                  const progress = moduleProgress[mod.id]
                  const isExplored = progress > 0
                  return (
                    <motion.div
                      key={mod.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -4, transition: { duration: 0.15 } }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full"
                        onClick={() => setActiveTab(mod.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(mod.id); } }}
                        role="button"
                        tabIndex={0}
                        aria-label={t(mod.titleKey)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className={`h-11 w-11 rounded-xl ${mod.bg} flex items-center justify-center relative`}>
                              <Icon className={`h-5 w-5 ${mod.color}`} />
                              {isExplored && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 absolute -top-1 -right-1 bg-background rounded-full" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {mod.xpReward > 0 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  <Zap className="h-2.5 w-2.5 text-yellow-500 mr-0.5" />
                                  +{mod.xpReward}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {t(mod.categoryKey)}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-sm mt-2">{t(mod.titleKey)}</CardTitle>
                          <CardDescription className="text-xs">{t(mod.descriptionKey)}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {isExplored ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{t('home.card.progress')}</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          ) : (
                            <div className="text-xs text-primary font-medium flex items-center gap-1">
                              {t('home.card.start')}
                              <TrendingUp className="h-3 w-3" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {!session && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lock className="h-5 w-5" />
                      {t('home.cta.title')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('home.cta.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button onClick={() => router.push('/auth/login')} size="sm">
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('auth.login.submit')}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/auth/register')} size="sm">
                      {t('auth.register.submit')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {t('home.howto.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                      {t('home.howto.step1.title')}
                    </div>
                    <p className="text-muted-foreground">{t('home.howto.step1.desc')}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                      {t('home.howto.step2.title')}
                    </div>
                    <p className="text-muted-foreground">{t('home.howto.step2.desc')}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                      {t('home.howto.step3.title')}
                    </div>
                    <p className="text-muted-foreground">{t('home.howto.step3.desc')}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
                      {t('home.howto.step4.title')}
                    </div>
                    <p className="text-muted-foreground">{t('home.howto.step4.desc')}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">5</span>
                      {t('home.howto.step5.title')}
                    </div>
                    <p className="text-muted-foreground">{t('home.howto.step5.desc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {ActiveModule && <TabsContent value={activeTab}><Suspense fallback={<ModuleSkeleton />}><ActiveModule /></Suspense></TabsContent>}
        </Tabs>
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          {t('home.footer.text')}
          {totalXP > 0 && (
            <span className="hidden sm:inline"> • {fmt(totalXP)} {t('home.header.xpLabel')} • {exploredCount}/{visibleModules.length} {t('home.hero.modulesExplored')}</span>
          )}
          <span className="hidden sm:inline"> • {t('home.footer.author')}</span>
        </div>
      </footer>
    </div>
  )
}
