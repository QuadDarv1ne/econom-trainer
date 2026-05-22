# Recommended Improvements for Econom Trainer

> Top 10 high-impact improvements prioritized by value vs. effort.
> Last updated: 2026-05-22

---

## 1. Error Boundary Pages (`error.tsx` / `global-error.tsx`)

**Priority:** High | **Effort:** Low | **Files:** `src/app/error.tsx`, `src/app/global-error.tsx`

The project has zero error boundary files. When any of the 25 interactive calculator modules throws an error, the entire SPA crashes and the user sees a blank screen.

**What to do:**
- Create `src/app/error.tsx` (route-level error boundary) with localized messages and a "Try Again" button using Next.js `reset()` prop
- Create `src/app/global-error.tsx` for root-level errors during layout rendering
- Both should use the existing i18n system for Russian/English/Chinese error messages
- Wrap each dynamically imported module in `<Suspense fallback={...}>` with graceful error handling

---

## 2. Normalize Database Schema — Replace JSON Blobs with Relational Tables

**Priority:** High | **Effort:** Medium | **Files:** `prisma/schema.prisma`, `src/app/api/progress/sync/route.ts`

The `UserProgress` model stores `quizResults`, `moduleHistory`, `achievements`, and `settings` as raw JSON strings. This prevents SQL queries, indexing, aggregations, and efficient delta syncs.

**What to do:**
- Create `QuizAttempt`, `ModuleSession`, `UserAchievement`, and `UserSetting` as proper relational tables
- Add foreign keys to `UserProgress` / `User` and indexes on `userId`, `date`, `moduleId`, `score`
- Write a Prisma migration to migrate existing JSON data
- Refactor the sync API to use delta sync (send only unsynced records) instead of full-state replacement
- Enables future features: per-module analytics, leaderboards, efficient partial syncs

---

## 3. Fix Progress Sync Race Condition with Delta Sync + Auto-Sync

**Priority:** High | **Effort:** Medium | **Files:** `src/store/economics-store.ts`, `src/app/api/progress/sync/route.ts`

Current sync uses `Math.max(clientXP, serverXP)` which silently overwrites progress when using multiple devices. No conflict resolution for quiz results or module interactions.

**What to do:**
- Add `syncedAt` timestamp per record in the Zustand store
- On sync, send only unsynced records (delta) instead of the full state blob
- Server should merge by appending new records, not replacing entire arrays
- Implement automatic sync triggered by the `online` event with debouncing
- Add a sync conflict resolution UI when server data differs significantly from local data
- Add optimistic UI with rollback on sync failure

---

## 4. Add Input Sanitization + Tighten Content Security Policy

**Priority:** High | **Effort:** Low | **Files:** `src/app/api/profile/route.ts`, `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx`, `next.config.ts`

User-generated content (profile name, phone) is rendered directly in JSX without sanitization. The CSP currently allows `'unsafe-inline'` and `'unsafe-eval'`, weakening XSS protection.

**What to do:**
- Add a `sanitizeHtml` utility using `DOMPurify` (browser) or `sanitize-html` (server)
- Apply sanitization to all user-provided strings before rendering
- Add server-side sanitization in the profile PATCH API endpoint
- Tighten CSP in `next.config.ts`: remove `'unsafe-eval'` in production, add proper nonce for inline scripts
- Add `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin` headers

---

## 5. Expand E2E Test Coverage to Auth and API Flows

**Priority:** High | **Effort:** Medium | **Files:** `e2e/`, `playwright.config.ts`

The project has 19 unit test files and 6 E2E tests, but none of the E2E tests cover authentication flows or API endpoints.

**What to do:**
- Add Playwright E2E tests under `e2e/auth/` for: registration, login, password reset, 2FA setup, account deletion
- Add API integration tests for all `/api/` endpoints: register, forgot-password, reset-password, profile, profile/delete, profile/revoke-sessions
- Mock email sending (Resend API) in tests using request interceptors
- Use `test.describe.serial` for multi-step auth flows
- Target 70%+ test coverage (currently ~30-40%)

