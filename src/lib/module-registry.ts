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
import { modules as baseModules, tabItems as baseTabItems, categoryBreaks as baseCategoryBreaks } from '@/lib/module-data'
export type { ModuleMeta as ModuleDefinition, TabMeta as TabItem } from '@/lib/module-data'
export { modules, tabItems, categoryBreaks } from '@/lib/module-data'

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

// Icon map for client-side module rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'gdp': Calculator,
  'supply-demand': ArrowRightLeft,
  'elasticity': Gauge,
  'keynesian': Crosshair,
  'inflation': Landmark,
  'phillips': TrendingDown,
  'lorenz': Scale,
  'is-lm': Landmark,
  'ppf': ArrowLeftRight,
  'costs': BarChart3,
  'comparative': Globe,
  'breakeven': Target,
  'tax': Receipt,
  'game-theory': Swords,
  'market-structures': Building2,
  'price-indices': TrendingUp,
  'economic-crises': AlertTriangle,
  'monetary-policy': Landmark,
  'adas': TrendingUp,
  'quiz': Brain,
  'currency': Coins,
  'finance': DollarSign,
  'glossary': BookOpen,
  'achievements': Trophy,
  'progress': BarChart3,
}

// Tab icon map
const tabIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'home': GraduationCap,
  'gdp': Calculator,
  'keynesian': Crosshair,
  'inflation': Landmark,
  'phillips': TrendingDown,
  'lorenz': Scale,
  'is-lm': Landmark,
  'supply-demand': ArrowRightLeft,
  'elasticity': Gauge,
  'ppf': ArrowLeftRight,
  'costs': BarChart3,
  'comparative': Globe,
  'game-theory': Swords,
  'market-structures': Building2,
  'price-indices': TrendingUp,
  'economic-crises': AlertTriangle,
  'monetary-policy': Landmark,
  'adas': TrendingUp,
  'breakeven': Target,
  'tax': Receipt,
  'currency': Coins,
  'finance': DollarSign,
  'quiz': Brain,
  'glossary': BookOpen,
  'achievements': Trophy,
  'progress': BarChart3,
}

// Enriched modules with icons (client-side only)
export const modulesWithIcons = baseModules.map(m => ({
  ...m,
  icon: iconMap[m.id] ?? GraduationCap,
}))

// Enriched tab items with icons (client-side only)
export const tabItemsWithIcons = baseTabItems.map(t => ({
  ...t,
  icon: tabIconMap[t.value] ?? GraduationCap,
}))

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
