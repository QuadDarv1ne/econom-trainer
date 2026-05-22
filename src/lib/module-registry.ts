import type React from 'react'
import dynamic from 'next/dynamic'
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
  Globe,
  Target,
  Trophy,
  TrendingDown,
  Scale,
  Swords,
  Receipt,
  Building2,
  Coins,
  AlertTriangle,
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
const PriceIndices = dynamic(() => import('@/components/economics/price-indices').then(m => ({ default: m.PriceIndices })), { ssr: false })
const EconomicCrises = dynamic(() => import('@/components/economics/economic-crises').then(m => ({ default: m.EconomicCrises })), { ssr: false })
const MonetaryPolicy = dynamic(() => import('@/components/economics/monetary-policy').then(m => ({ default: m.MonetaryPolicy })), { ssr: false })
const ADASModel = dynamic(() => import('@/components/economics/adas-model').then(m => ({ default: m.ADASModel })), { ssr: false })
export const ThemeToggle = dynamic(() => import('@/components/economics/theme-toggle').then(m => ({ default: m.ThemeToggle })), { ssr: false })

export interface ModuleDefinition {
  id: string
  titleKey: string
  descriptionKey: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  categoryKey: string
  catId: string
  xpReward: number
}

export interface TabItem {
  value: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
  catId: string | null
}

export const modules: ModuleDefinition[] = [
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
  { id: 'price-indices', titleKey: 'module.price-indices.title', descriptionKey: 'module.price-indices.description', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15 },
  { id: 'economic-crises', titleKey: 'module.economic-crises.title', descriptionKey: 'module.economic-crises.description', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25 },
  { id: 'monetary-policy', titleKey: 'module.monetary-policy.title', descriptionKey: 'module.monetary-policy.description', icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25 },
  { id: 'adas', titleKey: 'module.adas.title', descriptionKey: 'module.adas.description', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20 },
  { id: 'quiz', titleKey: 'module.quiz.title', descriptionKey: 'module.quiz.description', icon: Brain, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', categoryKey: 'home.modcat.tests', catId: 'tools', xpReward: 10 },
  { id: 'currency', titleKey: 'module.currency.title', descriptionKey: 'module.currency.description', icon: Coins, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 15 },
  { id: 'finance', titleKey: 'module.finance.title', descriptionKey: 'module.finance.description', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 20 },
  { id: 'glossary', titleKey: 'module.glossary.title', descriptionKey: 'module.glossary.description', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.reference', catId: 'tools', xpReward: 5 },
  { id: 'achievements', titleKey: 'module.achievements.title', descriptionKey: 'module.achievements.description', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', categoryKey: 'home.modcat.motivation', catId: 'tools', xpReward: 0 },
  { id: 'progress', titleKey: 'module.progress.title', descriptionKey: 'module.progress.description', icon: BarChart3, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', categoryKey: 'home.modcat.analytics', catId: 'tools', xpReward: 0 },
]

export const tabItems: TabItem[] = [
  { value: 'home', icon: GraduationCap, labelKey: 'home.tab.home', catId: null },
  { value: 'gdp', icon: Calculator, labelKey: 'home.tab.gdp', catId: 'macro' },
  { value: 'keynesian', icon: Crosshair, labelKey: 'home.tab.keynesian', catId: 'macro' },
  { value: 'inflation', icon: Landmark, labelKey: 'home.tab.inflation', catId: 'macro' },
  { value: 'phillips', icon: TrendingDown, labelKey: 'home.tab.phillips', catId: 'macro' },
  { value: 'lorenz', icon: Scale, labelKey: 'home.tab.lorenz', catId: 'macro' },
  { value: 'is-lm', icon: Landmark, labelKey: 'home.tab.islm', catId: 'macro' },
  { value: 'supply-demand', icon: ArrowRightLeft, labelKey: 'home.tab.supplyDemand', catId: 'micro' },
  { value: 'elasticity', icon: Gauge, labelKey: 'home.tab.elasticity', catId: 'micro' },
  { value: 'ppf', icon: ArrowLeftRight, labelKey: 'home.tab.ppf', catId: 'micro' },
  { value: 'costs', icon: BarChart3, labelKey: 'home.tab.costs', catId: 'micro' },
  { value: 'comparative', icon: Globe, labelKey: 'home.tab.comparative', catId: 'micro' },
  { value: 'game-theory', icon: Swords, labelKey: 'home.tab.gameTheory', catId: 'micro' },
  { value: 'market-structures', icon: Building2, labelKey: 'home.tab.marketStructures', catId: 'micro' },
  { value: 'price-indices', icon: TrendingUp, labelKey: 'home.tab.priceIndices', catId: 'macro' },
  { value: 'economic-crises', icon: AlertTriangle, labelKey: 'home.tab.economicCrises', catId: 'macro' },
  { value: 'monetary-policy', icon: Landmark, labelKey: 'home.tab.monetaryPolicy', catId: 'macro' },
  { value: 'adas', icon: TrendingUp, labelKey: 'home.tab.adas', catId: 'macro' },
  { value: 'breakeven', icon: Target, labelKey: 'home.tab.breakeven', catId: 'finance' },
  { value: 'tax', icon: Receipt, labelKey: 'home.tab.tax', catId: 'finance' },
  { value: 'currency', icon: Coins, labelKey: 'home.tab.currency', catId: 'finance' },
  { value: 'finance', icon: DollarSign, labelKey: 'home.tab.finance', catId: 'finance' },
  { value: 'quiz', icon: Brain, labelKey: 'home.tab.quiz', catId: 'tools' },
  { value: 'glossary', icon: BookOpen, labelKey: 'home.tab.glossary', catId: 'tools' },
  { value: 'achievements', icon: Trophy, labelKey: 'home.tab.achievements', catId: 'tools' },
  { value: 'progress', icon: BarChart3, labelKey: 'home.tab.progress', catId: 'tools' },
]

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3 },
  }),
}

export const moduleComponents: Record<string, React.ComponentType> = {
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
  'economic-crises': EconomicCrises,
  'monetary-policy': MonetaryPolicy,
  'adas': ADASModel,
  'quiz': EconomicsQuiz,
  'finance': FinancialMath,
  'glossary': Glossary,
  'achievements': Achievements,
  'progress': ProgressTracker,
}

export const categoryBreaks = new Set(['gdp', 'supply-demand', 'breakeven', 'quiz'])
