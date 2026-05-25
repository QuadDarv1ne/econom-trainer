<div align="center">

# Экономический тренажёр v7.2.0

### Интерактивная платформа для тренировки экономического мышления

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2-ff7300)](https://recharts.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Автор:** Дуплей Максим Игоревич

**Интеллектуальная собственность:** Дуплей Максим Игоревич

</div>

---

## 📖 Языковые версии

- [🇷🇺 Русская версия](README_RU.md)
- [🇬🇧 English version](README_EN.md)

> Приложение также поддерживает 🇨🇳 китайский язык (переключение в интерфейсе).

---

## О проекте

**Экономический тренажёр** — это комплексная веб-платформа для интерактивного изучения микроэкономики, макроэкономики, финансовой математики и теории игр. Проект разработан как полноценное образовательное приложение, объединяющее 25 тематических модулей, систему тестирования, справочный глоссарий, геймификацию с XP-прогрессией и систему достижений.

Проект полностью работает на стороне клиента — все вычисления, расчёты и визуализации выполняются в браузере пользователя без необходимости серверной инфраструктуры.

## Ключевые возможности

- **25 интерактивных модулей** — от расчёта ВВП до теории игр
- **45 вопросов квиза** с таймером и подробными пояснениями
- **41 экономический термин** в глоссарии
- **19 достижений** — от первых шагов до мастерства
- **XP-система и уровни** — от «Новичка» до «Академика»
- **Тёмная и светлая тема** с автоматическим определением
- **Адаптивный интерфейс** для всех устройств
- **Сохранение прогресса** в localStorage

## Быстрый старт

```bash
git clone https://github.com/your-username/econom-trenazher.git
cd econom-trenazher
npm install
npm run dev
```

Приложение автоматически найдёт свободный порт (начиная с 3000) и запустится на нём. URL будет выведен в консоль.

## Конфигурация

### Порт

Скрипт `scripts/dev.mjs` автоматически находит свободный порт в диапазоне 3000–3099 и запускает сервер, устанавливая переменные `PORT`, `NEXTAUTH_URL`, `NEXT_PUBLIC_URL`, `NEXT_PUBLIC_APP_URL`. Если порт 3000 свободен — сервер запустится на нём.

### База данных

По умолчанию используется SQLite (файл `prisma/dev.db`). Поддерживаются также PostgreSQL и MySQL. Выберите БД через `DATABASE_URL` в `.env`:

| База данных | `DATABASE_URL` |
|-------------|----------------|
| **SQLite** (по умолчанию) | `file:./dev.db` |
| **PostgreSQL** | `postgresql://user:pass@localhost:5432/econom` |
| **MySQL** | `mysql://user:pass@localhost:3306/econom` |

Команды для работы с БД:

```bash
npm run db:generate  # Сгенерировать клиент Prisma
npm run db:push      # Применить схему к БД
npm run db:migrate   # Создать и применить миграцию
npm run db:studio    # Открыть Prisma Studio
```

Скрипт `scripts/db-provider.mjs` автоматически определяет тип БД по `DATABASE_URL` и обновляет `prisma/schema.prisma` перед выполнением команд Prisma.

## Технологии

| Технология | Назначение |
|------------|------------|
| **Next.js 16** | React-фреймворк с App Router |
| **TypeScript 5** | Статическая типизация |
| **Tailwind CSS 4** | Утилитарные CSS-стили |
| **shadcn/ui** | Компоненты интерфейса |
| **Recharts 2** | Интерактивные графики |
| **Zustand 5** | Управление состоянием |
| **Framer Motion 12** | Анимации и переходы |
| **Vitest 3** | Unit-тестирование |

## Дорожная карта

- [x] Модуль IS-LM
- [x] Модуль «Рыночные структуры»
- [x] Модуль «Валютный калькулятор»
- [x] Экспорт прогресса в PDF
- [x] Полная мультиязычность (EN/RU)
- [x] PWA-манифест и метаданные
- [x] Unit-тесты
- [x] SEO: sitemap.xml и robots.txt
- [x] E2E-тесты (Playwright)
- [ ] Интеграция с LMS (Moodle, Canvas)
- [x] Service Worker для офлайн-работы

---

**Экономический тренажёр v7.0** — © 2025 Дуплей Максим Игоревич
