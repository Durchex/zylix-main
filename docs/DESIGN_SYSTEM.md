# ZYLIX — UI Design System

**Version:** 1.0
**Status:** Complete — Milestone 5 of 13
**Live reference:** `/style-guide` in the running app (every example there is production code)

---

## 1. Brand Direction

Zylix reads as a **clean, light, premium tech retailer** (closer to Apple Store / Best Buy than a dark "gamer" aesthetic) with a warm gold accent as the signature brand color, set against near-black anchors in the header/footer for contrast and gravity. Typography is **Inter** (via `next/font/google`) — modern, highly legible, and the same family trusted by Linear/Vercel/Stripe for a "serious technology company" feel.

Wordmark: **ZYL<span style="color:#C9A24B">I</span>X** — the gold dot on the "I" is the only logo mark needed at this stage; a full icon/logotype can be commissioned later without changing any component contracts.

---

## 2. Color Tokens (`tailwind.config.ts`)

| Token | Value | Usage |
|---|---|---|
| `brand-500` | `#C9A24B` | Primary CTA, links, accents |
| `brand-600` / `brand-700` | darker gold | Hover/active states |
| `brand-100` | pale gold | Badge/tag backgrounds |
| `ink-900` | `#0A0A0C` | Header/footer surfaces, primary heading text |
| `ink-700` | `#232326` | Dark-surface borders |
| `neutral-50…900` | gray scale | Body text, borders, light-mode surfaces |
| `success` / `warning` / `error` / `info` | semantic | Alerts, badges, form validation — each has a `-subtle` background pair |

Full scale defined in [tailwind.config.ts](../apps/web/tailwind.config.ts); swatches rendered live at `/style-guide`.

---

## 3. Typography

- Font: Inter, loaded via `next/font/google` in `app/layout.tsx`, exposed as CSS variable `--font-sans`.
- Scale used across the app: `text-4xl font-bold` (page titles) → `text-2xl font-semibold` (section headings) → `text-lg font-medium` (card titles) → `text-base` (body) → `text-sm` (helper/meta text).

---

## 4. Component Library (`src/components/ui/`)

All built with `class-variance-authority` for variant management and `tailwind-merge` (via the shared `cn()` helper in `src/lib/utils.ts`) so consumers can safely override classes without specificity fights.

| Component | Variants / notes |
|---|---|
| `Button` | `primary / secondary / outline / ghost / destructive` × `sm / md / lg`, `isLoading` state with accessible spinner (icon is `aria-hidden`, loading state communicated via `aria-busy`) |
| `Badge` | `neutral / brand / success / warning / error / info` — used for order status, stock status, category tags |
| `Card` + `CardHeader/Body/Footer` | Base surface for product tiles, dashboard widgets |
| `Input` / `Textarea` / `Select` / `Checkbox` | Built-in label, error, and helper-text slots; consistent focus ring |
| `Rating` | 5-star display with half-star support, accessible `role="img"` label, unique gradient IDs (safe to render many on one page) |
| `PriceTag` | NGN-formatted via `Intl.NumberFormat`, with optional struck-through compare-at price |
| `Avatar` | Falls back to initials when no image is provided |
| `Alert` | Inline banners for order confirmations, stock warnings, payment errors |
| `Skeleton` | Loading placeholder for product grids/dashboards |
| `Dialog` | Accessible modal: focus management, Escape-to-close, backdrop click, portal-rendered — the shared primitive for auth modals, cart confirmations, quick-view |
| `Container` | Max-width page wrapper |
| `Logo` / `Footer` | Brand components; `Footer` renders "Powered by Durchex D.A.M Company LTD" on every page via the root layout |

---

## 5. Testing

- `Button.test.tsx` — renders, click handling, loading/disabled states (4 tests)
- `Rating.test.tsx` — accessible label, review count display, count omission (3 tests)
- Full suite: `npm run test --prefix apps/web` (Jest + Testing Library via `next/jest`)

---

## 6. Bugs found & fixed during this milestone

1. **Accessibility bug:** `Spinner`'s `aria-label="Loading"` was being merged into `Button`'s accessible name (screen readers announced "Loading Submitting" instead of "Submitting"). Fixed by marking the icon `aria-hidden` when embedded in a button, relying on `aria-busy` for the loading signal instead.
2. **ESLint config bug:** `eslint-config-next@16` ships a native flat-config array; the initial `eslint.config.mjs` used the legacy `FlatCompat` shim (`compat.extends("next/core-web-vitals", ...)`), which threw `Converting circular structure to JSON` under ESLint 9. Fixed by importing the config array directly (`import nextConfig from "eslint-config-next"`), which also let us drop the now-unnecessary `@eslint/eslintrc` dependency.
3. **Duplicate SVG gradient IDs:** `Rating`'s half-star used a hardcoded `id="half-star-gradient"`, which would collide (invalid HTML, wrong gradient rendered) if multiple `Rating` components render on one page — inevitable on a product listing grid. Fixed with `useId()`-scoped unique IDs per instance.
4. **Stale `zylix-*` color classes:** the Milestone 4 placeholder home page and `Footer` referenced the old ad-hoc `zylix-black/gold/silver` Tailwind classes, which no longer exist after this milestone's palette was formalized as `brand/ink/neutral`. Both were migrated to the new tokens.

---

## 7. Remaining/Known risks

- Brand palette and wordmark are original-but-provisional — if you commission a professional logo/brand kit later, only `Logo.tsx` and the `brand-*` color scale need to change; every component consumes tokens, not hardcoded colors.
- `Dialog` has basic focus-return behavior but not a full focus trap (Tab doesn't yet loop within the modal) — acceptable for now, flagged for hardening when Milestone 6 (Auth modals) exercises it more heavily.
