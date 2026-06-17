'use client'

import type React from 'react'
import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { SafeUserInitials, SafeUserContent } from '@/components/shared/safe-user-content'
import { signOutAndClearStore } from '@/lib/sign-out'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useDebounce } from '@/hooks/use-auto-dismiss'

const DailyChallenge = dynamic(() => import('@/components/economics/daily-challenge').then(m => ({ default: m.DailyChallenge })), { ssr: false })

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEconomicsStore, getLevelTitle, getLevelColor, getModuleInteractionCount } from '@/store/economics-store'
import { getLevelFromXP } from '@/lib/xp-utils'
import { useI18n } from '@/lib/i18n-provider'
import { formatNumber } from '@/lib/i18n'
import { LanguageToggle } from '@/components/economics/language-toggle'
import { ThemeToggleEnhanced } from '@/components/ui/theme-toggle-enhanced'
import { BackgroundParticles } from '@/components/shared/animated-helpers'
import { useToastNotification, ToastContainer } from '@/components/shared/notification-toast'
import {
  GraduationCap,
  Sparkles,
  Zap,
  LayoutGrid,
  LogIn,
  UserCircle,
  LogOut,
  Lock,
  Search,
  Landmark,
  DollarSign,
  ChevronDown,
  ArrowLeft,
  Home,
  Wrench,
  SlidersHorizontal,
  X,
  CheckCircle2,
} from 'lucide-react'
import { ModuleCard } from '@/components/economics/module-card'
import { ModuleSkeleton } from '@/components/economics/module-skeleton'
import { ModuleErrorBoundary } from '@/components/economics/module-error-boundary'
import { MobileNav } from '@/components/economics/mobile-nav'
import { MobileXpPill } from '@/components/economics/xp-progress-ring'
import {
  modulesWithIcons,
  moduleComponents,
} from '@/lib/module-registry'
import { modules } from '@/lib/module-data'
import type { ModuleMeta } from '@/lib/module-data'

interface HomeClientProps {
  session: { user: { name: string | null; email: string | null; image: string | null } } | null
  visibleModules: ModuleMeta[]
  totalModules: number
}

const moduleIconMap: Record<string, React.ComponentType<{ className?: string }>> = {};
for (const m of modulesWithIcons) { moduleIconMap[m.id] = m.icon; }

