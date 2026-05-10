'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { default as nextDynamic } from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useEconomicsStore, getLevelFromXP, getLevelTitle, getLevelColor, getModuleInteractionCount } from '@/store/economics-store'
import { useI18n } from '@/lib/i18n-provider'
import { LanguageToggle } from '@/components/economics/language-toggle'
import {
  Calculator,
  ArrowRightLeft,
  ArrowLeftRight,
  Brain,
  DollarSign,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Gauge,
  Crosshair,
  Landmark,
  BookOpen,
  Sparkles,
  Globe,
  Target,
  Trophy,
  TrendingDown,
  Scale,
  Swords,
  Receipt,
  Zap,
  Download,
  CheckCircle2,
  LayoutGrid,
  Building2,
  Coins,
} from 'lucide-react'

// Lazy-load all module components for performance
const GDPCalculator = nextDynamic(() => import('@/components/economics/gdp-calculator').then(m => ({ default: m.GDPCalculator })), { ssr: false })
const SupplyDemand = nextDynamic(() => import('@/components/economics/supply-demand').then(m => ({ default: m.SupplyDemand })), { ssr: false })
const ElasticityCalculator = nextDynamic(() => import('@/components/economics/elasticity-calculator').then(m => ({ default: m.ElasticityCalculator })), { ssr: false })
const KeynesianCross = nextDynamic(() => import('@/components/economics/keynesian-cross').then(m => ({ default: m.KeynesianCross })), { ssr: false })
const InflationCalculator = nextDynamic(() => import('@/components/economics/inflation-calculator').then(m => ({ default: m.InflationCalculator })), { ssr: false })
const PhillipsCurve = nextDynamic(() => import('@/components/economics/phillips-curve').then(m => ({ default: m.PhillipsCurve })), { ssr: false })
const LorenzCurve = nextDynamic(() => import('@/components/economics/lorenz-curve').then(m => ({ default: m.LorenzCurve })), { ssr: false })
const PPFCurve = nextDynamic(() => import('@/components/economics/ppf').then(m => ({ default: m.PPFCurve })), { ssr: false })
const CostAnalysis = nextDynamic(() => import('@/components/economics/cost-analysis').then(m => ({ default: m.CostAnalysis })), { ssr: false })
const ComparativeAdvantage = nextDynamic(() => import('@/components/economics/comparative-advantage').then(m => ({ default: m.ComparativeAdvantage })), { ssr: false })
const BreakEvenAnalysis = nextDynamic(() => import('@/components/economics/break-even').then(m => ({ default: m.BreakEvenAnalysis })), { ssr: false })
const TaxCalculator = nextDynamic(() => import('@/components/economics/tax-calculator').then(m => ({ default: m.TaxCalculator })), { ssr: false })
const GameTheory = nextDynamic(() => import('@/components/economics/game-theory').then(m => ({ default: m.GameTheory })), { ssr: false })
const EconomicsQuiz = nextDynamic(() => import('@/components/economics/quiz').then(m => ({ default: m.EconomicsQuiz })), { ssr: false })
const FinancialMath = nextDynamic(() => import('@/components/economics/financial-math').then(m => ({ default: m.FinancialMath })), { ssr: false })
const Glossary = nextDynamic(() => import('@/components/economics/glossary').then(m => ({ default: m.Glossary })), { ssr: false })
const Achievements = nextDynamic(() => import('@/components/economics/achievements').then(m => ({ default: m.Achievements })), { ssr: false })
const ProgressTracker = nextDynamic(() => import('@/components/economics/progress-tracker').then(m => ({ default: m.ProgressTracker })), { ssr: false })
const ISLMModel = nextDynamic(() => import('@/components/economics/is-lm').then(m => ({ default: m.ISLMModel })), { ssr: false })
const MarketStructures = nextDynamic(() => import('@/components/economics/market-structures').then(m => ({ default: m.MarketStructures })), { ssr: false })
const CurrencyCalculator = nextDynamic(() => import('@/components/economics/currency-calculator').then(m => ({ default: m.CurrencyCalculator })), { ssr: false })
const PriceIndices = nextDynamic(() => import('@/components/economics/price-indices').then(m => ({ default: m.PriceIndices })), { ssr: false })
const ThemeToggle = nextDynamic(() => import('@/components/economics/theme-toggle').then(m => ({ default: m.ThemeToggle })), { ssr: false })

// Module definitions with categories for grouped navigation
const moduleCategoryIds = ['macro', 'micro', 'finance', 'tools'] as const

