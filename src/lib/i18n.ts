export type Locale = 'ru' | 'en';

export const locales: Locale[] = ['ru', 'en'];

export const defaultLocale: Locale = 'ru';

// UI translations
export const translations = {
  ru: {
    // Common
    'common.calculate': 'Рассчитать',
    'common.reset': 'Сбросить',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.confirm': 'Подтвердить',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.export': 'Экспорт',
    'common.import': 'Импорт',
    'common.share': 'Поделиться',
    'common.copy': 'Копировать',
    'common.download': 'Скачать',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успешно',
    
    // Homepage
    'home.title': 'Экономический тренажёр',
    'home.subtitle': 'Интерактивная платформа для тренировки экономического мышления',
    'home.description': 'Изучайте микроэкономику, макроэкономику и финансовую математику через интерактивные модули и визуализации.',
    'home.startLearning': 'Начать обучение',
    'home.viewModules': 'Посмотреть модули',
    
    // Categories
    'category.macro': 'Макроэкономика',
    'category.micro': 'Микроэкономика',
    'category.finance': 'Финансы',
    'category.tools': 'Инструменты',
    
    // Modules
    'module.gdp.title': 'ВВП и макропоказатели',
    'module.gdp.description': 'Расчёт номинального и реального ВВП, дефлятора, инфляции',
    'module.supply-demand.title': 'Спрос и предложение',
    'module.supply-demand.description': 'Интерактивный график с анализом равновесия',
    'module.elasticity.title': 'Калькулятор эластичности',
    'module.elasticity.description': 'Эластичность по цене, доходу, перекрёстная',
    'elasticity.title': 'Калькулятор эластичности',
    'elasticity.description': 'Рассчитайте эластичность спроса по цене, доходу и перекрёстную эластичность.',
    'elasticity.price': 'По цене',
    'elasticity.income': 'По доходу',
    'elasticity.cross': 'Перекрёстная',
    'elasticity.input.q1': 'Q1 — начальный объём спроса',
    'elasticity.input.q2': 'Q2 — конечный объём спроса',
    'elasticity.input.p1': 'P1 — начальная цена',
    'elasticity.input.p2': 'P2 — конечная цена',
    'elasticity.input.y1': 'Y1 — начальный доход',
    'elasticity.input.y2': 'Y2 — конечный доход',
    'elasticity.input.px1': 'Px1 — начальная цена товара Y',
    'elasticity.input.px2': 'Px2 — конечная цена товара Y',
    'elasticity.button.calculate': 'Рассчитать',
    'elasticity.button.reset': 'Сбросить',
    'elasticity.result.coefficient': 'Коэффициент эластичности',
    'elasticity.result.interpretation': 'Интерпретация',
    'elasticity.result.category': 'Категория',
    'elasticity.reference.title': 'Справочник эластичностей',
    'elasticity.reference.price': 'Эластичность по цене (Ed): Ed = (ΔQ / Qср) / (ΔP / Pср) — дуговая формула. Если |Ed|>1 — эластичный, |Ed|<1 — неэластичный',
    'elasticity.reference.income': 'Эластичность по доходу (Ey): Ey > 1 — роскошь, 0 < Ey < 1 — нормальный, Ey < 0 — низший товар',
    'elasticity.reference.cross': 'Перекрёстная эластичность (Exy): Exy > 0 — субституты, Exy < 0 — комплементы, Exy = 0 — независимые',
    'module.keynesian.title': 'Кейнсианский крест',
    'module.keynesian.description': 'Модель доходов-расходов с мультипликатором',
    'module.inflation.title': 'Калькулятор инфляции',
    'module.inflation.description': 'Обесценение денег и покупательная способность',
    'module.phillips.title': 'Кривая Филлипса',
    'module.phillips.description': 'Инфляция и безработица: краткосрочный и долгосрочный разрез',
    'module.lorenz.title': 'Кривая Лоренца и Джини',
    'module.lorenz.description': 'Визуализация неравенства доходов и коэффициент Джини',
    'module.is-lm.title': 'Модель IS-LM',
    'module.is-lm.description': 'Равновесие товарного и денежного рынков',
    'module.ppf.title': 'Кривая производственных возможностей',
    'module.ppf.description': 'КПВ: альтернативные издержки, MRT, экономический рост',
    'module.costs.title': 'Анализ издержек фирмы',
    'module.costs.description': 'ATC, AVC, MC, AFC: графики и ключевые точки',
    'module.comparative.title': 'Сравнительное преимущество',
    'module.comparative.description': 'Модель Рикардо: выгоды международной торговли',
    'module.breakeven.title': 'Точка безубыточности',
    'module.breakeven.description': 'CVP-анализ: расчёт BEP, маржинальность, запас прочности',
    'module.tax.title': 'Калькулятор налогов',
    'module.tax.description': 'НДФЛ с прогрессивной шкалой, НДС, налог на прибыль',
    'module.game-theory.title': 'Теория игр',
    'module.game-theory.description': 'Дилемма заключённого, ястребы и голуби, равновесие Нэша',
    'module.market-structures.title': 'Рыночные структуры',
    'module.market-structures.description': 'Совершенная конкуренция, монополия, олигополия',
    'module.quiz.title': 'Квиз по экономике',
    'module.quiz.description': '45 вопросов по микро- и макроэкономике с таймером',
    'module.currency.title': 'Валютный калькулятор',
    'module.currency.description': 'Конвертация, кросс-курсы и динамика валют',
    'module.finance.title': 'Финансовая математика',
    'module.finance.description': 'Сложные проценты, NPV, аннуитетные расчёты',
    'module.glossary.title': 'Глоссарий терминов',
    'module.glossary.description': '40+ ключевых терминов с формулами и поиском',
    'module.achievements.title': 'Достижения',
    'module.achievements.description': '19 бейджей, XP и уровни за тренировки',
    'module.progress.title': 'Прогресс',
    'module.progress.description': 'Статистика тренировок и аналитика прогресса',
    
    // XP & Levels
    'xp.title': 'Опыт',
    'xp.level': 'Уровень',
    'xp.toNext': 'До следующего уровня',
    'level.novice': 'Новичок',
    'level.student': 'Студент',
    'level.bachelor': 'Бакалавр',
    'level.master': 'Магистр',
    'level.phd': 'Аспирант',
    'level.associate': 'Доцент',
    'level.professor': 'Профессор',
    'level.academician': 'Академик',
    
    // Achievements
    'achievements.title': 'Достижения',
    'achievements.unlocked': 'Открыто',
    'achievements.locked': 'Закрыто',
    'achievements.reset': 'Сбросить прогресс',
    'achievements.resetConfirm': 'Вы уверены? Весь прогресс будет удалён.',
    
    // Quiz
    'quiz.title': 'Квиз по экономике',
    'quiz.start': 'Начать тест',
    'quiz.question': 'Вопрос',
    'quiz.of': 'из',
    'quiz.time': 'Время',
    'quiz.submit': 'Ответить',
    'quiz.next': 'Следующий',
    'quiz.finish': 'Завершить',
    'quiz.result': 'Результат',
    'quiz.correct': 'Правильно',
    'quiz.incorrect': 'Неправильно',
    'quiz.score': 'Счёт',
    
    // Progress
    'progress.title': 'Прогресс',
    'progress.totalXP': 'Всего опыта',
    'progress.sessions': 'Сессии',
    'progress.streak': 'Серия',
    'progress.accuracy': 'Точность',
    'progress.export': 'Экспорт прогресса',
    'progress.exportPDF': 'Скачать PDF',
    'progress.exportJSON': 'Скачать JSON',
    
    // GDP Calculator
    'gdp.nominal': 'Номинальный ВВП',
    'gdp.real': 'Реальный ВВП',
    'gdp.deflator': 'Дефлятор ВВП',
    'gdp.inflation': 'Уровень инфляции',
    'gdp.current': 'Текущие цены',
    'gdp.base': 'Базовые цены',
    'gdp.title': 'Калькулятор ВВП',
    'gdp.description': 'Введите текущие и базовые значения компонентов ВВП для расчёта номинального и реального ВВП, дефлятора и уровня инфляции.\nФормула: ВВП = C + I + G + X - M',
    'gdp.component': 'Компонент',
    'gdp.currentPrices': 'Текущие цены',
    'gdp.basePrices': 'Базовые цены',
    'gdp.calculate': 'Рассчитать ВВП',
    'gdp.reset': 'Сброс',
    'gdp.formulas': 'Формулы',
    'gdp.formula.expenses': 'ВВП по расходам: Y = C + I + G + NX, где NX = X - M',
    'gdp.formula.deflator': 'Дефлятор ВВП: D = (Номинальный ВВП / Реальный ВВП) × 100%',
    'gdp.formula.inflation': 'Уровень инфляции: π = ((Номинальный - Реальный) / Реальный) × 100%',
    'gdp.inflation.high': 'Высокая инфляция',
    'gdp.inflation.moderate': 'Умеренная инфляция',
    'gdp.inflation.low': 'Низкая инфляция',
    'gdp.inflation.stable': 'Стабильность',
    'gdp.inflation.deflation': 'Дефляция',
    'gdp.tooltip.nominal': 'ВВП в текущих ценах. Отражает объём производства без корректировки на инфляцию.',
    'gdp.tooltip.real': 'ВВП в базовых ценах. Корректируется на изменение уровня цен, показывая реальный рост.',
    'gdp.tooltip.deflator': 'Отношение номинального ВВП к реальному. Показывает изменение уровня цен.',
    'gdp.tooltip.inflation': 'Темп прироста уровня цен. Положительное значение — инфляция, отрицательное — дефляция.',
    // Component names
    'gdp.component.consumption': 'Потребительские расходы (C)',
    'gdp.component.investment': 'Инвестиции (I)',
    'gdp.component.government': 'Гос. расходы (G)',
    'gdp.component.export': 'Экспорт (X)',
    'gdp.component.import': 'Импорт (M)',

    // Supply Demand
    'supply-demand.title': 'Спрос и предложение',
    'supply-demand.description': 'Используйте ползунки для сдвига кривых спроса и предложения. Наблюдайте, как меняется равновесная цена и объём.',
    'supply-demand.parameters': 'Параметры кривых',
    'supply-demand.shifts': 'Сдвиги кривых',
    'supply-demand.equilibrium': 'Равновесие рынка',
    'supply-demand.price': 'Равн. цена (P*)',
    'supply-demand.quantity': 'Равн. объём (Q*)',
    'supply-demand.effect.price': 'Эффект на цену',
    'supply-demand.effect.quantity': 'Эффект на объём',
    'supply-demand.demand.shift': 'Сдвиг спроса',
    'supply-demand.supply.shift': 'Сдвиг предложения',
    'supply-demand.demand.slope': 'Наклон спроса (крутизна)',
    'supply-demand.supply.slope': 'Наклон предложения (крутизна)',
    'supply-demand.scenario.demand.increase': 'Спрос вырос (кривая сместилась вправо)',
    'supply-demand.scenario.demand.decrease': 'Спрос упал (кривая сместилась влево)',
    'supply-demand.scenario.supply.increase': 'Предложение выросло (кривая сместилась вправо)',
    'supply-demand.scenario.supply.decrease': 'Предложение упало (кривая сместилась влево)',
    'supply-demand.scenario.equilibrium': 'Исходное равновесие — рынок сбалансирован',
    'supply-demand.effect.price.up': 'Цена растёт',
    'supply-demand.effect.price.down': 'Цена падает',
    'supply-demand.effect.price.up.pressure': 'Давление вверх',
    'supply-demand.effect.price.down.pressure': 'Давление вниз',
    'supply-demand.effect.price.stable': 'Стабильно',
    'supply-demand.effect.quantity.up': 'Объём растёт',
    'supply-demand.effect.quantity.down': 'Объём падает',
    'supply-demand.effect.quantity.change': 'Объём меняется',
    'supply-demand.effect.quantity.stable': 'Стабильно',
    'supply-demand.tooltip.demand': 'Спрос',
    'supply-demand.tooltip.supply': 'Предложение',
    'supply-demand.legend.demand': 'Спрос (D)',
    'supply-demand.legend.supply': 'Предложение (S)',
    
    // Theme
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',
    'theme.system': 'Системная',
    
    // Offline
    'offline.title': 'Вы离线',
    'offline.description': 'Пожалуйста, проверьте подключение к интернету.',
    'offline.retry': 'Повторить',
  },
  en: {
    // Common
    'common.calculate': 'Calculate',
    'common.reset': 'Reset',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.download': 'Download',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Homepage
    'home.title': 'Economic Trainer',
    'home.subtitle': 'Interactive platform for economic thinking practice',
    'home.description': 'Learn microeconomics, macroeconomics, and financial mathematics through interactive modules and visualizations.',
    'home.startLearning': 'Start Learning',
    'home.viewModules': 'View Modules',
    
    // Categories
    'category.macro': 'Macroeconomics',
    'category.micro': 'Microeconomics',
    'category.finance': 'Finance',
    'category.tools': 'Tools',
    
    // Modules
    'module.gdp.title': 'GDP & Macro Indicators',
    'module.gdp.description': 'Calculate nominal and real GDP, deflator, inflation',
    'module.supply-demand.title': 'Supply & Demand',
    'module.supply-demand.description': 'Interactive chart with equilibrium analysis',
    'module.elasticity.title': 'Elasticity Calculator',
    'module.elasticity.description': 'Price, income, and cross-price elasticity',
    'module.keynesian.title': 'Keynesian Cross',
    'module.keynesian.description': 'Income-expenditure model with multiplier',
    'module.inflation.title': 'Inflation Calculator',
    'module.inflation.description': 'Money depreciation and purchasing power',
    'module.phillips.title': 'Phillips Curve',
    'module.phillips.description': 'Inflation and unemployment: short & long run',
    'module.lorenz.title': 'Lorenz Curve & Gini',
    'module.lorenz.description': 'Income inequality visualization and Gini coefficient',
    'module.is-lm.title': 'IS-LM Model',
    'module.is-lm.description': 'Goods and money market equilibrium',
    'module.ppf.title': 'Production Possibilities Frontier',
    'module.ppf.description': 'PPF: opportunity cost, MRT, economic growth',
    'module.costs.title': 'Firm Cost Analysis',
    'module.costs.description': 'ATC, AVC, MC, AFC: charts and key points',
    'module.comparative.title': 'Comparative Advantage',
    'module.comparative.description': 'Ricardian model: gains from trade',
    'module.breakeven.title': 'Break-Even Point',
    'module.breakeven.description': 'CVP analysis: BEP, margin, safety margin',
    'module.tax.title': 'Tax Calculator',
    'module.tax.description': 'Income tax, VAT, corporate profit tax',
    'module.game-theory.title': 'Game Theory',
    'module.game-theory.description': 'Prisoner\'s dilemma, hawk-dove, Nash equilibrium',
    'module.market-structures.title': 'Market Structures',
    'module.market-structures.description': 'Perfect competition, monopoly, oligopoly',
    'module.quiz.title': 'Economics Quiz',
    'module.quiz.description': '45 questions on micro and macroeconomics',
    'module.currency.title': 'Currency Calculator',
    'module.currency.description': 'Conversion, cross-rates, currency dynamics',
    'module.finance.title': 'Financial Mathematics',
    'module.finance.description': 'Compound interest, NPV, annuity calculations',
    'module.glossary.title': 'Glossary of Terms',
    'module.glossary.description': '40+ key terms with formulas and search',
    'module.achievements.title': 'Achievements',
    'module.achievements.description': '19 badges, XP and levels for training',
    'module.progress.title': 'Progress',
    'module.progress.description': 'Training statistics and progress analytics',
    
    // XP & Levels
    'xp.title': 'Experience',
    'xp.level': 'Level',
    'xp.toNext': 'To next level',
    'level.novice': 'Novice',
    'level.student': 'Student',
    'level.bachelor': 'Bachelor',
    'level.master': 'Master',
    'level.phd': 'PhD Student',
    'level.associate': 'Associate Professor',
    'level.professor': 'Professor',
    'level.academician': 'Academician',
    
    // Achievements
    'achievements.title': 'Achievements',
    'achievements.unlocked': 'Unlocked',
    'achievements.locked': 'Locked',
    'achievements.reset': 'Reset Progress',
    'achievements.resetConfirm': 'Are you sure? All progress will be deleted.',
    
    // Quiz
    'quiz.title': 'Economics Quiz',
    'quiz.start': 'Start Quiz',
    'quiz.question': 'Question',
    'quiz.of': 'of',
    'quiz.time': 'Time',
    'quiz.submit': 'Answer',
    'quiz.next': 'Next',
    'quiz.finish': 'Finish',
    'quiz.result': 'Result',
    'quiz.correct': 'Correct',
    'quiz.incorrect': 'Incorrect',
    'quiz.score': 'Score',
    
    // Progress
    'progress.title': 'Progress',
    'progress.totalXP': 'Total XP',
    'progress.sessions': 'Sessions',
    'progress.streak': 'Streak',
    'progress.accuracy': 'Accuracy',
    'progress.export': 'Export Progress',
    'progress.exportPDF': 'Download PDF',
    'progress.exportJSON': 'Download JSON',
    
    // GDP Calculator
    'gdp.nominal': 'Nominal GDP',
    'gdp.real': 'Real GDP',
    'gdp.deflator': 'GDP Deflator',
    'gdp.inflation': 'Inflation Rate',
    'gdp.current': 'Current Prices',
    'gdp.base': 'Base Prices',
    'gdp.title': 'GDP Calculator',
    'gdp.description': 'Enter current and base values of GDP components to calculate nominal and real GDP, deflator, and inflation rate.\nFormula: GDP = C + I + G + X - M',
    'gdp.component': 'Component',
    'gdp.currentPrices': 'Current Prices',
    'gdp.basePrices': 'Base Prices',
    'gdp.calculate': 'Calculate GDP',
    'gdp.reset': 'Reset',
    'gdp.formulas': 'Formulas',
    'gdp.formula.expenses': 'GDP by expenditure approach:',
    'gdp.formula.deflator': 'GDP Deflator:',
    'gdp.formula.inflation': 'Inflation Rate:',
    'gdp.inflation.high': 'High Inflation',
    'gdp.inflation.moderate': 'Moderate Inflation',
    'gdp.inflation.low': 'Low Inflation',
    'gdp.inflation.stable': 'Stability',
    'gdp.inflation.deflation': 'Deflation',
    'gdp.tooltip.nominal': 'GDP in current prices. Reflects output volume without adjusting for inflation.',
    'gdp.tooltip.real': 'GDP in base prices. Adjusted for price level changes, showing real growth.',
    'gdp.tooltip.deflator': 'Ratio of nominal GDP to real GDP. Shows price level changes.',
    'gdp.tooltip.inflation': 'Rate of price level increase. Positive value indicates inflation, negative indicates deflation.',
    // Component names
    'gdp.component.consumption': 'Consumer Spending (C)',
    'gdp.component.investment': 'Investment (I)',
    'gdp.component.government': 'Government Spending (G)',
    'gdp.component.export': 'Exports (X)',
    'gdp.component.import': 'Imports (M)',

    // Supply Demand
    'supply-demand.title': 'Supply & Demand',
    'supply-demand.description': 'Use sliders to shift supply and demand curves. Observe how equilibrium price and quantity change.',
    'supply-demand.parameters': 'Curve Parameters',
    'supply-demand.shifts': 'Curve Shifts',
    'supply-demand.equilibrium': 'Market Equilibrium',
    'supply-demand.price': 'Equilibrium Price (P*)',
    'supply-demand.quantity': 'Equilibrium Quantity (Q*)',
    'supply-demand.effect.price': 'Effect on Price',
    'supply-demand.effect.quantity': 'Effect on Quantity',
    'supply-demand.demand.shift': 'Demand Shift',
    'supply-demand.supply.shift': 'Supply Shift',
    'supply-demand.demand.slope': 'Demand Slope (Steepness)',
    'supply-demand.supply.slope': 'Supply Slope (Steepness)',
    'supply-demand.scenario.demand.increase': 'Demand increased (curve shifted right)',
    'supply-demand.scenario.demand.decrease': 'Demand decreased (curve shifted left)',
    'supply-demand.scenario.supply.increase': 'Supply increased (curve shifted right)',
    'supply-demand.scenario.supply.decrease': 'Supply decreased (curve shifted left)',
    'supply-demand.scenario.equilibrium': 'Initial equilibrium - market balanced',
    'supply-demand.effect.price.up': 'Price rises',
    'supply-demand.effect.price.down': 'Price falls',
    'supply-demand.effect.price.up.pressure': 'Upward pressure',
    'supply-demand.effect.price.down.pressure': 'Downward pressure',
    'supply-demand.effect.price.stable': 'Stable',
    'supply-demand.effect.quantity.up': 'Quantity increases',
    'supply-demand.effect.quantity.down': 'Quantity decreases',
    'supply-demand.effect.quantity.change': 'Quantity changes',
    'supply-demand.effect.quantity.stable': 'Stable',
    'supply-demand.tooltip.demand': 'Demand',
    'supply-demand.tooltip.supply': 'Supply',
    'supply-demand.legend.demand': 'Demand (D)',
    'supply-demand.legend.supply': 'Supply (S)',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Offline
    'offline.title': 'You are offline',
    'offline.description': 'Please check your internet connection.',
    'offline.retry': 'Retry',
  },
} as const;

// Helper function to get translation
export function t(key: string, locale: Locale = 'ru'): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Get current locale from localStorage or default
export function getCurrentLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const stored = localStorage.getItem('locale');
  if (stored && (stored === 'ru' || stored === 'en')) {
    return stored;
  }
  return defaultLocale;
}

// Set locale and save to localStorage
export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}