---

## 6. Convert Home Page to Server Component for SSR/SSG

**Priority:** Medium | **Effort:** Medium | **Files:** `src/app/page.tsx`

The entire main page is a client component (`'use client'`), meaning SEO crawlers see an empty page and First Contentful Paint is delayed until JS bundles load.

**What to do:**
- Convert `src/app/page.tsx` to a server component that renders the static module catalog grid server-side
- Only interactive parts (active module rendering, daily challenge) need `dynamic()` imports
- Use React Server Components for the hero section, module cards grid, and "How to use" section
- Consider generating `/modules/[id]` routes for each module as individual pages with SSR
- Expected improvement: LCP from ~1.5s to ~0.3s, proper content indexing by search engines

---

## 7. Add Cyrillic Font Subset to Geist Font Configuration

**Priority:** Medium | **Effort:** Low | **Files:** `src/app/layout.tsx`

Geist Sans and Geist Mono are loaded with `subsets: ["latin"]` only, but the app's primary language is Russian (`lang="ru"`). This causes FOUT (Flash of Unstyled Text) and layout shifts for Cyrillic characters.

**What to do:**
- Change `subsets: ["latin"]` to `subsets: ["latin", "cyrillic"]` for both Geist Sans and Geist Mono
- Add `preload: true` to avoid additional network requests
- For Chinese locale (`zh`), consider adding Noto Sans SC as a fallback font
- This eliminates visual flicker on initial page load for Russian-speaking users

---

## 8. Extract Shared Components from Dashboard and Profile Pages

**Priority:** Medium | **Effort:** Low | **Files:** `src/app/dashboard/page.tsx` (525 lines), `src/app/profile/page.tsx` (1021 lines)

Dashboard and profile pages share massive amounts of duplicated code: identical headers, 2FA setup logic, progress display cards, error/success alert patterns (~400 lines of duplication).

**What to do:**
- Extract `<AppHeader>` component with nav links, user menu, and sign-out
- Extract `<TwoFAManagement>` component handling the entire 2FA lifecycle (setup/verify/disable)
- Extract `<ProgressSummary>` component for XP/quiz/session stat cards
- Move `PasswordStrengthMeter` to `src/components/ui/password-strength-meter.tsx`
- Extract `<AlertBanner>` component for the error/success alert pattern
- Reduces total code by ~400 lines and makes maintenance significantly easier

---

## 9. Add Suspense Boundaries + Skeleton Loading States

**Priority:** Medium | **Effort:** Low | **Files:** `src/app/`, `src/components/economics/`

The app has no React Suspense boundaries or streaming loading states. The dashboard shows a full-page spinner when loading profile, blocking the entire UI.

**What to do:**
- Add `<Suspense fallback={<ModuleSkeleton />}>` around each dynamically imported module
- Add a `loading` prop to the `dynamic()` call for `DailyChallenge`
- Replace full-page spinners with skeleton UI that matches the final layout shape
- Use Next.js `loading.tsx` files for route-level loading states (e.g., `src/app/dashboard/loading.tsx`)
- Add `<Suspense>` boundaries in the root layout for the header's user dropdown (depends on session)
- Improves perceived performance and prevents Cumulative Layout Shift (CLS)

---

## 10. Complete PWA Icons and Manifest Configuration

**Priority:** Low | **Effort:** Low | **Files:** `src/app/manifest.ts`, `public/`

The PWA manifest references only `/logo.svg` as an icon with `sizes: "any"`. SVG icons are not universally supported for PWA install banners, and the `screenshots` array is empty.

**What to do:**
- Generate PNG icons at 192x192 and 512x512 from the existing SVG using `sharp` or `sharp-cli`
- Add them to `public/` and reference in the manifest with correct sizes and purposes (`any` and `maskable`)
- Add at least 2 screenshots (narrow and wide form factors) showing the app in use
- Consider using `next-pwa` for proper service worker registration instead of manual `sw.js`
- The manifest `lang` is hardcoded to `"ru"` — should be dynamically set based on user's locale
