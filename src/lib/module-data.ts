// Static module metadata for server-side rendering (no React/lucide imports)
// This file is safe to import from Server Components

export interface ModuleMeta {
  id: string
  titleKey: string
  descriptionKey: string
  color: string
  bg: string
  categoryKey: string
  catId: string
  xpReward: number
  public: boolean
}

export interface TabMeta {
  value: string
  labelKey: string
  catId: string | null
}

export const modules: ModuleMeta[] = [
  { id: 'gdp', titleKey: 'module.gdp.title', descriptionKey: 'module.gdp.description', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15, public: true },
  { id: 'supply-demand', titleKey: 'module.supply-demand.title', descriptionKey: 'module.supply-demand.description', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15, public: true },
  { id: 'elasticity', titleKey: 'module.elasticity.title', descriptionKey: 'module.elasticity.description', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15, public: true },
  { id: 'keynesian', titleKey: 'module.keynesian.title', descriptionKey: 'module.keynesian.description', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20, public: true },
  { id: 'inflation', titleKey: 'module.inflation.title', descriptionKey: 'module.inflation.description', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15, public: true },
  { id: 'phillips', titleKey: 'module.phillips.title', descriptionKey: 'module.phillips.description', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20, public: true },
  { id: 'lorenz', titleKey: 'module.lorenz.title', descriptionKey: 'module.lorenz.description', color: 'text-amber-700', bg: 'bg-amber-50 dark:bg-amber-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20, public: true },
  { id: 'is-lm', titleKey: 'module.is-lm.title', descriptionKey: 'module.is-lm.description', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25, public: true },
  { id: 'ppf', titleKey: 'module.ppf.title', descriptionKey: 'module.ppf.description', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15, public: true },
  { id: 'costs', titleKey: 'module.costs.title', descriptionKey: 'module.costs.description', color: 'text-blue-700', bg: 'bg-blue-50 dark:bg-blue-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 20, public: true },
  { id: 'comparative', titleKey: 'module.comparative.title', descriptionKey: 'module.comparative.description', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 15, public: false },
  { id: 'breakeven', titleKey: 'module.breakeven.title', descriptionKey: 'module.breakeven.description', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30', categoryKey: 'home.modcat.financeAnalysis', catId: 'finance', xpReward: 15, public: false },
  { id: 'tax', titleKey: 'module.tax.title', descriptionKey: 'module.tax.description', color: 'text-lime-600', bg: 'bg-lime-50 dark:bg-lime-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 20, public: false },
  { id: 'game-theory', titleKey: 'module.game-theory.title', descriptionKey: 'module.game-theory.description', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 20, public: false },
  { id: 'market-structures', titleKey: 'module.market-structures.title', descriptionKey: 'module.market-structures.description', color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', categoryKey: 'home.modcat.micro', catId: 'micro', xpReward: 25, public: false },
  { id: 'price-indices', titleKey: 'module.price-indices.title', descriptionKey: 'module.price-indices.description', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 15, public: false },
  { id: 'economic-crises', titleKey: 'module.economic-crises.title', descriptionKey: 'module.economic-crises.description', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25, public: false },
  { id: 'monetary-policy', titleKey: 'module.monetary-policy.title', descriptionKey: 'module.monetary-policy.description', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 25, public: false },
  { id: 'adas', titleKey: 'module.adas.title', descriptionKey: 'module.adas.description', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', categoryKey: 'home.modcat.macro', catId: 'macro', xpReward: 20, public: false },
  { id: 'quiz', titleKey: 'module.quiz.title', descriptionKey: 'module.quiz.description', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', categoryKey: 'home.modcat.tests', catId: 'tools', xpReward: 10, public: false },
  { id: 'currency', titleKey: 'module.currency.title', descriptionKey: 'module.currency.description', color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 15, public: false },
  { id: 'finance', titleKey: 'module.finance.title', descriptionKey: 'module.finance.description', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', categoryKey: 'home.modcat.finance', catId: 'finance', xpReward: 20, public: false },
  { id: 'glossary', titleKey: 'module.glossary.title', descriptionKey: 'module.glossary.description', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', categoryKey: 'home.modcat.reference', catId: 'tools', xpReward: 5, public: false },
  { id: 'achievements', titleKey: 'module.achievements.title', descriptionKey: 'module.achievements.description', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', categoryKey: 'home.modcat.motivation', catId: 'tools', xpReward: 0, public: false },
  { id: 'progress', titleKey: 'module.progress.title', descriptionKey: 'module.progress.description', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', categoryKey: 'home.modcat.analytics', catId: 'tools', xpReward: 0, public: false },
]

export const tabItems: TabMeta[] = [
  { value: 'home', labelKey: 'home.tab.home', catId: null },
  { value: 'gdp', labelKey: 'home.tab.gdp', catId: 'macro' },
  { value: 'keynesian', labelKey: 'home.tab.keynesian', catId: 'macro' },
  { value: 'inflation', labelKey: 'home.tab.inflation', catId: 'macro' },
  { value: 'phillips', labelKey: 'home.tab.phillips', catId: 'macro' },
  { value: 'lorenz', labelKey: 'home.tab.lorenz', catId: 'macro' },
  { value: 'is-lm', labelKey: 'home.tab.islm', catId: 'macro' },
  { value: 'supply-demand', labelKey: 'home.tab.supplyDemand', catId: 'micro' },
  { value: 'elasticity', labelKey: 'home.tab.elasticity', catId: 'micro' },
  { value: 'ppf', labelKey: 'home.tab.ppf', catId: 'micro' },
  { value: 'costs', labelKey: 'home.tab.costs', catId: 'micro' },
  { value: 'comparative', labelKey: 'home.tab.comparative', catId: 'micro' },
  { value: 'game-theory', labelKey: 'home.tab.gameTheory', catId: 'micro' },
  { value: 'market-structures', labelKey: 'home.tab.marketStructures', catId: 'micro' },
  { value: 'price-indices', labelKey: 'home.tab.priceIndices', catId: 'macro' },
  { value: 'economic-crises', labelKey: 'home.tab.economicCrises', catId: 'macro' },
  { value: 'monetary-policy', labelKey: 'home.tab.monetaryPolicy', catId: 'macro' },
  { value: 'adas', labelKey: 'home.tab.adas', catId: 'macro' },
  { value: 'breakeven', labelKey: 'home.tab.breakeven', catId: 'finance' },
  { value: 'tax', labelKey: 'home.tab.tax', catId: 'finance' },
  { value: 'currency', labelKey: 'home.tab.currency', catId: 'finance' },
  { value: 'finance', labelKey: 'home.tab.finance', catId: 'finance' },
  { value: 'quiz', labelKey: 'home.tab.quiz', catId: 'tools' },
  { value: 'glossary', labelKey: 'home.tab.glossary', catId: 'tools' },
  { value: 'achievements', labelKey: 'home.tab.achievements', catId: 'tools' },
  { value: 'progress', labelKey: 'home.tab.progress', catId: 'tools' },
]

export const categoryBreaks = new Set(['gdp', 'supply-demand', 'breakeven', 'quiz'])