const modules = [
  { id: 'gdp', titleKey: 'module.gdp.title', descriptionKey: 'module.gdp.description', icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15 },
  { id: 'supply-demand', titleKey: 'module.supply-demand.title', descriptionKey: 'module.supply-demand.description', icon: ArrowRightLeft, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15 },
  { id: 'elasticity', titleKey: 'module.elasticity.title', descriptionKey: 'module.elasticity.description', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15 },
  { id: 'keynesian', titleKey: 'module.keynesian.title', descriptionKey: 'module.keynesian.description', icon: Crosshair, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20 },
  { id: 'inflation', titleKey: 'module.inflation.title', descriptionKey: 'module.inflation.description', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15 },
  { id: 'phillips', titleKey: 'module.phillips.title', descriptionKey: 'module.phillips.description', icon: TrendingDown, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20 },
  { id: 'lorenz', titleKey: 'module.lorenz.title', descriptionKey: 'module.lorenz.description', icon: Scale, color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20 },
  { id: 'is-lm', titleKey: 'module.is-lm.title', descriptionKey: 'module.is-lm.description', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25 },
  { id: 'ppf', titleKey: 'module.ppf.title', descriptionKey: 'module.ppf.description', icon: ArrowLeftRight, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15 },
  { id: 'costs', titleKey: 'module.costs.title', descriptionKey: 'module.costs.description', icon: BarChart3, color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 20 },
  { id: 'comparative', titleKey: 'module.comparative.title', descriptionKey: 'module.comparative.description', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15 },
  { id: 'breakeven', titleKey: 'module.breakeven.title', descriptionKey: 'module.breakeven.description', icon: Target, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30', categoryKey: 'home.modcat.financeAnalysis', catId: 'finance', xpReward: 15 },
  { id: 'tax', titleKey: 'module.tax.title', descriptionKey: 'module.tax.description', icon: Receipt, color: 'text-lime-600', bg: 'bg-lime-50 dark:bg-lime-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 20 },
  { id: 'game-theory', titleKey: 'module.game-theory.title', descriptionKey: 'module.game-theory.description', icon: Swords, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 20 },
  { id: 'market-structures', titleKey: 'module.market-structures.title', descriptionKey: 'module.market-structures.description', icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 25 },
  { id: 'price-indices', titleKey: 'price-indices.title', descriptionKey: 'price-indices.description', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15 },
  { id: 'quiz', titleKey: 'module.quiz.title', descriptionKey: 'module.quiz.description', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', categoryKey: 'home.modcat.tests', catId: 'tools', xpReward: 10 },
  { id: 'currency', titleKey: 'module.currency.title', descriptionKey: 'module.currency.description', icon: Coins, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 15 },
  { id: 'finance', titleKey: 'module.finance.title', descriptionKey: 'module.finance.description', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 20 },
  { id: 'glossary', titleKey: 'module.glossary.title', descriptionKey: 'module.glossary.description', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.reference', catId: 'tools', xpReward: 5 },
  { id: 'achievements', titleKey: 'module.achievements.title', descriptionKey: 'module.achievements.description', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', categoryKey: 'home.modcat.motivation', catId: 'tools', xpReward: 0 },
  { id: 'progress', titleKey: 'module.progress.title', descriptionKey: 'module.progress.description', icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', categoryKey: 'home.modcat.analytics', catId: 'tools', xpReward: 0 },
]

const tabItems = [
  { value: 'home', icon: GraduationCap, labelKey: 'home.tab.home', catId: null },
  // Macro
  { value: 'gdp', icon: Calculator, labelKey: 'home.tab.gdp', catId: 'macro' },
  { value: 'keynesian', icon: Crosshair, labelKey: 'home.tab.keynesian', catId: 'macro' },
  { value: 'inflation', icon: Landmark, labelKey: 'home.tab.inflation', catId: 'macro' },
  { value: 'phillips', icon: TrendingDown, labelKey: 'home.tab.phillips', catId: 'macro' },
  { value: 'lorenz', icon: Scale, labelKey: 'home.tab.lorenz', catId: 'macro' },
  { value: 'is-lm', icon: Landmark, labelKey: 'home.tab.islm', catId: 'macro' },
  // Micro
  { value: 'supply-demand', icon: ArrowRightLeft, labelKey: 'home.tab.supplyDemand', catId: 'micro' },
  { value: 'elasticity', icon: Gauge, labelKey: 'home.tab.elasticity', catId: 'micro' },
  { value: 'ppf', icon: ArrowLeftRight, labelKey: 'home.tab.ppf', catId: 'micro' },
  { value: 'costs', icon: BarChart3, labelKey: 'home.tab.costs', catId: 'micro' },
  { value: 'comparative', icon: Globe, labelKey: 'home.tab.comparative', catId: 'micro' },
  { value: 'game-theory', icon: Swords, labelKey: 'home.tab.gameTheory', catId: 'micro' },
  { value: 'market-structures', icon: Building2, labelKey: 'home.tab.marketStructures', catId: 'micro' },
  { value: 'price-indices', icon: TrendingUp, labelKey: 'home.tab.priceIndices', catId: 'macro' },
  // Finance
  { value: 'breakeven', icon: Target, labelKey: 'home.tab.breakeven', catId: 'finance' },
  { value: 'tax', icon: Receipt, labelKey: 'home.tab.tax', catId: 'finance' },
  { value: 'currency', icon: Coins, labelKey: 'home.tab.currency', catId: 'finance' },
  { value: 'finance', icon: DollarSign, labelKey: 'home.tab.finance', catId: 'finance' },
  // Tools
  { value: 'quiz', icon: Brain, labelKey: 'home.tab.quiz', catId: 'tools' },
  { value: 'glossary', icon: BookOpen, labelKey: 'home.tab.glossary', catId: 'tools' },
  { value: 'achievements', icon: Trophy, labelKey: 'home.tab.achievements', catId: 'tools' },
  { value: 'progress', icon: BarChart3, labelKey: 'home.tab.progress', catId: 'tools' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
}

// Map of module components for conditional rendering
const moduleComponents: Record<string, React.ComponentType> = {
  'gdp': GDPCalculator,
  'supply-demand': SupplyDemand,
  'elasticity': ElasticityCalculator,
  'keynesian': KeynesianCross,
  'inflation': InflationCalculator,
  'phillips': PhillipsCurve,
  'lorenz': LorenzCurve,
  'is-lm': ISLMModel,
  'ppf': PPFCurve,
  'costs': CostAnalysis,
  'comparative': ComparativeAdvantage,
  'breakeven': BreakEvenAnalysis,
  'tax': TaxCalculator,
  'game-theory': GameTheory,
  'market-structures': MarketStructures,
  'currency': CurrencyCalculator,
  'price-indices': PriceIndices,
  'quiz': EconomicsQuiz,
  'finance': FinancialMath,
  'glossary': Glossary,
  'achievements': Achievements,
  'progress': ProgressTracker,
}

// Category separators positions in the tab bar
const categoryBreaks = new Set(['gdp', 'supply-demand', 'breakeven', 'quiz'])

export default function Home() {
  const [activeTab, setActiveTab] = useState('home')
  const { locale, t } = useI18n()
  const totalXP = useEconomicsStore((s) => s.totalXP)
  const moduleInteractions = useEconomicsStore((s) => s.moduleInteractions)
  const xpState = getLevelFromXP(totalXP)
  const levelTitle = getLevelTitle(xpState.level)
  const levelColor = getLevelColor(xpState.level)

  // Compute progress per module
  const moduleProgress = useMemo(() => {
    const progress: Record<string, number> = {}
    for (const mod of modules) {
      const count = getModuleInteractionCount(moduleInteractions, mod.id)
      // 3 interactions = 100% explored for most modules
      progress[mod.id] = Math.min(100, Math.round((count / 3) * 100))
    }
    return progress
  }, [moduleInteractions])

  // Count explored modules
  const exploredCount = useMemo(() => {
    return modules.filter((m) => moduleProgress[m.id] > 0).length
  }, [moduleProgress])

  // Render only the active module (performance optimization)
  const ActiveModule = activeTab !== 'home' ? moduleComponents[activeTab] : null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('home')}
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
          </div>
          <div className="flex items-center gap-2">
            {totalXP > 0 && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className={levelColor}>{t('home.header.levelAbbr')}{xpState.level}</span>
                <span className="text-muted-foreground">{totalXP.toLocaleString('ru-RU')} {t('home.header.xpLabel')}</span>
              </Badge>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <Badge variant="outline" className="hidden sm:flex">
              <Sparkles className="h-3 w-3 mr-1" />
              v7.0
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Scrollable Tab Navigation with category groups */}
          <div className="mb-6">
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="inline-flex h-auto p-1 gap-0.5">
                {tabItems.map((item, idx) => (
                  <span key={item.value} className="inline-flex items-center">
                    {idx > 0 && categoryBreaks.has(item.value) && (
                      <Separator orientation="vertical" className="h-6 mx-1.5" />
                    )}
                    {idx === 1 && !categoryBreaks.has(item.value) && (
                      <Separator orientation="vertical" className="h-6 mx-1.5" />
                    )}
                    <TabsTrigger value={item.value} className="text-xs px-2 py-2 flex items-center gap-1">
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{t(item.labelKey)}</span>
                    </TabsTrigger>
                  </span>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-8">
            {/* Hero */}
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
                    <span className="text-muted-foreground text-sm">({totalXP.toLocaleString('ru-RU')} {t('home.header.xpLabel')})</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{exploredCount}/22 {t('home.hero.modulesExplored')}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Modules Grid with progress indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {modules.map((mod, i) => {
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

            {/* How to use */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {t('home.howto.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
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

          {/* Conditionally render only the active module (performance) */}
          {ActiveModule && <TabsContent value={activeTab}><ActiveModule /></TabsContent>}
        </Tabs>
      </main>

      {/* Footer with nextDynamic stats */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          {t('home.footer.text')}
          {totalXP > 0 && (
            <span className="hidden sm:inline"> • {totalXP.toLocaleString('ru-RU')} {t('home.header.xpLabel')} • {exploredCount}/22 {t('home.hero.modulesExplored')}</span>
          )}
          <span className="hidden sm:inline"> • {t('home.footer.author')}</span>
        </div>
      </footer>
    </div>
  )
}
