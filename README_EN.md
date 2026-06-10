<div align="center">

# EconTrainer v7.2.0

### Interactive Platform for Economic Thinking Practice

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2-ff7300)](https://recharts.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

</div>

---

## About the Project

**EconTrainer** is a comprehensive web platform for interactive study of microeconomics, macroeconomics, financial mathematics, and game theory. The project is designed as a full-featured educational application that combines 25 thematic modules, a testing system, a reference glossary, gamification with XP progression, and an achievement system. The platform is intended for economics students, educators, and anyone who wants to deepen their knowledge of economics through practical exercises and visualization of economic models.

The project runs entirely on the client side — all calculations, computations, and visualizations are performed in the user's browser without the need for server infrastructure. This ensures high performance, data privacy, and the possibility of autonomous use.

## Key Features

- **25 interactive modules** — from GDP calculation to game theory, each module includes visualizations, formulas, and practical exercises
- **45 quiz questions** with a timer, detailed explanations, and a scoring system
- **41 economic terms** in the glossary with formulas, definitions, and search functionality
- **19 achievements** — from first steps to mastery, motivational badges for progress
- **XP system and levels** — from "Novice" to "Academician", 8 ranks with progressive experience accumulation
- **Dark and light themes** with automatic detection of system preferences
- **Adaptive interface** — fully responsive design for mobile devices, tablets, and desktops
- **Progress persistence** — all data is stored in localStorage and persists across page reloads
- **All calculations in browser** — no server-side components, databases, or APIs required

## Platform Modules

| # | Module | Category | Description |
|---|--------|----------|-------------|
| 1 | **GDP & Macro Indicators** | Macroeconomics | Calculation of nominal and real GDP, GDP deflator, inflation rates. Visualization of GDP structure by components |
| 2 | **Supply & Demand** | Microeconomics | Interactive chart with market equilibrium analysis, curve shifts, and consumer/producer surplus determination |
| 3 | **Elasticity Calculator** | Microeconomics | Calculation of price elasticity, income elasticity, and cross-price elasticity with result interpretation |
| 4 | **Keynesian Cross** | Macroeconomics | Income-expenditure model with autonomous spending multiplier, visualization of equilibrium GDP and output gap |
| 5 | **Inflation Calculator** | Macroeconomics | Calculation of money depreciation, changes in purchasing power, and real value adjusted for inflation rates |
| 6 | **Phillips Curve** | Macroeconomics | Visualization of short-run and long-run Phillips curves, analysis of the inflation-unemployment tradeoff |
| 7 | **Lorenz Curve & Gini Coefficient** | Macroeconomics | Construction of the Lorenz curve, calculation of the Gini coefficient for income inequality analysis |
| 8 | **IS-LM Model** | Macroeconomics | Goods and money market equilibrium, fiscal and monetary multipliers, crowding out effect |
| 9 | **Production Possibilities Frontier (PPF)** | Microeconomics | PPF visualization, marginal rate of transformation (MRT) calculation, opportunity cost analysis |
| 10 | **Firm Cost Analysis** | Microeconomics | ATC, AVC, MC, AFC charts with identification of key points: minimum average cost, firm shutdown point |
| 11 | **Comparative Advantage** | International Economics | Ricardian model: calculation of absolute and comparative advantages, determination of trade gains |
| 12 | **Break-Even Point** | Financial Analysis | CVP analysis: break-even point calculation, margin analysis, financial safety margin |
| 13 | **Tax Calculator** | Finance | Calculation of personal income tax, value-added tax, corporate profit tax with rates and deductions |
| 14 | **Game Theory** | Microeconomics | Prisoner's dilemma, hawk-dove model, Nash equilibrium with interactive payoff matrices |
| 15 | **Market Structures** | Microeconomics | Perfect competition, monopoly, oligopoly, monopolistic competition: charts, profit, surpluses |
| 16 | **Currency Calculator** | Finance | Currency conversion, cross-rates, rate matrix, volatility simulation |
| 17 | **Economics Quiz** | Testing | 45 questions on micro- and macroeconomics with timer, explanations, and result calculation |
| 18 | **Financial Mathematics** | Finance | Calculation of compound interest, net present value (NPV), annuity payments |
| 19 | **Glossary of Terms** | Reference | 41 key economic terms with definitions, formulas, and quick search functionality |
| 20 | **Achievements** | Motivation | 19 badges for various accomplishments: from first steps to master-level proficiency |
| 21 | **Progress** | Analytics | Training statistics, activity analytics, progress dynamics visualization |

## XP System and Levels

The platform uses a gamified progression system. Experience points (XP) are awarded for each interaction with modules, determining the user's level and unlocking new achievements.

### XP Rewards

| Action | XP |
|--------|-----|
| GDP calculation | +15 XP |
| Supply & demand chart interaction | +15 XP |
| Elasticity calculation | +15 XP |
| Keynesian cross interaction | +20 XP |
| Inflation calculation | +15 XP |
| Phillips curve interaction | +20 XP |
| Lorenz curve analysis | +20 XP |
| PPF interaction | +15 XP |
| Cost analysis | +20 XP |
| Comparative advantage | +15 XP |
| Break-even calculation | +15 XP |
| Tax calculation | +20 XP |
| Game theory interaction | +20 XP |
| Market structures analysis | +25 XP |
| Currency conversion | +15 XP |
| Correct quiz answer | +10 XP per question |
| Financial math problem (correct) | +20 XP |
| Financial math problem (incorrect) | +5 XP |
| Glossary term exploration | +5 XP |

### Levels

| Level | Title | Required XP |
|-------|-------|-------------|
| 1 | Novice | 0 |
| 2 | Student | 500 |
| 3–4 | Bachelor | 1,100+ |
| 5–6 | Master | 2,800+ |
| 7–9 | PhD Student | 6,400+ |
| 10–14 | Associate Professor | 15,000+ |
| 15–19 | Professor | 40,000+ |
| 20+ | Academician | 100,000+ |

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router, SSR, and optimization |
| **TypeScript** | 5 | Static typing for code reliability |
| **Tailwind CSS** | 4 | Utility-first CSS for rapid UI development |
| **shadcn/ui** | — | UI components in New York style |
| **Recharts** | 2 | Interactive charts and data visualization |
| **Zustand** | 5 | Lightweight state management with localStorage persistence |
| **Framer Motion** | 12 | Smooth animations and transitions |
| **next-themes** | — | Dark/light theme switching |
| **Lucide React** | — | Icon set for the interface |
| **Radix UI** | — | Accessible UI component primitives |
| **Vitest** | 3 | Unit testing for XP, levels, and store logic |
| **Testing Library** | 16 | React component testing |

## Installation and Setup

### Prerequisites

- **Node.js** version 18 or higher (20+ recommended)
- **npm**, **yarn**, **pnpm**, or **bun** as package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/econom-trenazher.git
cd econom-trenazher

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will automatically find a free port (starting from 3000) and start on it. The URL will be printed to the console.

### Production Build

```bash
# Build the project
npm run build

# Run the built application
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
econom-trenazher/
├── public/                         # Static files
│   └── econom-trenazher-v5.0.zip  # Project archive for download
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with ThemeProvider
│   │   ├── page.tsx                # Main page (SPA with tabs)
│   │   ├── globals.css             # Global styles and CSS variables
│   │   └── api/
│   │       └── route.ts            # API routes
│   ├── components/
│   │   ├── economics/              # Trainer modules
│   │   │   ├── gdp-calculator.tsx          # GDP Calculator
│   │   │   ├── supply-demand.tsx           # Supply & Demand
│   │   │   ├── elasticity-calculator.tsx   # Elasticity Calculator
│   │   │   ├── keynesian-cross.tsx         # Keynesian Cross
│   │   │   ├── inflation-calculator.tsx    # Inflation Calculator
│   │   │   ├── phillips-curve.tsx          # Phillips Curve
│   │   │   ├── lorenz-curve.tsx            # Lorenz Curve / Gini
│   │   │   ├── is-lm.tsx                   # IS-LM Model
│   │   │   ├── ppf.tsx                     # Production Possibilities Frontier
│   │   │   ├── cost-analysis.tsx           # Firm Cost Analysis
│   │   │   ├── comparative-advantage.tsx   # Comparative Advantage
│   │   │   ├── break-even.tsx              # Break-Even Point
│   │   │   ├── tax-calculator.tsx          # Tax Calculator
│   │   │   ├── game-theory.tsx             # Game Theory
│   │   │   ├── market-structures.tsx       # Market Structures
│   │   │   ├── currency-calculator.tsx     # Currency Calculator
│   │   │   ├── quiz.tsx                    # Economics Quiz
│   │   │   ├── financial-math.tsx          # Financial Mathematics
│   │   │   ├── glossary.tsx                # Glossary of Terms
│   │   │   ├── achievements.tsx            # Achievement System
│   │   │   ├── progress-tracker.tsx        # Progress Tracker
│   │   │   └── theme-toggle.tsx            # Theme Toggle
│   │   └── ui/                     # shadcn/ui components (60+ components)
│   ├── store/
│   │   └── economics-store.ts      # Zustand store with localStorage
│   ├── hooks/
│   │   ├── use-mobile.ts           # Hook for mobile device detection
│   │   └── use-toast.ts            # Hook for toast notifications
│   └── lib/
│       ├── utils.ts                # Utilities (cn, formatting)
│       └── db.ts                   # Database utilities
├── package.json                    # Dependencies and scripts
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── README.md                       # Project documentation
├── README_RU.md                    # Russian documentation
├── README_EN.md                    # English documentation
├── LICENSE                         # License
└── .gitignore                      # Git exclusions
```

## Configuration

### Port

The `scripts/dev.mjs` script automatically finds a free port in the range 3000–3099 and starts the server, setting `PORT`, `NEXTAUTH_URL`, `NEXT_PUBLIC_URL`, and `NEXT_PUBLIC_APP_URL` environment variables. If port 3000 is available, the server will start there.

### Database

By default, SQLite is used (`prisma/dev.db`). PostgreSQL and MySQL are also supported. Choose your database via `DATABASE_URL` in `.env`:

| Database | `DATABASE_URL` |
|----------|----------------|
| **SQLite** (default) | `file:./dev.db` |
| **PostgreSQL** | `postgresql://user:pass@localhost:5432/econom` |
| **MySQL** | `mysql://user:pass@localhost:3306/econom` |

Database commands:

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and apply migration
npm run db:studio    # Open Prisma Studio
```

The `scripts/db-provider.mjs` script automatically detects the database type from `DATABASE_URL` and updates `prisma/schema.prisma` before running Prisma commands.

## Roadmap

- [x] IS-LM Module — investment-savings and liquidity-money model
- [x] "Market Structures" Module — from perfect competition to monopoly
- [x] "Currency Calculator" Module — exchange rates and cross-rates
- [x] Progress export to PDF report
- [x] Full multilingual support (EN/RU)
- [x] PWA manifest and metadata (Web App Manifest, viewport, theme-color)
- [x] Unit tests (Vitest + React Testing Library)
- [x] SEO: dynamic sitemap.xml and robots.txt
- [x] E2E tests (Playwright)
- [ ] LMS integration (Moodle, Canvas)
- [x] Service Worker for offline mode

---

## 👤 Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and educational materials belong to the author.

---

## 📄 License

This project is the intellectual property of Dupley Maxim Igorevich. Terms of use are described in the [LICENSE](./LICENSE) file.

---

<div align="center">

**EconTrainer v7.2.0** — © 2026 Dupley Maxim Igorevich

</div>
