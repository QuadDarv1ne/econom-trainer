'use client'

import { useState, useMemo } from 'react'
import { useI18n } from '@/lib/i18n-provider'
import { useEconomicsStore, MODULE_XP } from '@/store/economics-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BookOpen, Search } from 'lucide-react'

interface GlossaryTerm {
  term: string
  definition: string
  category: 'micro' | 'macro' | 'finance' | 'international'
  formula?: string
}

const glossaryData: GlossaryTerm[] = [
  {
    term: 'Валовой внутренний продукт (ВВП)',
    definition: 'Совокупная рыночная стоимость всех конечных товаров и услуг, произведённых на территории страны за определённый период времени (обычно за год). Не включает промежуточные товары, чтобы избежать двойного счёта.',
    category: 'macro',
    formula: 'ВВП = C + I + G + NX',
  },
  {
    term: 'Дефлятор ВВП',
    definition: 'Индекс, отражающий изменение уровня цен на все товары и услуги, входящие в состав ВВП. Рассчитывается как отношение номинального ВВП к реальному ВВП, умноженное на 100. В отличие от ИПЦ, учитывает все товары, а не только потребительскую корзину.',
    category: 'macro',
    formula: 'Дефлятор = (Номинальный ВВП / Реальный ВВП) × 100%',
  },
  {
    term: 'Эластичность спроса по цене',
    definition: 'Показатель, отражающий степень чувствительности объёма спроса к изменению цены товара. Измеряется как процентное изменение объёма спроса, делённое на процентное изменение цены. Если |Ed| > 1, спрос эластичен; если |Ed| < 1 — неэластичен.',
    category: 'micro',
    formula: 'Ed = (ΔQ/Q) / (ΔP/P)',
  },
  {
    term: 'Мультипликатор автономных расходов',
    definition: 'Коэффициент, показывающий, во сколько раз итоговое изменение равновесного ВВП превышает первоначальное изменение автономных расходов. Возникает из-за того, что одни расходы становятся доходами других экономических агентов.',
    category: 'macro',
    formula: 'k = 1 / (1 - MPC)',
  },
  {
    term: 'Предельная склонность к потреблению (MPC)',
    definition: 'Доля дополнительного дохода, которую домашние хозяйства тратят на потребление. Например, MPC = 0.75 означает, что из каждого дополнительного рубля дохода 75 копеек тратится на потребление, а 25 копеек — сберегается.',
    category: 'macro',
    formula: 'MPC = ΔC / ΔY',
  },
  {
    term: 'Чистая приведённая стоимость (NPV)',
    definition: 'Сумма дисконтированных денежных потоков инвестиционного проекта за вычетом первоначальных инвестиций. Если NPV > 0, проект прибыльный; если NPV < 0 — убыточный. Используется для оценки целесообразности инвестиций.',
    category: 'finance',
    formula: 'NPV = -I₀ + Σ(CFt / (1+r)^t)',
  },
  {
    term: 'Кривая Филлипса',
    definition: 'Эмпирическая зависимость между уровнем безработицы и темпом инфляции. В краткосрочном периоде показывает обратную связь: более низкой безработице соответствует более высокая инфляция, и наоборот. В долгосрочном периоде кривая вертикальна.',
    category: 'macro',
  },
  {
    term: 'Равновесная цена',
    definition: 'Цена, при которой объём спроса равен объёму предложения на рынке. В точке равновесия нет ни дефицита, ни излишка товара. Рынок стремится к равновесию через механизм ценовой адаптации.',
    category: 'micro',
    formula: 'Qd(P*) = Qs(P*)',
  },
  {
    term: 'Паритет покупательной способности (PPP)',
    definition: 'Теория, согласно которой обменный курс между двумя валютами должен уравнивать стоимость одинаковой корзины товаров в обеих странах. Если корзина стоит 1000 руб. в РФ и $15 в США, то обменный курс PPP = 1000/15 ≈ 66.67 руб./$.',
    category: 'international',
  },
  {
    term: 'Закон убывающей предельной полезности',
    definition: 'Принцип, согласно которому по мере увеличения потребления блага каждая дополнительная единица приносит всё меньший прирост полезности. Объясняет, почему кривая спроса имеет отрицательный наклон, и почему потребители стремятся к разнообразию.',
    category: 'micro',
  },
  {
    term: 'Уравнение Фишера',
    definition: 'Связывает номинальную и реальную процентные ставки с уровнем инфляции. В точной форме: (1+i) = (1+r)(1+π). Приближённо: i ≈ r + π. Позволяет определить реальную доходность сбережений с учётом обесценения денег.',
    category: 'finance',
    formula: '(1+i) = (1+r)(1+π)',
  },
  {
    term: 'Сложный процент',
    definition: 'Метод начисления процентов, при котором проценты начисляются не только на первоначальную сумму, но и на ранее начисленные проценты. Приводит к экспоненциальному росту капитала. Частота начисления (ежегодно, ежемесячно) влияет на итоговую сумму.',
    category: 'finance',
    formula: 'FV = PV × (1 + r/n)^(n×t)',
  },
  {
    term: 'Излишек потребителя',
    definition: 'Разница между максимальной суммой, которую потребитель готов заплатить за товар, и его фактической рыночной ценой. На графике — площадь между кривой спроса и линией равновесной цены. Меряет благосостояние потребителей.',
    category: 'micro',
  },
  {
    term: 'Эффект мультипликатора',
    definition: 'Явление, при котором первоначальное изменение автономных расходов вызывает большее итоговое изменение равновесного ВВП. Происходит из-за цепной реакции: расходы одних становятся доходами других, порождая дополнительные раунды потребления.',
    category: 'macro',
    formula: 'ΔY = k × ΔA, где k = 1/(1-MPC)',
  },
  {
    term: 'Эластичность спроса по доходу',
    definition: 'Показатель чувствительности спроса к изменению дохода потребителя. Позволяет классифицировать товары: если Ey > 1 — предмет роскоши, 0 < Ey < 1 — нормальный товар, Ey < 0 — низший товар.',
    category: 'micro',
    formula: 'Ey = (ΔQ/Q) / (ΔY/Y)',
  },
  {
    term: 'Сеньораж',
    definition: 'Доход государства от эмиссии денег. Представляет собой разницу между номинальной стоимостью выпущенных денег и затратами на их производство. В современных условиях обычно невелик, но при гиперинфляции может стать значительным источником дохода бюджета.',
    category: 'macro',
  },
  {
    term: 'Сравнительное преимущество',
    definition: 'Способность страны производить товар с меньшими альтернативными издержками, чем другая страна. Согласно теории Д. Рикардо, даже если страна не имеет абсолютного преимущества ни в одном товаре, она всё равно может выиграть от торговли, специализируясь на товаре с меньшими альтернативными издержками.',
    category: 'international',
    formula: 'OC(A) = Затраты на A / Затраты на B',
  },
  {
    term: 'Точка безубыточности (BEP)',
    definition: 'Минимальный объём продаж, при котором выручка покрывает все затраты (постоянные и переменные). В точке безубыточности прибыль равна нулю. Используется в CVP-анализе для оценки рисков и планирования производства.',
    category: 'finance',
    formula: 'BEP = FC / (P - VC)',
  },
  {
    term: 'Маржинальная прибыль',
    definition: 'Разница между выручкой от реализации и переменными затратами. Показывает вклад каждого проданного изделия в покрытие постоянных затрат и формирование прибыли. Может рассчитываться на единицу продукции или на весь объём.',
    category: 'finance',
    formula: 'CM = P - VC (на ед.) или CM = TR - TVC (на объём)',
  },
  {
    term: 'Кривая Лоренца',
    definition: 'Графическое изображение распределения доходов в обществе. По горизонтальной оси — доля населения (от бедных к богатым), по вертикальной — доля дохода. Линия абсолютного равенства — биссектриса. Чем больше кривая отклоняется от биссектрисы, тем выше неравенство.',
    category: 'macro',
  },
  {
    term: 'Мультипликатор сбалансированного бюджета',
    definition: 'Показывает, что одновременное равное увеличение государственных расходов и налогов приводит к росту ВВП. Это происходит потому, что мультипликатор гос. расходов (1/(1-MPC)) больше мультипликатора налогов (MPC/(1-MPC)). Рост ВВП равен величине изменения G или T.',
    category: 'macro',
    formula: 'ΔY = ΔG = ΔT (при ΔG = ΔT)',
  },
  {
    term: 'Запас прочности (Margin of Safety)',
    definition: 'Показатель финансовой устойчивости предприятия — разница между фактическим (или планируемым) объёмом продаж и точкой безубыточности, выраженная в процентах. Чем выше запас прочности, тем меньше риск получения убытка при снижении спроса.',
    category: 'finance',
    formula: 'MoS = (Фактический объём - BEP) / Фактический объём × 100%',
  },
  {
    term: 'Эффект вытеснения',
    definition: 'Снижение частных инвестиций в результате увеличения государственных расходов. Происходит через рост процентных ставок: правительство занимает на рынке, увеличивая спрос на кредиты, что повышает ставку и делает инвестиции менее выгодными для частного сектора.',
    category: 'macro',
  },
  {
    term: 'Альтернативные издержки',
    definition: 'Ценность лучшего из отвергнутых вариантов использования ресурсов. Включают как явные (бухгалтерские) затраты, так и неявные (упущенная выгода). Концепция лежит в основе экономического мышления: любой выбор подразумевает отказ от альтернативы.',
    category: 'micro',
    formula: 'OC = Явные затраты + Неявные затраты',
  },
  {
    term: 'Закон Оукена',
    definition: 'Эмпирическая зависимость между отклонением фактической безработицы от естественного уровня и потерями ВВП. Каждый процент превышения безработицы над естественным уровнем соответствует примерно 2-3% потерь реального ВВП относительно потенциального.',
    category: 'macro',
    formula: '(Y - Y*) / Y* = -β × (u - u*)',
  },
  {
    term: 'Модель IS-LM',
    definition: 'Макроэкономическая модель, описывающая одновременное равновесие на товарном (кривая IS) и денежном (кривая LM) рынках. Кривая IS показывает комбинации ставки процента и дохода, при которых инвестиции равны сбережениям. LM — спрос на деньги равен их предложению.',
    category: 'macro',
  },
  {
    term: 'Правило Тейлора',
    definition: 'Эмпирическое правило монетарной политики, предписывающее ЦБ устанавливать ключевую ставку в зависимости от отклонения инфляции от целевого уровня и разрыва ВВП. Позволяет сделать политику более предсказуемой и прозрачной.',
    category: 'macro',
    formula: 'i = r* + π + 0.5(π - π*) + 0.5(y - y*)',
  },
  {
    term: 'Провалы рынка',
    definition: 'Ситуации, когда рыночный механизм не обеспечивает Парето-эффективное распределение ресурсов. Основные типы: внешние эффекты (экстерналии), общественные блага, асимметрия информации, рыночная власть (монополии). Требуют государственного вмешательства.',
    category: 'micro',
  },
  {
    term: 'Равновесие Нэша',
    definition: 'Ситуация в игре, при которой ни один игрок не может увеличить свой выигрыш, изменив стратегию в одностороннем порядке, пока другие игроки сохраняют свои стратегии. Не обязательно совпадает с Парето-оптимальным исходом (дилемма заключённого).',
    category: 'micro',
  },
  {
    term: 'Эффект замещения',
    definition: 'Изменение структуры потребления в результате изменения относительных цен товаров. При росте цены товара потребитель замещает его относительно более дешёвыми альтернативами. Вместе с эффектом дохода формирует общий эффект изменения цены.',
    category: 'micro',
  },
  {
    term: 'Точка закрытия фирмы',
    definition: 'Минимальный уровень цены, при котором фирма покрывает средние переменные издержки (AVC). Если рыночная цена падает ниже минимума AVC, фирма минимизирует убытки, прекратив производство в краткосрочном периоде.',
    category: 'micro',
    formula: 'P < min(AVC) → закрытие',
  },
  {
    term: 'Дилемма заключённого',
    definition: 'Классическая задача теории игр, демонстрирующая конфликт индивидуальной и коллективной рациональности. Равновесие Нэша — взаимное предательство, хотя взаимное сотрудничество дало бы лучший результат для обоих.',
    category: 'micro',
  },
  {
    term: 'Совершенная конкуренция',
    definition: 'Рыночная структура, при которой множество продавцов предлагают однородный продукт, отсутствуют барьеры входа и выхода, полная информация. Ни один продавец не может влиять на рыночную цену. Фирма — ценополучатель (price taker).',
    category: 'micro',
  },
  {
    term: 'Монополистическая конкуренция',
    definition: 'Рыночная структура с большим числом продавцов, дифференцированным продуктом и свободным входом. Фирмы обладают ограниченной рыночной властью за счёт дифференциации. В долгосрочном периоде экономическая прибыль равна нулю.',
    category: 'micro',
  },
  {
    term: 'Олигополия',
    definition: 'Рыночная структура, при которой несколько крупных фирм контролируют основную долю рынка. Характеризуется взаимозависимостью решений, стратегическим поведением и высокими барьерами входа. Модели: Курно, Бертран, Штакельберг.',
    category: 'micro',
  },
  {
    term: 'Эволюционно стабильная стратегия (ESS)',
    definition: 'Стратегия в эволюционной теории игр, которую популяция использует и которая не может быть вытеснена альтернативной стратегией при малой мутации. В модели «Ястребы и Голуби» смешанная ESS: доля ястребов = V/C.',
    category: 'micro',
    formula: 'p* = V / C',
  },
  {
    term: 'Эффект дохода',
    definition: 'Изменение реальной покупательной способности потребителя при изменении цены товара. При снижении цены реальный доход растёт, что позволяет купить больше всех товаров (включая данный). Для нормальных товаров эффект дохода положителен, для низших — отрицателен.',
    category: 'micro',
  },
  {
    term: 'Индекс Герфиндаля-Хиршмана (HHI)',
    definition: 'Показатель концентрации рынка, рассчитываемый как сумма квадратов рыночных долей всех фирм (в процентах). HHI < 1500 — неконцентрированный рынок, 1500-2500 — умеренно концентрированный, > 2500 — высоко концентрированный.',
    category: 'micro',
    formula: 'HHI = Σ(Si)², где Si — доля i-й фирмы',
  },
  {
    term: 'Гудвилл',
    definition: 'Нематериальный актив, возникающий при приобретении компании за сумму, превышающую справедливую стоимость её чистых идентифицируемых активов. Отражает деловую репутацию, бренд, клиентскую базу, квалификацию персонала и другие неучтённые ресурсы.',
    category: 'finance',
  },
  {
    term: 'Внутренняя норма доходности (IRR)',
    definition: 'Ставка дисконтирования, при которой чистая приведённая стоимость (NPV) инвестиционного проекта равна нулю. Если IRR превышает требуемую норму доходности, проект принимается. Используется для ранжирования инвестиционных альтернатив.',
    category: 'finance',
    formula: 'NPV(IRR) = 0',
  },
]

