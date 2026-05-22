'use client'

import { useState, useMemo, useRef } from 'react'
import { useI18n } from '@/lib/i18n-provider'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpen, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export function Glossary() {
  const { t, locale } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('glossary.all')

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
    return glossaryData
      .filter((item) => {
        const matchesCategory = activeValue === null || item.category === activeValue
        const matchesSearch =
          searchQuery === '' ||
          item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.definition.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => a.term.localeCompare(b.term, locale === 'ru' ? 'ru' : locale === 'zh' ? 'zh' : 'en'))
  }, [searchQuery, activeCategory, glossaryData, locale])

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'micro': return 'default'
      case 'macro': return 'secondary'
      case 'finance': return 'outline'
      case 'international': return 'destructive'
      default: return 'secondary'
    }
  }

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
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('glossary.categories')}>
            {categoryKeys.map((key) => (
              <Button
                key={key}
                variant={activeCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(key)}
                aria-pressed={activeCategory === key}
              >
                {t(key)}
              </Button>
            ))}
          </div>

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
        {filteredTerms.map((item) => (
          <AccordionItem key={item.id} value={`term-${item.id}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Badge variant={getCategoryColor(item.category) as "default" | "secondary" | "outline" | "destructive"} className="shrink-0 text-xs">
                  {t(`glossary.cat.${item.category}`)}
                </Badge>
                <span className="font-medium">{item.term}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                <p className="text-sm leading-relaxed">{item.definition}</p>
                {item.hasFormula && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm font-mono">
                    {item.formula}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
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
}
