'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useEconomicsStore, getLevelFromXP, getLevelTitle, getLevelColor, getModuleInteractionCount } from '@/store/economics-store'
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
const GDPCalculator = dynamic(() => import('@/components/economics/gdp-calculator').then(m => ({ default: m.GDPCalculator })), { ssr: false })
const SupplyDemand = dynamic(() => import('@/components/economics/supply-demand').then(m => ({ default: m.SupplyDemand })), { ssr: false })
const ElasticityCalculator = dynamic(() => import('@/components/economics/elasticity-calculator').then(m => ({ default: m.ElasticityCalculator })), { ssr: false })
const KeynesianCross = dynamic(() => import('@/components/economics/keynesian-cross').then(m => ({ default: m.KeynesianCross })), { ssr: false })
const InflationCalculator = dynamic(() => import('@/components/economics/inflation-calculator').then(m => ({ default: m.InflationCalculator })), { ssr: false })
const PhillipsCurve = dynamic(() => import('@/components/economics/phillips-curve').then(m => ({ default: m.PhillipsCurve })), { ssr: false })
const LorenzCurve = dynamic(() => import('@/components/economics/lorenz-curve').then(m => ({ default: m.LorenzCurve })), { ssr: false })
const PPFCurve = dynamic(() => import('@/components/economics/ppf').then(m => ({ default: m.PPFCurve })), { ssr: false })
const CostAnalysis = dynamic(() => import('@/components/economics/cost-analysis').then(m => ({ default: m.CostAnalysis })), { ssr: false })
const ComparativeAdvantage = dynamic(() => import('@/components/economics/comparative-advantage').then(m => ({ default: m.ComparativeAdvantage })), { ssr: false })
const BreakEvenAnalysis = dynamic(() => import('@/components/economics/break-even').then(m => ({ default: m.BreakEvenAnalysis })), { ssr: false })
const TaxCalculator = dynamic(() => import('@/components/economics/tax-calculator').then(m => ({ default: m.TaxCalculator })), { ssr: false })
const GameTheory = dynamic(() => import('@/components/economics/game-theory').then(m => ({ default: m.GameTheory })), { ssr: false })
const EconomicsQuiz = dynamic(() => import('@/components/economics/quiz').then(m => ({ default: m.EconomicsQuiz })), { ssr: false })
const FinancialMath = dynamic(() => import('@/components/economics/financial-math').then(m => ({ default: m.FinancialMath })), { ssr: false })
const Glossary = dynamic(() => import('@/components/economics/glossary').then(m => ({ default: m.Glossary })), { ssr: false })
const Achievements = dynamic(() => import('@/components/economics/achievements').then(m => ({ default: m.Achievements })), { ssr: false })
const ProgressTracker = dynamic(() => import('@/components/economics/progress-tracker').then(m => ({ default: m.ProgressTracker })), { ssr: false })
const ISLMModel = dynamic(() => import('@/components/economics/is-lm').then(m => ({ default: m.ISLMModel })), { ssr: false })
const MarketStructures = dynamic(() => import('@/components/economics/market-structures').then(m => ({ default: m.MarketStructures })), { ssr: false })
const CurrencyCalculator = dynamic(() => import('@/components/economics/currency-calculator').then(m => ({ default: m.CurrencyCalculator })), { ssr: false })
const ThemeToggle = dynamic(() => import('@/components/economics/theme-toggle').then(m => ({ default: m.ThemeToggle })), { ssr: false })

// Module definitions with categories for grouped navigation
const moduleCategories = [
  { id: 'macro', label: 'Макро', color: 'text-emerald-600' },
  { id: 'micro', label: 'Микро', color: 'text-blue-600' },
  { id: 'finance', label: 'Финансы', color: 'text-amber-600' },
  { id: 'tools', label: 'Инструменты', color: 'text-violet-600' },
] as const

