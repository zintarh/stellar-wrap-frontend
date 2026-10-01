# PR: fix: resolve #486 #487 #488 #489 – mobile Bridge, Token Swap docs, SettingsForm tests, XLM balance

**Branch:** `fix/486-487-488-489-mobile-docs-tests-xlm-balance`  
**Base:** `main`

---

## Summary

This PR addresses four open issues in one branch.

---

### #486 – Mobile responsiveness on Bridge (DappCard) view

**Problem:** On viewports below 768 px the DappCard used absolute-positioned children with hard-coded offsets, causing overflow and broken layout at small sizes.

**Fix:**
- Replaced absolute top/left/right child elements with a flex-column layout inside a single padded wrapper that scales with the card.
- Added responsive padding and font-size steps: `p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8`, font sizes `text-base xs:text-lg sm:text-xl…`.
- Updated `TopDapps` grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` (was jumping straight to 3 columns at md with no intermediate breakpoint), fixed horizontal padding (`px-4 sm:px-8 md:px-16`).
- Added `aria-hidden` to purely decorative overlay divs.
- Formatted interaction count with `toLocaleString()` for locale-aware display.

**Files changed:**
- `app/components/DappCard.tsx`
- `app/components/TopDapps.tsx`

---

### #487 – Token Swap architecture documentation

Created `docs/token-swap-architecture.md` covering:
- File map (page, store, service, utils)
- End-to-end data flow with ASCII diagram
- Zustand store shape and interface definitions
- Optimistic update pattern explanation
- Service layer description and stub → real Horizon migration guide
- Asset handling and Stroop conversion notes
- Virtual list strategy (`@tanstack/react-virtual`)
- Maintenance guide: adding assets, wiring real Horizon txs, adding buy-side offers
- TypeScript constraints

**Files changed:**
- `docs/token-swap-architecture.md` *(new)*

---

### #488 – Unit tests for SettingsForm

Rewrote `app/components/__tests__/SettingsForm.test.tsx` with comprehensive RTL tests:
- **Rendering:** push/email sections, email input type, Subscribe button, period checkboxes conditional on props, emailStatus messages, aria-busy
- **Push toggle:** aria-pressed reflects prop, callbacks fire correctly, disabled state blocks clicks
- **Email input:** onEmailChange on keystroke, onEmailSubmit on form submit and button click, disabled states for empty input / active status
- **Period checkboxes:** onPeriodChange fires with correct args, disabled when form is disabled, checked state reflects prop
- **Disabled/loading states:** all controls disabled when props are set
- **Accessibility:** aria-label on toggle, email input labelling, `<form>` element present

**Files changed:**
- `app/components/__tests__/SettingsForm.test.tsx`

---

### #489 – XLM balance in Pagination

**New hook** `app/hooks/useXlmBalance.ts`:
- Fetches native XLM from Horizon via `fetchWalletBalances`
- Formats result with `formatStellarAmount` (7-decimal Stellar precision)
- 10 s fetch timeout (AbortController)
- 60 s auto-refresh interval
- Cancels stale requests on re-fetch
- Returns `{ balance, status, error, refresh }`

**Pagination updates** (`app/components/Pagination.tsx`):
- Added optional `xlmBalance?: string | null` and `xlmBalanceStatus?: XlmBalanceStatus` props
- Renders an accessible badge next to the page indicator showing:
  - Spinner + "XLM" while loading
  - "XLM —" on error
  - "⊕ {balance} XLM" on success
- Badge omitted entirely when `xlmBalance` is not passed (backwards-compatible)

**Files changed:**
- `app/hooks/useXlmBalance.ts` *(new)*
- `app/components/Pagination.tsx`

---

## Checklist

- [x] Fully responsive across mobile, tablet, desktop (Bridge view)
- [x] No inline styles introduced (Tailwind classes only)
- [x] Strict TypeScript — no `any` used
- [x] WCAG AA: `aria-hidden` on decorative elements, `aria-label` on balance badge, existing ARIA labels preserved
- [x] Docs added for Token Swap feature
- [x] Unit tests added for SettingsForm
- [x] XLM balance: handles latency (loading state), timeout (AbortController), errors (error badge), 7-decimal Stroop formatting

closes #486
closes #487
closes #488
closes #489