const categoryKeys = ['glossary.all', 'glossary.cat.micro', 'glossary.cat.macro', 'glossary.cat.finance', 'glossary.cat.international'] as const

const categoryValueMap: Record<string, 'micro' | 'macro' | 'finance' | 'international'> = {
  'glossary.all': 'micro', // placeholder, not used
  'glossary.cat.micro': 'micro',
  'glossary.cat.macro': 'macro',
  'glossary.cat.finance': 'finance',
  'glossary.cat.international': 'international',
}

export function Glossary() {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('glossary.all')

  // XP tracking — award once per session on first term expansion
  const [hasEarnedXP, setHasEarnedXP] = useState(false)
  const addModuleInteraction = useEconomicsStore((s) => s.addModuleInteraction)

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
      .sort((a, b) => a.term.localeCompare(b.term, 'ru'))
  }, [searchQuery, activeCategory])

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
            <BookOpen className="h-5 w-5" />
            {t('glossary.title')}
          </CardTitle>
          <CardDescription>
            {glossaryData.length} {t('glossary.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('glossary.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryKeys.map((key) => (
              <Badge
                key={key}
                variant={activeCategory === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveCategory(key)}
              >
                {t(key)}
              </Badge>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {t('glossary.found')}: {filteredTerms.length} {filteredTerms.length === 1 ? t('glossary.termSingular') : t('glossary.termPlural')}
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full" onValueChange={(value) => {
        if (value.length > 0 && !hasEarnedXP) {
          setHasEarnedXP(true)
          addModuleInteraction({ moduleId: 'glossary', action: 'view', xpEarned: MODULE_XP['glossary'] })
        }
      }}>
        {filteredTerms.map((item, index) => (
          <AccordionItem key={item.term} value={`term-${index}`}>
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
                {item.formula && (
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
