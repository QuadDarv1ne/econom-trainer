'use client'

import { useState, useMemo, useRef, memo, useEffect, type ElementType } from 'react'
import { useDebounce } from '@/hooks/use-auto-dismiss'
import { useI18n } from '@/lib/i18n-provider'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpen, Search, X, Microscope, Globe, Landmark, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

type GlossaryCategory = 'micro' | 'macro' | 'finance' | 'international'

interface GlossaryTermKey {
  id: string
  category: GlossaryCategory
}

const glossaryTermKeys: GlossaryTermKey[] = [
  { id: 'gdp', category: 'macro' },
  { id: 'gdpDeflator', category: 'macro' },
  { id: 'priceElasticity', category: 'micro' },
  { id: 'multiplier', category: 'macro' },
  { id: 'mpc', category: 'macro' },
  { id: 'npv', category: 'finance' },
  { id: 'phillipsCurve', category: 'macro' },
  { id: 'equilibriumPrice', category: 'micro' },
  { id: 'ppp', category: 'international' },
  { id: 'diminishingUtility', category: 'micro' },
  { id: 'fisherEquation', category: 'finance' },
  { id: 'compoundInterest', category: 'finance' },
  { id: 'consumerSurplus', category: 'micro' },
  { id: 'multiplierEffect', category: 'macro' },
  { id: 'incomeElasticity', category: 'micro' },
  { id: 'seigniorage', category: 'macro' },
  { id: 'comparativeAdvantage', category: 'international' },
  { id: 'breakeven', category: 'finance' },
  { id: 'contributionMargin', category: 'finance' },
  { id: 'lorenzCurve', category: 'macro' },
  { id: 'balancedBudget', category: 'macro' },
  { id: 'marginOfSafety', category: 'finance' },
  { id: 'crowdingOut', category: 'macro' },
  { id: 'opportunityCost', category: 'micro' },
  { id: 'okunLaw', category: 'macro' },
  { id: 'islm', category: 'macro' },
  { id: 'taylorRule', category: 'macro' },
  { id: 'marketFailures', category: 'micro' },
  { id: 'nashEquilibrium', category: 'micro' },
  { id: 'substitutionEffect', category: 'micro' },
  { id: 'shutdownPoint', category: 'micro' },
  { id: 'prisonersDilemma', category: 'micro' },
  { id: 'perfectCompetition', category: 'micro' },
  { id: 'monopolisticCompetition', category: 'micro' },
  { id: 'oligopoly', category: 'micro' },
  { id: 'ess', category: 'micro' },
  { id: 'incomeEffect', category: 'micro' },
  { id: 'hhi', category: 'micro' },
  { id: 'goodwill', category: 'finance' },
  { id: 'irr', category: 'finance' },
]

const categoryKeys = ['glossary.all', 'glossary.cat.micro', 'glossary.cat.macro', 'glossary.cat.finance', 'glossary.cat.international'] as const

const categoryValueMap: Record<string, GlossaryCategory> = {
  'glossary.cat.micro': 'micro',
  'glossary.cat.macro': 'macro',
  'glossary.cat.finance': 'finance',
  'glossary.cat.international': 'international',
}

const categoryConfig: Record<string, { icon: ElementType; gradient: string; badgeBg: string; badgeColor: string }> = {
  micro: { icon: Microscope, gradient: 'from-orange-500 to-red-500', badgeBg: 'bg-orange-50 dark:bg-orange-950/30', badgeColor: 'text-orange-600 dark:text-orange-400' },
  macro: { icon: Landmark, gradient: 'from-blue-500 to-cyan-500', badgeBg: 'bg-blue-50 dark:bg-blue-950/30', badgeColor: 'text-blue-600 dark:text-blue-400' },
  finance: { icon: DollarSign, gradient: 'from-green-500 to-emerald-500', badgeBg: 'bg-green-50 dark:bg-green-950/30', badgeColor: 'text-green-600 dark:text-green-400' },
  international: { icon: Globe, gradient: 'from-purple-500 to-pink-500', badgeBg: 'bg-purple-50 dark:bg-purple-950/30', badgeColor: 'text-purple-600 dark:text-purple-400' },
}