export function HomeClient({
  session: serverSession,
  visibleModules: serverVisibleModules,
  totalModules,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState<string | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 200)
  const { toasts, removeToast } = useToastNotification()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchQueryRef = useRef(searchQuery)

  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'

      if (e.key === 'Escape' && searchQueryRef.current) {
        setSearchQuery('')
        searchInputRef.current?.blur()
        return
      }

      if (!isInput && (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey)))) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { passive: true })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  const { data: clientSession } = useSession()
  const router = useRouter()
  const { t: clientT, locale: clientLocale } = useI18n()
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const moduleInteractions = useEconomicsStore((s) => s.moduleInteractions)
  const xpState = getLevelFromXP(totalXP)
  const levelTitle = getLevelTitle(xpState.level)
  const levelColor = getLevelColor(xpState.level)
  const shouldReduceMotion = useReducedMotion()

  const session = useMemo(() => clientSession?.user
    ? clientSession
    : serverSession
      ? { user: { ...serverSession.user } }
      : null, [clientSession, serverSession])

  const hydrated = typeof window !== 'undefined'

  const t = clientT
  const visibleModules = useMemo(() => hydrated
    ? (session ? modulesWithIcons : modulesWithIcons.filter((m) => m.public))
    : serverVisibleModules.map(m => ({ ...m, icon: moduleIconMap[m.id] ?? GraduationCap })), [hydrated, session, serverVisibleModules])
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

  const categoryModules = useMemo(() => {
    const groups: Record<string, ModuleMeta[]> = { macro: [], micro: [], finance: [], tools: [] }
    for (const mod of visibleModules) {
      const cat = mod.catId as keyof typeof groups
      if (cat in groups) groups[cat].push(mod)
    }
    return groups
  }, [visibleModules])

  const categoryModuleIds = useMemo(() => {
    const ids: Record<string, string[]> = {}
    for (const [catId, mods] of Object.entries(categoryModules)) {
      ids[catId] = mods.map(m => m.id)
    }
    return ids
  }, [categoryModules])

  const searchedModules = useMemo(() => {
    let result = visibleModules
    if (mobileCategoryFilter) {
      result = result.filter(mod => mod.catId === mobileCategoryFilter)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((mod) => {
        const title = t(mod.titleKey).toLowerCase()
        const desc = t(mod.descriptionKey).toLowerCase()
        return title.includes(q) || desc.includes(q)
      })
    }
    return result
  }, [visibleModules, debouncedSearch, mobileCategoryFilter, t])

  const ActiveModule = activeTab !== 'home' && activeTab in moduleComponents ? moduleComponents[activeTab as keyof typeof moduleComponents] : null

  const activeModuleName = useMemo(() => {
    if (activeTab === 'home') return ''
    const meta = modules.find((m) => m.id === activeTab)
    return meta ? t(meta.titleKey) : activeTab
  }, [activeTab, t])

  const handleMobileNavPress = useCallback((categoryId: string) => {
    if (categoryId === 'home') {
      setMobileCategoryFilter(null)
      setActiveTab('home')
    } else {
      setMobileCategoryFilter(categoryId)
      setActiveTab('home')
    }
  }, [])

  const handleModuleClick = useCallback((moduleId: string) => {
    setMobileCategoryFilter(null)
    setActiveTab(moduleId)
  }, [])

  const mobileCategoryLabel = mobileCategoryFilter
    ? t(`home.cat.${mobileCategoryFilter}`)
    : null

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative">
      {/* Animated background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl animate-glow-pulse" />
        <div className="absolute top-[-10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[20%] h-[300px] w-[300px] rounded-full bg-cyan-500/5 blur-3xl animate-glow-pulse" style={{ animationDelay: '4s' }} />
      </div>
      <BackgroundParticles count={30} className="opacity-30" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <header className="sticky top-0 z-50 border-b glass transition-all duration-300">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="flex items-center gap-3 cursor-pointer group transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1"
            onClick={() => { setActiveTab('home'); setMobileCategoryFilter(null); }}
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
              <MobileXpPill
                level={xpState.level}
                totalXp={totalXP}
                currentXp={xpState.xpInCurrentLevel}
                xpForNextLevel={xpState.xpToNextLevel}
                shouldReduceMotion={shouldReduceMotion}
                formatNumber={fmt}
                xpLabel={t('home.header.xpLabel')}
              />
            )}
            {totalXP > 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0 }}
                animate={shouldReduceMotion ? {} : { scale: 1, opacity: 1 }}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                className="hidden sm:block"
              >
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200 dark:border-yellow-800 shadow-sm cursor-default">
                  <motion.div
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Zap className="h-4 w-4 text-yellow-500" />
                  </motion.div>
                  <span className={`font-semibold ${levelColor}`}>{t('home.header.levelAbbr')}{xpState.level}</span>
                  <span className="text-muted-foreground text-sm">{fmt(totalXP)} {t('home.header.xpLabel')}</span>
                </Badge>
              </motion.div>
            )}
            <LanguageToggle />
            <ThemeToggleEnhanced />

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
              <Button size="sm" onClick={() => router.push('/auth/login')} className="transition-all duration-300 hover:scale-105 hover:shadow-lg interactive-scale">
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t('auth.login.submit')}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6 flex-1 pb-20 sm:pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={activeTab === 'home' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setActiveTab('home'); setMobileCategoryFilter(null); }}
                className="shrink-0 transition-all duration-300 hover:scale-105 interactive-scale"
              >
                <Home className="h-4 w-4 mr-1.5" />
                <span>{t('home.tab.home')}</span>
              </Button>

              <div className="relative flex-1 min-w-[140px] max-w-[260px] group/search">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none transition-all duration-200 ${searchQuery ? 'text-primary' : 'text-muted-foreground'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.searchModules') || 'Search modules...'}
                  className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-14 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all duration-200 group-focus-within/search:border-primary/50 group-focus-within/search:shadow-sm group-focus-within/search:shadow-primary/10"
                  aria-label={t('home.searchModules') || 'Search modules'}
                />
                {searchQuery ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-accent rounded p-0.5 transition-colors"
                    aria-label={t('common.clearSearch') || 'Clear search'}
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                ) : (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60 bg-muted rounded border border-border/50">
                      /
                    </kbd>
                    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/40 bg-muted/50 rounded border border-border/30">
                      ?
                    </kbd>
                  </div>
                )}
              </div>

              {[
                { id: 'macro', label: t('home.cat.macro'), icon: Landmark, count: categoryModules['macro']?.length ?? 0 },
                { id: 'micro', label: t('home.cat.micro'), icon: SlidersHorizontal, count: categoryModules['micro']?.length ?? 0 },
                { id: 'finance', label: t('home.cat.finance'), icon: DollarSign, count: categoryModules['finance']?.length ?? 0 },
                { id: 'tools', label: t('home.cat.tools'), icon: Wrench, count: categoryModules['tools']?.length ?? 0 },
              ].map((cat) => {
                const catModules = categoryModules[cat.id]
                const hasActive = catModules.length > 0 && catModules.some(m => m.id === activeTab)
                const isFiltered = mobileCategoryFilter === cat.id
                return (
                  <DropdownMenu key={cat.id}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={hasActive || isFiltered ? 'secondary' : 'outline'}
                        size="sm"
                        className="shrink-0 transition-all duration-200 interactive-scale gap-1.5"
                      >
                        <cat.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{cat.label}</span>
                        {cat.count > 0 && (
                          <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 text-[10px] font-bold rounded-full bg-muted-foreground/10 text-muted-foreground">
                            {cat.count}
                          </span>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto">
                      <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {cat.label} &mdash; {catModules.length} {t('home.modules') || 'modules'}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {catModules.length === 0 ? (
                        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                          {t('home.noModules') || 'No modules'}
                        </DropdownMenuItem>
                      ) : (
                        catModules.map((mod) => {
                          const ModIcon = moduleIconMap[mod.id] ?? GraduationCap
                          const isActive = activeTab === mod.id
                          const modProgress = moduleProgress[mod.id] ?? 0
                          return (
                            <DropdownMenuItem
                              key={mod.id}
                              onClick={() => handleModuleClick(mod.id)}
                              className={`flex items-center gap-3 cursor-pointer transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            >
                              <div className={`h-7 w-7 rounded-lg ${mod.bg || 'bg-muted'} flex items-center justify-center`}>
                                <ModIcon className={`h-3.5 w-3.5 ${mod.color || 'text-foreground'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{t(mod.titleKey)}</div>
                              </div>
                              {modProgress > 0 && (
                                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${modProgress}%` }} />
                                </div>
                              )}
                              {isActive && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                              )}
                            </DropdownMenuItem>
                          )
                        })
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              })}
            </div>
          </div>

          <TabsContent value="home" className="space-y-8 mt-4">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: -20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
              className="text-center space-y-6 py-8"
            >
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/10 to-purple-600/10 text-primary text-sm font-semibold border border-primary/20 shadow-sm hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300"
              >
                <Sparkles className="h-4 w-4 animate-subtle-pulse" />
                {t('home.hero.badge')}
              </motion.div>
              <motion.h2
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent"
              >
                {t('home.hero.title')}
              </motion.h2>
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed"
              >
                {t('home.hero.subtitle')}
              </motion.p>
              {totalXP > 0 && (
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-4 flex-wrap justify-center"
                >
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-2 border-yellow-200 dark:border-yellow-800 shadow-lg hover:shadow-yellow-200/50 dark:hover:shadow-yellow-900/30 transition-shadow duration-300"
                  >
                    <Zap className="h-6 w-6 text-yellow-500" />
                    <span className={`font-bold text-xl ${levelColor}`}>{t('home.hero.level')} {xpState.level} — {levelTitle}</span>
                    <span className="text-muted-foreground text-sm font-medium">({fmt(totalXP)} {t('home.header.xpLabel')})</span>
                  </motion.div>
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/5 to-purple-600/5 border-2 border-primary/20 shadow-lg hover:shadow-primary/10 transition-shadow duration-300"
                  >
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold">{exploredCount}/{totalModules} {t('home.hero.modulesExplored')}</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>

            <Suspense fallback={<ModuleSkeleton />}>
              <ModuleErrorBoundary moduleName={t('dailyChallenge.title')} errorDescription={t('error.module.description')} retryLabel={t('error.module.retry')}>
                <DailyChallenge />
              </ModuleErrorBoundary>
            </Suspense>

            <AnimatePresence mode="wait">
              {mobileCategoryLabel && (
                <motion.div
                  key="mobile-filter-badge"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? {} : { opacity: 0, y: -8 }}
                  className="flex items-center justify-center gap-2 sm:hidden"
                >
                  <Badge
                    variant="outline"
                    className="px-3 py-1.5 text-sm font-medium bg-primary/5 border-primary/20"
                  >
                    {mobileCategoryLabel}
                    <button
                      onClick={() => setMobileCategoryFilter(null)}
                      className="ml-2 hover:text-primary transition-colors"
                      aria-label={t('common.clearFilter') || 'Clear filter'}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {searchedModules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchedModules.map((mod, i) => (
                  <ModuleCard
                    key={mod.id}
                    mod={mod}
                    progress={moduleProgress[mod.id]}
                    onClick={() => handleModuleClick(mod.id)}
                    index={i}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </div>
            ) : (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4 }}
                className="text-center py-16"
              >
                <div className="relative inline-flex mb-6">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
                  <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {debouncedSearch.trim()
                    ? (t('home.searchNoResults') || 'No modules found')
                    : (t('home.searchStart') || 'Start typing to search')}
                </h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto leading-relaxed">
                  {debouncedSearch.trim()
                    ? (t('home.searchNoResultsDesc') || 'Try a different search query or browse categories')
                    : (t('home.searchStartDesc') || 'Search through 25 economics modules by name or description')}
                </p>
                {debouncedSearch.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-6 transition-all duration-200 hover:scale-105"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    {t('home.searchClear') || 'Clear search'}
                  </Button>
                )}
              </motion.div>
            )}

            {!session && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/30 shadow-xl overflow-hidden relative group/cta">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-700" />
                  <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover/cta:bg-primary/20 transition-all duration-700" />
                  <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl group-hover/cta:bg-purple-500/20 transition-all duration-700" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      {t('home.cta.title')}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {t('home.cta.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3 relative">
                    <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button onClick={() => router.push('/auth/login')} size="default" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 interactive-scale">
                        <LogIn className="h-4 w-4 mr-2" />
                        {t('auth.login.submit')}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button variant="outline" onClick={() => router.push('/auth/register')} size="default" className="border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 interactive-scale">
                        {t('auth.register.submit')}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 border-primary/20 shadow-lg overflow-hidden group/howto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-purple-500/0 to-primary/5 opacity-0 group-hover/howto:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  {t('home.howto.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <motion.div
                      key={step}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { delay: step * 0.08 }}
                      whileHover={shouldReduceMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
                      className="space-y-2 p-3 rounded-xl hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5 border border-transparent hover:border-primary/10 transition-all duration-300 relative group/step"
                    >
                      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/0 via-purple-500/0 to-primary/10 opacity-0 group-hover/step:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="font-semibold flex items-center gap-2 relative">
                        <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md shrink-0 group-hover/step:shadow-lg group-hover/step:shadow-primary/30 transition-shadow duration-300">
                          {step}
                        </span>
                        <span className="group-hover/step:text-primary transition-colors duration-300">
                          {t(`home.howto.step${step}.title`)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed relative">{t(`home.howto.step${step}.desc`)}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {ActiveModule && (
            <TabsContent value={activeTab} className="space-y-4 mt-0">
              <motion.div
                key={activeTab}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeOut' }}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 px-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveTab('home'); setMobileCategoryFilter(null); }}
                    className="h-8 px-2.5 text-xs hover:text-primary hover:bg-primary/5 transition-all rounded-lg group"
                  >
                    <ArrowLeft className="h-3.5 w-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                    <Home className="h-3.5 w-3.5 mr-1" />
                    {t('home.tab.home')}
                  </Button>
                  <span className="text-muted-foreground/20">/</span>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/30">
                    <span className="font-medium text-foreground/80 truncate max-w-[250px] text-sm">
                      {activeModuleName}
                    </span>
                    {moduleProgress[activeTab] > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${moduleProgress[activeTab]}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          {moduleProgress[activeTab]}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-0.5">
                  <Suspense fallback={<ModuleSkeleton />}>
                    <ModuleErrorBoundary moduleName={activeModuleName} errorDescription={t('error.module.description')} retryLabel={t('error.module.retry')}>
                      <ActiveModule />
                    </ModuleErrorBoundary>
                  </Suspense>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <footer className="border-t mt-auto glass mb-14 sm:mb-0">
        <div className="container mx-auto px-4 py-5 text-center text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
              {t('home.footer.text')}
            </span>
            {totalXP > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <span className="text-muted-foreground/20">|</span>
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="font-medium">{fmt(totalXP)} {t('home.header.xpLabel')}</span>
                <span className="text-muted-foreground/20">|</span>
                <span className="font-medium">{exploredCount}/{visibleModules.length} {t('home.hero.modulesExplored')}</span>
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="text-muted-foreground/20">|</span>
              <span className="text-primary/60 hover:text-primary transition-colors">
                {t('home.footer.author')}
              </span>
            </span>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground/40">
            v{process.env.NEXT_PUBLIC_APP_VERSION || '7.2.0'}
          </div>
        </div>
      </footer>

      <MobileNav
        activeTab={activeTab}
        onCategoryPress={handleMobileNavPress}
        categoryModuleIds={categoryModuleIds}
      />
    </div>
  )
}
