'use client'

import type React from 'react'
import { useState, useMemo, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { SafeUserInitials, SafeUserContent } from '@/components/shared/safe-user-content'
import { signOutAndClearStore } from '@/lib/sign-out'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

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
import { formatNumber } from '@/lib/i18n'
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
import { modules } from '@/lib/module-data'
import type { ModuleMeta, TabMeta } from '@/lib/module-data'

interface HomeClientProps {
  session: { user: { name: string | null; email: string | null; image: string | null } } | null
  visibleModules: ModuleMeta[]
  visibleTabItems: TabMeta[]
  visibleCategoryBreaks: Set<string>
  totalModules: number
}

// Icon map keyed by module id for server-provided modules
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const m of modulesWithIcons) { iconMap[m.id] = m.icon; }
const tabIconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const t of tabItemsWithIcons) { tabIconMap[t.value] = t.icon; }

export function HomeClient({
  session: serverSession,
  visibleModules: serverVisibleModules,
  visibleTabItems: serverVisibleTabItems,
  visibleCategoryBreaks: serverVisibleCategoryBreaks,
  totalModules,
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

  // Merge server and client session data
  const session = clientSession?.user
    ? clientSession
    : serverSession
      ? { user: { ...serverSession.user } }
      : null

  const hydrated = typeof window !== 'undefined'

  const t = clientT
  const visibleModules = useMemo(() => hydrated
    ? (session ? modulesWithIcons : modulesWithIcons.filter((m) => m.public))
    : serverVisibleModules.map(m => ({ ...m, icon: iconMap[m.id] ?? GraduationCap })), [hydrated, session, modulesWithIcons, serverVisibleModules, iconMap])
  const visibleTabItems = useMemo(() => hydrated
    ? (session ? tabItemsWithIcons : tabItemsWithIcons.filter((item) => item.value === 'home' || modules.find((m) => m.id === item.value)?.public))
    : serverVisibleTabItems.map(ti => ({ ...ti, icon: tabIconMap[ti.value] ?? GraduationCap })), [hydrated, session, tabItemsWithIcons, modules, serverVisibleTabItems, tabIconMap])
  const visibleCategoryBreaks = useMemo(() => hydrated
    ? (session ? categoryBreaks : new Set([...categoryBreaks].filter((id) => modules.find((m) => m.id === id)?.public)))
    : serverVisibleCategoryBreaks, [hydrated, session, categoryBreaks, modules, serverVisibleCategoryBreaks])
  const fmt = (v: number) => formatNumber(v, clientLocale)


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
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1"
            onClick={() => setActiveTab('home')}
            aria-label={t('home.title')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold leading-tight gradient-text">{t('home.title')}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t('home.header.subtitle')}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            {totalXP > 0 && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                <span className={`font-semibold ${levelColor}`}>{t('home.header.levelAbbr')}{xpState.level}</span>
                <span className="text-muted-foreground text-sm">{fmt(totalXP)} {t('home.header.xpLabel')}</span>
              </Badge>
            )}
            <LanguageToggle />
            <ThemeToggle />

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all duration-300 hover:scale-110">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground text-sm font-semibold">
                      <SafeUserInitials name={session.user?.name ?? null} />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold"><SafeUserContent>{session.user?.name || t('level.student')}</SafeUserContent></span>
                      <span className="text-xs text-muted-foreground"><SafeUserContent>{session.user?.email}</SafeUserContent></span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer transition-colors">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t('dashboard.title')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOutAndClearStore({ callbackUrl: '/' })} className="cursor-pointer transition-colors">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('dashboard.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => router.push('/auth/login')} className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('auth.login.submit')}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6 flex-1">
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

          <TabsContent value="home" className="space-y-8 mt-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-4 py-6"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary text-sm font-semibold border border-primary/20 shadow-sm">
                <Sparkles className="h-4 w-4 animate-pulse" />
                {t('home.hero.badge')}
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                {t('home.hero.title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              {totalXP > 0 && (
                <div className="inline-flex items-center gap-4 flex-wrap justify-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg"
                  >
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <span className={`font-bold text-xl ${levelColor}`}>{t('home.hero.level')} {xpState.level} — {levelTitle}</span>
                    <span className="text-muted-foreground text-sm font-medium">({fmt(totalXP)} {t('home.header.xpLabel')})</span>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/5 to-purple-600/5 border-2 border-primary/20 shadow-lg"
                  >
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">{exploredCount}/{totalModules} {t('home.hero.modulesExplored')}</span>
                  </motion.div>
                </div>
              )}
            </motion.div>

            <Suspense fallback={<ModuleSkeleton />}>
              <DailyChallenge />
            </Suspense>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      layout
                    >
                      <button
                        className="w-full text-left cursor-pointer hover:shadow-2xl transition-all duration-300 h-full rounded-2xl border bg-card p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group card-hover"
                        onClick={() => setActiveTab(mod.id)}
                        aria-label={t(mod.titleKey)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <motion.div 
                              className={`h-14 w-14 rounded-2xl ${mod.bg} flex items-center justify-center relative group-hover:scale-110 transition-transform duration-300`}
                              whileHover={{ scale: 1.1 }}
                            >
                              <Icon className={`h-6 w-6 ${mod.color}`} />
                              {isExplored && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="h-4 w-4 text-green-500 absolute -top-1 -right-1 bg-background rounded-full flex items-center justify-center shadow-sm"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                </motion.div>
                              )}
                            </motion.div>
                            <div className="flex items-center gap-1.5">
                              {mod.xpReward > 0 && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800">
                                  <Zap className="h-3 w-3 text-yellow-500 mr-0.5" />
                                  +{mod.xpReward}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {t(mod.categoryKey)}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-base mt-3 group-hover:text-primary transition-colors duration-300">{t(mod.titleKey)}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2">{t(mod.descriptionKey)}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {isExplored ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">{t('home.card.progress')}</span>
                                <span className="font-bold text-primary">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          ) : (
                            <div className="text-xs text-primary font-semibold flex items-center gap-1.5 group-hover:gap-2 transition-all duration-300">
                              {t('home.card.start')}
                              <TrendingUp className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </CardContent>
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {!session && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/30 shadow-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5 animate-pulse" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lock className="h-5 w-5 text-primary" />
                      {t('home.cta.title')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('home.cta.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3 relative">
                    <Button onClick={() => router.push('/auth/login')} size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('auth.login.submit')}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/auth/register')} size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-lg">
                      {t('auth.register.submit')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border-primary/20 shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {t('home.howto.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: step * 0.1 }}
                      className="space-y-2 p-3 rounded-xl hover:bg-primary/5 transition-colors duration-300"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                          {step}
                        </span>
                        {t(`home.howto.step${step}.title`)}
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed">{t(`home.howto.step${step}.desc`)}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {ActiveModule && <TabsContent value={activeTab}><Suspense key={activeTab} fallback={<ModuleSkeleton />}><ActiveModule /></Suspense></TabsContent>}
        </Tabs>
      </main>

      <footer className="border-t mt-auto glass">
        <div className="container mx-auto px-4 py-5 text-center text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>{t('home.footer.text')}</span>
            {totalXP > 0 && (
              <span className="hidden sm:inline-flex items-center gap-2">
                • <Zap className="h-3 w-3 text-yellow-500" />
                <span className="font-semibold">{fmt(totalXP)} {t('home.header.xpLabel')}</span>
                • <span className="font-semibold">{exploredCount}/{visibleModules.length} {t('home.hero.modulesExplored')}</span>
              </span>
            )}
            <span className="hidden sm:inline"> • {t('home.footer.author')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