export const Glossary = memo(function Glossary() {
  const { t, locale } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 200)
  const [activeCategory, setActiveCategory] = useState<string>('glossary.all')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)
  const hasEarnedXPRef = useRef(false)

  const glossaryData = useMemo(
    () =>
      glossaryTermKeys.map((key) => ({
        id: key.id,
        term: t(`glossary.term.${key.id}`),
        definition: t(`glossary.def.${key.id}`),
        category: key.category,
        formula: t(`glossary.formula.${key.id}`),
        hasFormula: t(`glossary.formula.${key.id}`) !== `glossary.formula.${key.id}`,
      })),
    [t]
  )

  const filteredTerms = useMemo(() => {
    const activeValue = activeCategory === 'glossary.all' ? null : categoryValueMap[activeCategory]
    const query = debouncedSearch.toLowerCase().trim()
    return glossaryData
      .filter((item) => {
        const matchesCategory = activeValue === null || item.category === activeValue
        const matchesSearch =
          query === '' ||
          item.term.toLowerCase().includes(query) ||
          item.definition.toLowerCase().includes(query)
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => a.term.localeCompare(b.term, locale === 'ru' ? 'ru' : locale === 'zh' ? 'zh' : 'en'))
  }, [debouncedSearch, activeCategory, glossaryData, locale])

  const getCategoryConfig = (cat: string) => categoryConfig[cat] || categoryConfig.macro

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
            {t('glossary.title')}
          </CardTitle>
          <CardDescription>
            {glossaryData.length} {t('glossary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="glossary-search"
                aria-label={t('glossary.searchPlaceholder')}
                placeholder={t('glossary.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={t('glossary.clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <motion.div className="flex flex-wrap gap-2" role="group" aria-label={t('glossary.categories')}>
            {categoryKeys.map((key) => {
              const isActive = activeCategory === key
              const catId = categoryValueMap[key]
              const catConf = catId ? getCategoryConfig(catId) : null
              return (
                <motion.button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : catConf
                        ? `${catConf.badgeBg} ${catConf.badgeColor} border border-transparent hover:border-current`
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                  aria-pressed={isActive}
                >
                  {catConf && !isActive && <catConf.icon className="h-3.5 w-3.5" />}
                  {t(key)}
                </motion.button>
              )
            })}
          </motion.div>

          <div className="text-sm text-muted-foreground">
            {t('glossary.found')}: {filteredTerms.length} {filteredTerms.length === 1 ? t('glossary.termSingular') : t('glossary.termPlural')}
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full" onValueChange={(value) => {
        if (value.length > 0 && !hasEarnedXPRef.current) {
          hasEarnedXPRef.current = true
          addModuleInteraction({ moduleId: 'glossary', action: 'view', xpEarned: MODULE_XP['glossary'] })
        }
      }}>
        {filteredTerms.map((item, i) => {
          const catConf = getCategoryConfig(item.category)
          const CatIcon = catConf.icon
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02, duration: 0.2 }}
            >
              <AccordionItem value={`term-${item.id}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant="outline" className={`shrink-0 text-xs border-0 ${catConf.badgeBg} ${catConf.badgeColor}`}>
                      <CatIcon className="h-3 w-3 mr-1" />
                      {t(`glossary.cat.${item.category}`)}
                    </Badge>
                    <span className="font-medium">{item.term}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <p className="text-sm leading-relaxed">{item.definition}</p>
                    {item.hasFormula && (
                      <div className="p-3 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                        {item.formula}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          )
        })}
      </Accordion>

      {filteredTerms.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">{t('glossary.noResults')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
})
