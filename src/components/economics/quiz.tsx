'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useEconomicsStore } from '@/store/economics-store'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/lib/i18n-provider'
import { Brain, CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const questions: Question[] = [
  {
    id: 1,
    question: 'Что происходит с равновесной ценой при увеличении спроса при неизменном предложении?',
    options: ['Цена растёт', 'Цена падает', 'Цена не меняется', 'Нельзя определить'],
    correctAnswer: 0,
    explanation: 'При увеличении спроса кривая спроса сдвигается вправо, что при неизменном предложении приводит к росту равновесной цены и увеличению объёма.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 2,
    question: 'Если ЦБ повышает ключевую ставку, что происходит с инвестициями?',
    options: ['Инвестиции растут', 'Инвестиции падают', 'Инвестиции не меняются', 'Зависит от инфляции'],
    correctAnswer: 1,
    explanation: 'Повышение ключевой ставки увеличивает стоимость заимствований, что делает кредиты дороже для бизнеса, поэтому инвестиции снижаются.',
    topic: 'Макроэкономика',
    difficulty: 'easy',
  },
  {
    id: 3,
    question: 'Какой тип безработицы связан с сезонными колебаниями спроса на рабочую силу?',
    options: ['Фрикционная', 'Структурная', 'Сезонная', 'Циклическая'],
    correctAnswer: 2,
    explanation: 'Сезонная безработица возникает из-за сезонных колебаний в спросе на труд, например, в сельском хозяйстве или туризме.',
    topic: 'Макроэкономика',
    difficulty: 'easy',
  },
  {
    id: 4,
    question: 'Что характеризует эластичность спроса по цене |E| > 1?',
    options: [
      'Спрос неэластичен',
      'Спрос эластичен',
      'Спрос единичной эластичности',
      'Спрос абсолютно неэластичен',
    ],
    correctAnswer: 1,
    explanation: 'Когда |E| > 1, процентное изменение объёма спроса превышает процентное изменение цены — спрос эластичен, потребители чувствительны к изменению цены.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 5,
    question: 'Что из перечисленного НЕ входит в ВВП, рассчитанный по расходам?',
    options: ['Потребительские расходы', 'Гос. закупки', 'Трансферты', 'Чистый экспорт'],
    correctAnswer: 2,
    explanation: 'Трансферты (пособия, пенсии) — это перераспределение доходов, а не плата за произведённые товары или услуги, поэтому они не включаются в ВВП по расходам.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 6,
    question: 'Какой мультипликатор больше при MPS = 0.2?',
    options: ['2', '5', '4', '8'],
    correctAnswer: 1,
    explanation: 'Мультипликатор = 1 / MPS = 1 / 0.2 = 5. Это означает, что каждый дополнительный рубль автономных расходов увеличивает ВВП на 5 рублей.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 7,
    question: 'Что описывает кривая Филлипса в краткосрочном периоде?',
    options: [
      'Прямую зависимость инфляции и безработицы',
      'Обратную зависимость инфляции и безработицы',
      'Независимость инфляции от безработицы',
      'Зависимость ВВП от денежной массы',
    ],
    correctAnswer: 1,
    explanation: 'Кривая Филлипса показывает обратную зависимость: более высокая инфляция связана с более низкой безработицей и наоборот в краткосрочном периоде.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 8,
    question: 'Что происходит с реальной процентной ставкой, если номинальная ставка = 8%, а инфляция = 5%?',
    options: ['3%', '13%', '8%', '5%'],
    correctAnswer: 0,
    explanation: 'По уравнению Фишера: реальная ставка ≈ номинальная - инфляция = 8% - 5% = 3%. Реальная ставка отражает фактическую покупательную способность дохода от кредита.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 9,
    question: 'Какой рыночной структуре соответствует максимизация прибыли при MC = MR?',
    options: ['Совершенная конкуренция', 'Монополия', 'Олигополия', 'Всем перечисленным'],
    correctAnswer: 3,
    explanation: 'Условие MC = MR является общим правилом максимизации прибыли для любой рыночной структуры. Разница лишь в форме кривой MR.',
    topic: 'Микроэкономика',
    difficulty: 'hard',
  },
  {
    id: 10,
    question: 'Если предельная склонность к потреблению (MPC) = 0.75, чему равен мультипликатор автономных расходов?',
    options: ['0.25', '3', '4', '0.75'],
    correctAnswer: 2,
    explanation: 'Мультипликатор = 1 / (1 - MPC) = 1 / (1 - 0.75) = 1 / 0.25 = 4. Каждый дополнительный рубль расходов увеличивает ВВП на 4 рубля.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 11,
    question: 'Что из перечисленного является общественным благом?',
    options: ['Образование', 'Национальная оборона', 'Здравоохранение', 'Транспорт'],
    correctAnswer: 1,
    explanation: 'Национальная оборона обладает свойствами неисключаемости и неконкурентности — классический пример чистого общественного блага.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 12,
    question: 'Что описывает закон убывающей предельной полезности?',
    options: [
      'Каждая доп. единица блага приносит больше полезности',
      'Каждая доп. единица блага приносит меньше полезности',
      'Полезность не зависит от количества блага',
      'Общая полезность уменьшается с ростом потребления',
    ],
    correctAnswer: 1,
    explanation: 'Закон убывающей предельной полезности гласит, что по мере увеличения потребления блага, каждая дополнительная единица приносит всё меньший прирост полезности.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 13,
    question: 'Что такое общественное благо?',
    options: [
      'Благо, которое производится государством',
      'Благо, обладающее свойствами неисключаемости и неконкурентности',
      'Благо, доступное только богатым',
      'Благо, которое никто не хочет потреблять',
    ],
    correctAnswer: 1,
    explanation: 'Общественное благо характеризуется двумя свойствами: неисключаемость (нельзя лишить потребителя доступа) и неконкурентность (потребление одним не уменьшает доступность для других). Пример: национальная оборона.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 14,
    question: 'Что происходит при увеличении денежной массы в экономике (при прочих равных)?',
    options: [
      'Процентная ставка растёт',
      'Процентная ставка падает',
      'Процентная ставка не меняется',
      'Невозможно определить',
    ],
    correctAnswer: 1,
    explanation: 'Согласно модели денежного рынка, увеличение предложения денег при неизменном спросе сдвигает кривую MS вправо, что приводит к снижению равновесной процентной ставки.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 15,
    question: 'Что описывает кривая Лаффера?',
    options: [
      'Зависимость инфляции от безработицы',
      'Зависимость налоговых поступлений от ставки налога',
      'Зависимость ВВП от инвестиций',
      'Зависимость потребления от дохода',
    ],
    correctAnswer: 1,
    explanation: 'Кривая Лаффера показывает, что с ростом ставки налога налоговые поступления сначала растут, а затем начинают снижаться из-за демотивации экономической активности и ухода в теневой сектор.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 16,
    question: 'Какой из следующих товаров, скорее всего, имеет неэластичный спрос по цене?',
    options: [
      'Ресторанные обеды',
      'Лекарства от диабета',
      'Билеты в кино',
      'Ювелирные украшения',
    ],
    correctAnswer: 1,
    explanation: 'Жизненно необходимые лекарства (инсулин) имеют крайне неэластичный спрос, так как потребители не могут отказаться от их покупки при росте цены. Это товары первой необходимости без близких заменителей.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 17,
    question: 'Что является примером негативного внешнего эффекта (экстерналии)?',
    options: [
      'Пчёлы на пасеке опыляют соседний сад',
      'Завод загрязняет реку, делая воду непригодной для питья',
      'Образование повышает продуктивность работника',
      'Вакцинация снижает распространение болезни',
    ],
    correctAnswer: 1,
    explanation: 'Загрязнение реки — классический пример негативного внешнего эффекта: завод не учитывает ущерб, наносимый третьим лицам. Остальные варианты — положительные внешние эффекты.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 18,
    question: 'Если реальный ВВП вырос на 3%, а население — на 1%, как изменился ВВП на душу населения?',
    options: [
      'Вырос на 3%',
      'Вырос примерно на 2%',
      'Вырос на 4%',
      'Уменьшился',
    ],
    correctAnswer: 1,
    explanation: 'ВВП на душу населения ≈ ВВП / Население. Приближённо: Δ(ВВП/нас) ≈ ΔВВП - ΔНас = 3% - 1% = 2%. Экономический рост опережает рост населения, поэтому благосостояние увеличивается.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 19,
    question: 'Что означает абсолютное преимущество в международной торговле?',
    options: [
      'Страна может произвести товар с меньшими альтернативными издержками',
      'Страна может произвести товар с меньшими абсолютными затратами ресурсов',
      'Страна не импортирует данный товар',
      'Страна имеет положительное сальдо торгового баланса',
    ],
    correctAnswer: 1,
    explanation: 'Абсолютное преимущество (по А. Смиту) — способность страны производить товар с меньшими затратами ресурсов, чем другая страна. Не путать со сравнительным преимуществом (по Д. Рикардо) — способностью производить с меньшими альтернативными издержками.',
    topic: 'Международная экономика',
    difficulty: 'hard',
  },
  {
    id: 20,
    question: 'Какой показатель измеряет степень неравенства доходов в обществе?',
    options: [
      'Индекс потребительских цен',
      'Коэффициент Джини',
      'Дефлятор ВВП',
      'Мультипликатор',
    ],
    correctAnswer: 1,
    explanation: 'Коэффициент Джини измеряет неравенство доходов от 0 (полное равенство) до 1 (полное неравенство). Графически определяется по кривой Лоренца как отношение площади между кривой и линией равенства к общей площади.',
    topic: 'Макроэкономика',
    difficulty: 'easy',
  },
  {
    id: 21,
    question: 'Что такое «невидимая рука рынка» по А. Смиту?',
    options: [
      'Государственное регулирование экономики',
      'Саморегулирование рынка через систему цен',
      'Монопольный контроль над ценами',
      'Внешнеторговая политика',
    ],
    correctAnswer: 1,
    explanation: '«Невидимая рука» — метафора Адама Смита, описывающая автоматическое саморегулирование рынка: преследуя собственные интересы, индивиды невольно способствуют общественному благу через механизм конкурентных цен.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 22,
    question: 'Что происходит с равновесным объёмом при одновременном росте спроса и предложения?',
    options: [
      'Объём однозначно уменьшается',
      'Объём однозначно увеличивается',
      'Объём не меняется',
      'Цена однозначно растёт',
    ],
    correctAnswer: 1,
    explanation: 'Рост спроса и рост предложения оба давят на увеличение объёма в одном направлении. Цена при этом может вырасти, упасть или остаться неизменной в зависимости от силы сдвигов, но объём увеличится однозначно.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 23,
    question: 'Какой тип рыночной структуры характеризуется большим числом продавцов, однородным продуктом и свободным входом?',
    options: [
      'Монополия',
      'Олигополия',
      'Монополистическая конкуренция',
      'Совершенная конкуренция',
    ],
    correctAnswer: 3,
    explanation: 'Совершенная конкуренция предполагает множество продавцов, однородный (стандартизированный) продукт, отсутствие барьеров входа/выхода и полную информацию. Ни один продавец не может влиять на цену.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 24,
    question: 'Что такое альтернативные издержки (opportunity cost)?',
    options: [
      'Прямые денежные затраты на производство',
      'Стоимость лучшей упущенной альтернативы',
      'Затраты на рекламу продукции',
      'Амортизационные отчисления',
    ],
    correctAnswer: 1,
    explanation: 'Альтернативные издержки — это ценность лучшего из отвергнутых вариантов использования ресурсов. Включают не только явные (бухгалтерские), но и неявные (упущенная выгода) затраты.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 25,
    question: 'Что описывает модель IS-LM?',
    options: [
      'Зависимость инфляции от безработицы',
      'Равновесие на товарном и денежном рынках',
      'Зависимость налогов от ставки',
      'Поведение фирмы-монополиста',
    ],
    correctAnswer: 1,
    explanation: 'Модель IS-LM (Хикс-Хансен) описывает одновременное равновесие на товарном (IS) и денежном (LM) рынках. Кривая IS показывает комбинации ставки и дохода с равенством инвестиций и сбережений, LM — равенство спроса и предложения денег.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 26,
    question: 'Если коэффициент Джини равен 0, это означает:',
    options: [
      'Полное неравенство доходов',
      'Полное равенство доходов',
      'Отсутствие доходов',
      'Невозможно определить',
    ],
    correctAnswer: 1,
    explanation: 'Коэффициент Джини = 0 означает абсолютное равенство: каждый человек получает одинаковый доход. При G = 1 — абсолютное неравенство: один человек получает весь доход, остальные ничего.',
    topic: 'Макроэкономика',
    difficulty: 'easy',
  },
  {
    id: 27,
    question: 'Что такое «провалы рынка» (market failures)?',
    options: [
      'Ситуации, когда рынок не может обеспечить эффективное распределение ресурсов',
      'Ситуации снижения цен на акции',
      'Банкротство крупной компании',
      'Снижение спроса на товар',
    ],
    correctAnswer: 0,
    explanation: 'Провалы рынка — ситуации, когда рыночный механизм не обеспечивает Парето-эффективное распределение ресурсов. Основные типы: внешние эффекты, общественные блага, асимметрия информации, рыночная власть.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 28,
    question: 'Как называется ситуация, когда равновесная цена на рынке совершенной конкуренции ниже минимума AVC фирмы?',
    options: [
      'Точка безубыточности',
      'Точка закрытия фирмы',
      'Точка максимума прибыли',
      'Точка олигополии',
    ],
    correctAnswer: 1,
    explanation: 'Если цена ниже минимума средних переменных издержек (AVC), фирма не покрывает даже переменные затраты и должна закрыться в краткосрочном периоде. Это называется точкой закрытия (shutdown point).',
    topic: 'Микроэкономика',
    difficulty: 'hard',
  },
  {
    id: 29,
    question: 'Что такое сеньораж?',
    options: [
      'Налог на прибыль корпораций',
      'Доход государства от эмиссии денег',
      'Таможенная пошлина',
      'Акцизный сбор',
    ],
    correctAnswer: 1,
    explanation: 'Сеньораж — доход государства от выпуска денег, равный разнице между номинальной стоимостью выпущенных денег и затратами на их производство. При чрезмерной эмиссии приводит к инфляционному налогу.',
    topic: 'Макроэкономика',
    difficulty: 'medium',
  },
  {
    id: 30,
    question: 'Какое равновесие в дилемме заключённого является равновесием Нэша?',
    options: [
      'Оба сотрудничают',
      'Оба предают',
      'Один сотрудничает, другой предаёт',
      'Равновесия Нэша не существует',
    ],
    correctAnswer: 1,
    explanation: 'В дилемме заключённого равновесие Нэша — оба предают: каждому игроку выгодно предать независимо от выбора другого. Однако Парето-оптимальный исход — взаимное сотрудничество, что демонстрирует конфликт индивидуальной и коллективной рациональности.',
    topic: 'Микроэкономика',
    difficulty: 'hard',
  },
  {
    id: 31,
    question: 'Что описывает правило Тейлора?',
    options: [
      'Формулу расчёта ВВП',
      'Рекомендуемый уровень ключевой ставки ЦБ в зависимости от инфляции и разрыва ВВП',
      'Метод расчёта налоговой ставки',
      'Правило максимизации прибыли монополистом',
    ],
    correctAnswer: 1,
    explanation: 'Правило Тейлора предписывает ЦБ повышать ставку, когда инфляция выше целевого уровня или ВВП выше потенциала, и снижать — в противоположном случае. Формула: i = r* + π + 0.5(π - π*) + 0.5(y - y*).',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 32,
    question: 'Что происходит при введении импортной пошлины на товар?',
    options: [
      'Цена на внутреннем рынке снижается',
      'Цена на внутреннем рынке растёт',
      'Объём импорта увеличивается',
      'Потребительский излишек растёт',
    ],
    correctAnswer: 1,
    explanation: 'Импортная пошлина увеличивает стоимость ввозимого товара, что повышает его цену на внутреннем рынке. Это снижает объём импорта, уменьшает потребительский излишек, но защищает отечественных производителей и увеличивает налоговые поступления.',
    topic: 'Международная экономика',
    difficulty: 'medium',
  },
  {
    id: 33,
    question: 'Что такое гудвилл (goodwill) в бухгалтерском учёте?',
    options: [
      'Денежные средства на расчётном счёте',
      'Деловая репутация компании, превышающая балансовую стоимость активов',
      'Готовая продукция на складе',
      'Кредиторская задолженность',
    ],
    correctAnswer: 1,
    explanation: 'Гудвилл — нематериальный актив, возникающий при покупке компании за сумму, превышающую справедливую стоимость её чистых активов. Отражает репутацию, бренд, клиентскую базу и другие неучтённые активы.',
    topic: 'Финансы',
    difficulty: 'medium',
  },
  {
    id: 34,
    question: 'Что описывает закон Оукена?',
    options: [
      'Обратную зависимость инфляции и безработицы',
      'Связь между отклонением безработицы от естественного уровня и разрывом ВВП',
      'Прямую зависимость инвестиций и процентной ставки',
      'Зависимость налоговых поступлений от ставки',
    ],
    correctAnswer: 1,
    explanation: 'Закон Оукена: каждый процент превышения фактической безработицы над естественным уровнем соответствует примерно 2-3% потери реального ВВП относительно потенциального. Это ключевая эмпирическая зависимость в макроэкономике.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 35,
    question: 'Что такое эффект дохода при изменении цены товара?',
    options: [
      'Изменение спроса из-за изменения относительной цены товара',
      'Изменение реальной покупательной способности потребителя при изменении цены',
      'Изменение доходов продавца',
      'Влияние рекламы на спрос',
    ],
    correctAnswer: 1,
    explanation: 'Эффект дохода: при снижении цены товара реальный доход потребителя растёт (можно купить больше), что ведёт к увеличению спроса. Вместе с эффектом замещения составляет общий эффект изменения цены по модели Слуцкого-Хикса.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 36,
    question: 'Что показывает кривая производственных возможностей (КПВ)?',
    options: [
      'Максимально возможные объёмы производства двух благ при данных ресурсах',
      'Зависимость цены от количества',
      'Зависимость спроса от дохода',
      'Кривую безразличия потребителя',
    ],
    correctAnswer: 0,
    explanation: 'КПВ показывает все комбинации максимальных объёмов производства двух товаров, которые экономика может произвести при полном использовании имеющихся ресурсов и данной технологии.',
    topic: 'Микроэкономика',
    difficulty: 'easy',
  },
  {
    id: 37,
    question: 'Почему кривая производственных возможностей имеет вогнутую форму (выпукла от начала координат)?',
    options: [
      'Из-за убывающей отдачи от масштаба',
      'Из-за возрастающих альтернативных издержек при перераспределении ресурсов',
      'Из-за инфляции',
      'Из-за роста населения',
    ],
    correctAnswer: 1,
    explanation: 'Вогнутость КПВ объясняется возрастающими альтернативными издержками: ресурсы не взаимозаменяемы, поэтому при увеличении производства одного блага приходится жертвовать всё большим количеством другого.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 38,
    question: 'Какой налог является косвенным?',
    options: [
      'НДФЛ',
      'Налог на прибыль',
      'НДС',
      'Налог на имущество',
    ],
    correctAnswer: 2,
    explanation: 'НДС (налог на добавленную стоимость) — косвенный налог, включаемый в цену товара и фактически оплачиваемый потребителем. Прямые налоги (НДФЛ, налог на прибыль, налог на имущество) уплачиваются напрямую налогоплательщиком.',
    topic: 'Финансы',
    difficulty: 'easy',
  },
  {
    id: 39,
    question: 'Что происходит с предельными издержками (MC), когда они пересекают кривую ATC?',
    options: [
      'MC достигает минимума',
      'ATC достигает минимума',
      'AVC достигает минимума',
      'FC достигает минимума',
    ],
    correctAnswer: 1,
    explanation: 'Когда MC падает ниже ATC, средние издержки снижаются. Когда MC поднимается выше ATC, средние издержки растут. Следовательно, точка пересечения MC и ATC — это минимум ATC. Аналогично MC пересекает AVC в точке её минимума.',
    topic: 'Микроэкономика',
    difficulty: 'hard',
  },
  {
    id: 40,
    question: 'Что такое предельная норма трансформации (MRT)?',
    options: [
      'Отношение цен двух товаров',
      'Наклон кривой производственных возможностей, показывающий альтернативные издержки',
      'Отношение предельных полезностей',
      'Наклон бюджетной линии',
    ],
    correctAnswer: 1,
    explanation: 'MRT = |ΔY/ΔX| — показывает, от какого количества товара Y нужно отказаться, чтобы произвести дополнительную единицу товара X. Графически — наклон КПВ в данной точке. В условиях эффективности: MRT = MRS.',
    topic: 'Микроэкономика',
    difficulty: 'hard',
  },
  {
    id: 41,
    question: 'Какая ставка НДС применяется к большинству товаров в России?',
    options: [
      '10%',
      '18%',
      '20%',
      '13%',
    ],
    correctAnswer: 2,
    explanation: 'Ставка НДС в России с 2019 года составляет 20% для большинства товаров и услуг. Пониженная ставка 10% применяется для продуктов питания, детских товаров, медицинских товаров и печатных изданий.',
    topic: 'Финансы',
    difficulty: 'easy',
  },
  {
    id: 42,
    question: 'Что такое экономическая прибыль в отличие от бухгалтерской?',
    options: [
      'Экономическая прибыль всегда больше бухгалтерской',
      'Экономическая прибыль учитывает явные и неявные издержки',
      'Бухгалтерская прибыль учитывает неявные издержки',
      'Они всегда равны',
    ],
    correctAnswer: 1,
    explanation: 'Экономическая прибыль = Выручка - (Явные + Неявные издержки), а бухгалтерская = Выручка - Явные издержки. Экономическая прибыль всегда меньше или равна бухгалтерской, так как учитывает альтернативную стоимость собственных ресурсов.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 43,
    question: 'Если предельные издержки (MC) ниже средних переменных издержек (AVC), что происходит с AVC?',
    options: [
      'AVC растут',
      'AVC снижаются',
      'AVC не меняются',
      'Невозможно определить',
    ],
    correctAnswer: 1,
    explanation: 'Когда MC < AVC, каждая дополнительная единица обходится дешевле текущего среднего, поэтому средние переменные издержки снижаются. И наоборот, когда MC > AVC, средние переменные издержки растут.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
  {
    id: 44,
    question: 'Что описывает эффект вытеснения (crowding out) в макроэкономике?',
    options: [
      'Вытеснение импортных товаров отечественными',
      'Снижение частных инвестиций из-за роста гос. расходов и процентных ставок',
      'Вытеснение старых технологий новыми',
      'Снижение безработицы из-за экономического роста',
    ],
    correctAnswer: 1,
    explanation: 'Эффект вытеснения: рост государственных расходов увеличивает спрос на кредиты, что повышает процентные ставки и «вытесняет» частные инвестиции. Частичный эффект вытеснения снижает мультипликативный эффект фискальной политики.',
    topic: 'Макроэкономика',
    difficulty: 'hard',
  },
  {
    id: 45,
    question: 'Что такое Парето-эффективность?',
    options: [
      'Состояние, при котором все доходы равны',
      'Состояние, при котором нельзя улучшить положение одного без ухудшения положения другого',
      'Максимальная прибыль фирмы',
      'Минимальные издержки производства',
    ],
    correctAnswer: 1,
    explanation: 'Парето-эффективность (оптимальность по Парето) — такое состояние экономики, при котором невозможно перераспределить ресурсы так, чтобы улучшить положение хотя бы одного субъекта, не ухудшая положение других. Это ключевое понятие теории благосостояния.',
    topic: 'Микроэкономика',
    difficulty: 'medium',
  },
]

const QUIZ_TIME = 30 // seconds per question

type QuizState = 'idle' | 'active' | 'answered' | 'finished'

export function EconomicsQuiz() {
  const [quizState, setQuizState] = useState<QuizState>('idle')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const addQuizResult = useEconomicsStore((s) => s.addQuizResult)
  const { toast } = useToast()
  const { t } = useI18n()

  // Ref to track current question index inside interval callbacks
  const currentQuestionRef = useRef(currentQuestion)
  useEffect(() => {
    currentQuestionRef.current = currentQuestion
  }, [currentQuestion])

  // Guard to prevent race condition between timer and handleAnswer
  const hasTransitionedRef = useRef(false)

  // Detect when time runs out during active quiz
  const isTimeUp = quizState === 'active' && timeLeft <= 0

  const startQuiz = useCallback(() => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, 10)
    setShuffledQuestions(shuffled)
    setCurrentQuestion(0)
    setScore(0)
    setSelectedAnswer(null)
    setAnswers(new Array(shuffled.length).fill(null))
    setTimeLeft(QUIZ_TIME)
    setQuizState('active')
  }, [])

  // Timer countdown — auto-advances when time runs out
  useEffect(() => {
    if (quizState !== 'active') return
    hasTransitionedRef.current = false // Reset guard when starting new question
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer)
          if (!hasTransitionedRef.current) {
            hasTransitionedRef.current = true
            // Auto-advance: mark answer as null and transition to answered state
            setAnswers((prev) => {
              const next = [...prev]
              next[currentQuestionRef.current] = null
              return next
            })
            setSelectedAnswer(null)
            setQuizState('answered')
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [quizState])

  const handleAnswer = useCallback(
    (answer: number | null) => {
      if (quizState !== 'active') return
      if (hasTransitionedRef.current) return // Timer already transitioned
      hasTransitionedRef.current = true
      setSelectedAnswer(answer)
      setAnswers((prev) => {
        const next = [...prev]
        next[currentQuestion] = answer
        return next
      })

      const isCorrect = answer === shuffledQuestions[currentQuestion]?.correctAnswer
      if (isCorrect) setScore((s) => s + 1)

      setQuizState('answered')
    },
    [quizState, currentQuestion, shuffledQuestions]
  )

  const nextQuestion = useCallback(() => {
    if (currentQuestion + 1 >= shuffledQuestions.length) {
      const finalScore = score
      addQuizResult({
        id: Date.now().toString(),
        topic: t('quiz.topicEconomicTheory'),
        score: finalScore,
        total: shuffledQuestions.length,
        date: new Date().toISOString(),
      })
      setQuizState('finished')
      toast({
        title: t('quiz.finishedTitle'),
        description: `${t('quiz.finishedDescription')} ${finalScore} ${t('quiz.of')} ${shuffledQuestions.length}`,
      })
      return
    }
    setCurrentQuestion((q) => q + 1)
    setSelectedAnswer(null)
    setTimeLeft(QUIZ_TIME)
    setQuizState('active')
  }, [currentQuestion, shuffledQuestions, score, addQuizResult, toast, t])

  const getDifficultyColor = (d: string) => {
    if (d === 'easy') return 'secondary'
    if (d === 'medium') return 'default'
    return 'destructive'
  }

  if (quizState === 'idle') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('quiz.economicTheoryTitle')}
          </CardTitle>
          <CardDescription>
            {t('quiz.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">{t('quiz.questionsInBank')}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">10</div>
              <div className="text-sm text-muted-foreground">{t('quiz.questionsInQuiz')}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">30{t('quiz.secondsSuffix')}</div>
              <div className="text-sm text-muted-foreground">{t('quiz.perQuestion')}</div>
            </div>
          </div>
          <Button onClick={startQuiz} size="lg" className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            {t('quiz.startQuiz')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (quizState === 'finished') {
    const percentage = Math.round((score / shuffledQuestions.length) * 100)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {t('quiz.resultsTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl font-bold">
              {score}/{shuffledQuestions.length}
            </div>
            <div className="text-lg text-muted-foreground">{t('quiz.correctAnswers')}</div>
            <Progress value={percentage} className="h-3" />
            <Badge
              variant={percentage >= 75 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
              className="text-base px-4 py-1"
            >
              {percentage >= 75 ? t('quiz.excellent') : percentage >= 50 ? t('quiz.good') : t('quiz.needsImprovement')}
            </Badge>
          </div>

          <div className="space-y-3">
            {shuffledQuestions.map((q, i) => (
              <div
                key={q.id}
                className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                  answers[i] === q.correctAnswer
                    ? 'bg-green-50 dark:bg-green-950/30'
                    : 'bg-red-50 dark:bg-red-950/30'
                }`}
              >
                {answers[i] === q.correctAnswer ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium">{q.question}</div>
                  {answers[i] !== q.correctAnswer && (
                    <div className="text-muted-foreground mt-1">
                      {t('quiz.correctAnswer')} {q.options[q.correctAnswer]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={startQuiz} className="w-full" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('quiz.playAgain')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const question = shuffledQuestions[currentQuestion]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {t('quiz.questionOf').replace('{current}', String(currentQuestion + 1)).replace('{total}', String(shuffledQuestions.length))}
          </Badge>
          <Badge variant={getDifficultyColor(question.difficulty) as "secondary" | "default" | "destructive"}>
            {question.difficulty === 'easy' ? t('quiz.difficultyEasy') : question.difficulty === 'medium' ? t('quiz.difficultyMedium') : t('quiz.difficultyHard')}
          </Badge>
          <Badge variant="outline">{question.topic}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500' : ''}`} />
          <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : ''}`}>
            {timeLeft}{t('quiz.secondsSuffix')}
          </span>
        </div>
      </div>

      <Progress value={(currentQuestion / shuffledQuestions.length) * 100} className="h-2" />

      {isTimeUp && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <CardContent className="p-4 text-center space-y-3">
            <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              {t('quiz.timeUp')}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('quiz.timeUpDescription')}
            </p>
            <Button onClick={nextQuestion} variant="destructive">
              {t('quiz.continue')}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isTimeUp && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(v) => {
              if (quizState === 'active') handleAnswer(parseInt(v))
            }}
            disabled={quizState === 'answered'}
          >
            {question.options.map((option, idx) => {
              let optionClass = 'border-2 rounded-lg p-3 transition-all cursor-pointer'
              if (quizState === 'answered') {
                if (idx === question.correctAnswer) {
                  optionClass += ' border-green-500 bg-green-50 dark:bg-green-950/30'
                } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                  optionClass += ' border-red-500 bg-red-50 dark:bg-red-950/30'
                } else {
                  optionClass += ' opacity-50'
                }
              } else if (selectedAnswer === idx) {
                optionClass += ' border-primary'
              } else {
                optionClass += ' border-transparent hover:border-muted-foreground/30'
              }

              return (
                <div key={idx} className={optionClass}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </div>
                </div>
              )
            })}
          </RadioGroup>

          {quizState === 'answered' && (
            <div className="p-4 bg-primary/5 rounded-lg text-sm space-y-2">
              <div className="font-semibold">
                {selectedAnswer === question.correctAnswer ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> {t('quiz.correctExclamation')}
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> {t('quiz.incorrectExclamation')}
                  </span>
                )}
              </div>
              <div>{question.explanation}</div>
            </div>
          )}

          {quizState === 'answered' && (
            <Button onClick={nextQuestion} className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              {currentQuestion + 1 >= shuffledQuestions.length
                ? t('quiz.showResults')
                : t('quiz.nextQuestion')}
            </Button>
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex gap-1">
        {shuffledQuestions.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < currentQuestion
                ? answers[i] === shuffledQuestions[i]?.correctAnswer
                  ? 'bg-green-500'
                  : 'bg-red-500'
                : i === currentQuestion
                  ? 'bg-primary'
                  : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