const modules = [
  { id: 'gdp', title: 'ВВП и макропоказатели', description: 'Расчёт номинального и реального ВВП, дефлятора, инфляции', icon: Calculator, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', category: 'Макро', catId: 'macro', xpReward: 15 },
  { id: 'supply-demand', title: 'Спрос и предложение', description: 'Интерактивный график с анализом равновесия', icon: ArrowRightLeft, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', category: 'Микро', catId: 'micro', xpReward: 15 },
  { id: 'elasticity', title: 'Калькулятор эластичности', description: 'Эластичность по цене, доходу, перекрёстная', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', category: 'Микро', catId: 'micro', xpReward: 15 },
  { id: 'keynesian', title: 'Кейнсианский крест', description: 'Модель доходов-расходов с мультипликатором', icon: Crosshair, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', category: 'Макро', catId: 'macro', xpReward: 20 },
  { id: 'inflation', title: 'Калькулятор инфляции', description: 'Обесценение денег и покупательная способность', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', category: 'Макро', catId: 'macro', xpReward: 15 },
  { id: 'phillips', title: 'Кривая Филлипса', description: 'Инфляция и безработица: краткосрочный и долгосрочный разрез', icon: TrendingDown, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', category: 'Макро', catId: 'macro', xpReward: 20 },
  { id: 'lorenz', title: 'Кривая Лоренца и Джини', description: 'Визуализация неравенства доходов и коэффициент Джини', icon: Scale, color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/30', category: 'Макро', catId: 'macro', xpReward: 20 },
  { id: 'is-lm', title: 'Модель IS-LM', description: 'Равновесие товарного и денежного рынков, фискальная и денежная политика', icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', category: 'Макро', catId: 'macro', xpReward: 25 },
  { id: 'ppf', title: 'Кривая производственных возможностей', description: 'КПВ: альтернативные издержки, MRT, экономический рост', icon: ArrowLeftRight, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', category: 'Микро', catId: 'micro', xpReward: 15 },
  { id: 'costs', title: 'Анализ издержек фирмы', description: 'ATC, AVC, MC, AFC: графики и ключевые точки', icon: BarChart3, color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/30', category: 'Микро', catId: 'micro', xpReward: 20 },
  { id: 'comparative', title: 'Сравнительное преимущество', description: 'Модель Рикардо: выгоды международной торговли', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', category: 'Микро', catId: 'micro', xpReward: 15 },
  { id: 'breakeven', title: 'Точка безубыточности', description: 'CVP-анализ: расчёт BEP, маржинальность, запас прочности', icon: Target, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30', category: 'Фин.анализ', catId: 'finance', xpReward: 15 },
  { id: 'tax', title: 'Калькулятор налогов', description: 'НДФЛ с прогрессивной шкалой, НДС, налог на прибыль', icon: Receipt, color: 'text-lime-600', bg: 'bg-lime-50 dark:bg-lime-950/30', category: 'Финансы', catId: 'finance', xpReward: 20 },
  { id: 'game-theory', title: 'Теория игр', description: 'Дилемма заключённого, ястребы и голуби, равновесие Нэша', icon: Swords, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', category: 'Микро', catId: 'micro', xpReward: 20 },
  { id: 'market-structures', title: 'Рыночные структуры', description: 'Совершенная конкуренция, монополия, олигополия, моноп. конкуренция', icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', category: 'Микро', catId: 'micro', xpReward: 25 },
  { id: 'quiz', title: 'Квиз по экономике', description: '45 вопросов по микро- и макроэкономике с таймером', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', category: 'Тесты', catId: 'tools', xpReward: 10 },
  { id: 'currency', title: 'Валютный калькулятор', description: 'Конвертация, кросс-курсы и динамика валют', icon: Coins, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', category: 'Финансы', catId: 'finance', xpReward: 15 },
  { id: 'finance', title: 'Финансовая математика', description: 'Сложные проценты, NPV, аннуитетные расчёты', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', category: 'Финансы', catId: 'finance', xpReward: 20 },
  { id: 'glossary', title: 'Глоссарий терминов', description: '40+ ключевых терминов с формулами и поиском', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', category: 'Справка', catId: 'tools', xpReward: 5 },
  { id: 'achievements', title: 'Достижения', description: '19 бейджей, XP и уровни за тренировки', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', category: 'Мотивация', catId: 'tools', xpReward: 0 },
  { id: 'progress', title: 'Прогресс', description: 'Статистика тренировок и аналитика прогресса', icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', category: 'Аналитика', catId: 'tools', xpReward: 0 },
]

const tabItems = [
  { value: 'home', icon: GraduationCap, label: 'Главная', catId: null },
  // Макро
  { value: 'gdp', icon: Calculator, label: 'ВВП', catId: 'macro' },
  { value: 'keynesian', icon: Crosshair, label: 'Кейнс', catId: 'macro' },
  { value: 'inflation', icon: Landmark, label: 'Инфл.', catId: 'macro' },
  { value: 'phillips', icon: TrendingDown, label: 'Филлипс', catId: 'macro' },
  { value: 'lorenz', icon: Scale, label: 'Лоренц', catId: 'macro' },
  { value: 'is-lm', icon: Landmark, label: 'IS-LM', catId: 'macro' },
  // Микро
  { value: 'supply-demand', icon: ArrowRightLeft, label: 'D/S', catId: 'micro' },
  { value: 'elasticity', icon: Gauge, label: 'Эласт.', catId: 'micro' },
  { value: 'ppf', icon: ArrowLeftRight, label: 'КПВ', catId: 'micro' },
  { value: 'costs', icon: BarChart3, label: 'Издержки', catId: 'micro' },
  { value: 'comparative', icon: Globe, label: 'МЭ', catId: 'micro' },
  { value: 'game-theory', icon: Swords, label: 'Игры', catId: 'micro' },
  { value: 'market-structures', icon: Building2, label: 'Структуры', catId: 'micro' },
  // Финансы
  { value: 'breakeven', icon: Target, label: 'BEP', catId: 'finance' },
  { value: 'tax', icon: Receipt, label: 'Налоги', catId: 'finance' },
  { value: 'currency', icon: Coins, label: 'Валюта', catId: 'finance' },
  { value: 'finance', icon: DollarSign, label: 'Фин.мат', catId: 'finance' },
  // Инструменты
  { value: 'quiz', icon: Brain, label: 'Квиз', catId: 'tools' },
  { value: 'glossary', icon: BookOpen, label: 'Словарь', catId: 'tools' },
  { value: 'achievements', icon: Trophy, label: 'Бейджи', catId: 'tools' },
  { value: 'progress', icon: BarChart3, label: 'Прогресс', catId: 'tools' },
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
              <h1 className="text-lg font-bold leading-tight">Экономический тренажёр</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Интерактивный тренажёр для экономистов
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalXP > 0 && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className={levelColor}>Ур.{xpState.level}</span>
                <span className="text-muted-foreground">{totalXP.toLocaleString('ru-RU')} XP</span>
              </Badge>
            )}
            <a
              href="/download"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </a>
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
                      <span className="hidden sm:inline">{item.label}</span>
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
                21 модуль • 45 вопросов • 40+ терминов • 19 достижений • Система XP
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Тренируй экономическое мышление
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
                Интерактивные модули для расчётов, анализа графиков, решения задач и проверки знаний
                по микро- и макроэкономике, теории игр, налогам и финансам. Зарабатывайте XP и повышайте уровень!
              </p>
              {totalXP > 0 && (
                <div className="inline-flex items-center gap-3 flex-wrap justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className={`font-bold text-lg ${levelColor}`}>Уровень {xpState.level} — {levelTitle}</span>
                    <span className="text-muted-foreground text-sm">({totalXP.toLocaleString('ru-RU')} XP)</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{exploredCount}/21 модуль открыт</span>
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
                                {mod.category}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-sm mt-2">{mod.title}</CardTitle>
                          <CardDescription className="text-xs">{mod.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {isExplored ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Прогресс</span>
                                <span className="font-medium">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          ) : (
                            <div className="text-xs text-primary font-medium flex items-center gap-1">
                              Начать
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
                  Как пользоваться тренажёром
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
                      Выберите модуль
                    </div>
                    <p className="text-muted-foreground">20 модулей: от ВВП до теории игр и налогов.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
                      Решайте задачи
                    </div>
                    <p className="text-muted-foreground">Ползунки, графики, формулы — всё интерактивно.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
                      Изучайте теорию
                    </div>
                    <p className="text-muted-foreground">Формулы и пояснения для закрепления материала.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
                      Зарабатывайте XP
                    </div>
                    <p className="text-muted-foreground">Каждая тренировка приносит XP и повышает уровень.</p>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">5</span>
                      Отслеживайте прогресс
                    </div>
                    <p className="text-muted-foreground">Бейджи, уровень и статистика во вкладке &laquo;Достижения&raquo;.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conditionally render only the active module (performance) */}
          {ActiveModule && <TabsContent value={activeTab}><ActiveModule /></TabsContent>}
        </Tabs>
      </main>

      {/* Footer with dynamic stats */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Экономический тренажёр v7.0 — интерактивная платформа для изучения экономики
          {totalXP > 0 && (
            <span className="hidden sm:inline"> • {totalXP.toLocaleString('ru-RU')} XP • {exploredCount}/21 модуль</span>
          )}
          <span className="hidden sm:inline"> • Автор: Дуплей М.И.</span>
        </div>
      </footer>
    </div>
  )
}
