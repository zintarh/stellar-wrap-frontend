# Implementation Plan: Wrap Period Notifications

## Overview

Implement an opt-in notification system for Stellar Wrapped. Tasks proceed from the innermost pure logic outward to UI, then infrastructure, following the existing project conventions (Zustand, Next.js API routes, Vitest, TypeScript).

## Tasks

- [x] 1. Core data types and pure utility functions
  - Create `app/types/notifications.ts` with `SubscriptionRecord`, `DispatchLogEntry`, `PushPayload`, `PeriodPrefs`, `NotificationPreferences`, `EmailTemplateData`, and `WrapPeriod` (re-export from `wrapStore`).
  - Create `app/utils/notifications/periodKey.ts` implementing `getPeriodKey(period, now)` that returns ISO week, year-month, or year strings.
  - Create `app/utils/notifications/emailValidator.ts` implementing RFC 5322 email format validation.
  - Create `app/utils/notifications/pushPayloadFormatter.ts` implementing `formatPushPayload(period): PushPayload`.
  - Create `app/utils/notifications/emailTemplate.ts` implementing `renderEmailTemplate(data: EmailTemplateData): string` that returns branded HTML with CTA, unsubscribe link, and physical address.
  - Create `app/utils/notifications/unsubscribeToken.ts` with `generateUnsubscribeToken(): string` (crypto.randomUUID or equivalent).
  - _Requirements: 2.2, 2.3, 4.2, 6.6, 6.7_

- [ ]* 1.1 Write property tests for pure utility functions
  - **Property 1**: For any `WrapPeriod`, `formatPushPayload` returns title, body, icon, and `actionUrl = /connect?period=<period>`.
  - **Property 2**: For any `(WrapPeriod, unsubscribeToken)`, `renderEmailTemplate` HTML contains CTA URL, unsubscribe URL with token, and physical address.
  - **Property 3**: Email validator returns `false` for any non-RFC-5322 string and `true` for any valid RFC 5322 email address.
  - _Requirements: 2.2, 2.3, 4.2, 4.6, 6.6, 6.7_

- [x] 2. Notification preferences Zustand store
  - Create `app/store/notificationStore.ts` using the same `zustand` + `persist` + `createJSONStorage` pattern as `wrapStore.ts`.
  - Persist: `permissionDenied`, `consentGiven`, `lastKnownRemoteState` and `pushEnabled` / `emailEnabled` / `periods` to localStorage.
  - Expose actions: `setConsentGiven`, `setPermissionDenied`, `setPushEnabled`, `setEmailEnabled`, `setEmailStatus`, `setPeriods`, `setSyncStatus`, `setLastKnownRemoteState`, `reset`.
  - _Requirements: 3.3, 5.2, 5.4, 10.1_

- [ ]* 2.1 Write property test for store round-trip
  - **Property 4**: For any wallet address, push subscription JSON, and period preferences, after writing and re-reading the notification store, all fields are preserved without data loss.
  - _Requirements: 3.5, 4.4, 10.1, 10.3_

- [x] 3. Service worker source and registration hook
  - Create `src/sw/service-worker.ts` with `push` event handler (calls `showNotification` with `PushPayload` fields) and `notificationclick` handler (opens `event.notification.data.url`).
  - Add an esbuild build step in `package.json` (`"build:sw": "esbuild src/sw/service-worker.ts --bundle --outfile=public/sw.js --platform=browser"`) and integrate it into `"build"`.
  - Create `app/hooks/useServiceWorker.ts` implementing `UseServiceWorkerReturn` interface: detects `navigator.serviceWorker` and `window.PushManager`; registers `sw.js`; exposes `subscribe()` and `unsubscribe()`.
  - `subscribe()` requests notification permission; if granted, calls `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY })`.
  - If `isSupported` is `false`, push opt-in UI is hidden.
  - _Requirements: 2.1, 2.4, 2.5, 3.2_

- [ ]* 3.1 Write unit tests for service worker logic
  - Test `push` event handler produces correct `showNotification` call for each `WrapPeriod`.
  - Test `notificationclick` handler calls `clients.openWindow` with the correct URL.
  - Test `useServiceWorker` returns `isSupported = false` when `serviceWorker` or `PushManager` is absent.
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 4. Backend API routes — subscription management
  - Create `app/api/notifications/subscribe/route.ts` (`POST`): validates body, writes push `SubscriptionRecord` to Vercel KV at `notif:sub:{walletAddress}`.
  - Create `app/api/notifications/subscribe-email/route.ts` (`POST`): validates email with `emailValidator`, generates `confirmationToken` and `unsubscribeToken`, writes pending subscription to KV, sends confirmation email via configured email service.
  - Create `app/api/notifications/confirm-email/route.ts` (`GET`): looks up token, transitions status from `pending` to `active`, returns redirect to `/notifications?confirmed=true`.
  - Create `app/api/notifications/preferences/[wallet]/route.ts` (`GET` + `PUT`): reads and writes subscription record; validates wallet address format.
  - Create `app/api/notifications/unsubscribe/route.ts` (`POST`): accepts `{ token }` (email link) or `{ walletAddress, channel }` (preference page); removes channel data from KV.
  - Create `app/api/notifications/data/[wallet]/route.ts` (`DELETE`): marks `deletionRequested` timestamp on record; enqueues deletion confirmation email; full purge runs within 30 days (immediate for push/email data, log purge deferred).
  - _Requirements: 3.5, 4.2, 4.4, 4.5, 4.6, 5.3, 5.5, 8.1, 8.3, 8.5_

- [ ]* 4.1 Write unit tests for subscription API routes
  - Test `subscribe-email` rejects invalid emails with 400 and does not write to KV.
  - Test `confirm-email` transitions status to `active` only when token matches.
  - Test `unsubscribe` via token removes email data; verify KV write is not called when token is not found.
  - Test `DELETE /data/:wallet` marks deletion and triggers confirmation email call.
  - _Requirements: 4.2, 4.3, 4.5, 8.3, 8.5_

- [x] 5. Backend API route — scheduled dispatch
  - Create `app/api/notifications/dispatch/route.ts` (`POST`): accepts an optional `{ periods?: WrapPeriod[] }` override; defaults to evaluating current UTC time against all three period boundaries.
  - Implement `getActivePeriodsForNow(now: Date): WrapPeriod[]` in `app/utils/notifications/periodKey.ts`.
  - For each active period: scan all `notif:sub:*` keys; for each subscriber matching the period+channel, check dispatch log; if not yet dispatched, call push/email send helper, write log entry with `sent` or `failed` status after retry.
  - Implement `sendPushNotification(subscription, payload, retries = 3)` with exponential backoff (`1000ms * 2^attempt`); on 410 response, delete the subscription.
  - Implement `sendEmailNotification(record, period, retries = 3)` with same backoff; on failure after retries, log error and continue.
  - _Requirements: 6.1–6.7, 7.1–7.3, 9.1–9.4_

- [ ]* 5.1 Write property tests for dispatch logic
  - **Property 5**: For any list of subscription records with random period prefs, triggering dispatch for a given period results in attempts only for subscribers who have that period enabled on the given channel.
  - **Property 6**: For any `(walletAddress, channel, period)`, running dispatch twice within the same period window produces exactly 1 send call.
  - **Property 7**: For any failure count n ∈ {0..4}, the retry wrapper makes exactly `min(n+1, 4)` total attempts and marks failed only after 3 retries exhausted.
  - **Property 8**: For any subscriber list where one subscriber always throws, all other subscribers still receive dispatch attempts.
  - _Requirements: 6.2–6.5, 7.1–7.3, 9.1, 9.3, 9.4_

- [ ]* 5.2 Write property test for full data deletion
  - **Property 9**: For any wallet address with push, email, and dispatch log entries, after deletion request processing, no data is retrievable for that wallet address.
  - _Requirements: 8.3_

- [~] 6. Checkpoint — unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Preference Page UI
  - Create `app/notifications/page.tsx` as a client component.
  - On mount, if `address` is set, call `GET /api/notifications/preferences/:wallet` and hydrate the `notificationStore`; on failure, show last known local state with a "sync pending" badge.
  - Render GDPR consent statement (what data is stored, how it is used, deletion request link).
  - Render push channel panel: toggle, period checkboxes (weekly/monthly/yearly), and disabled state when `isSupported = false`.
  - Render email channel panel: email input with inline validation error, period checkboxes, confirmation status badge (`pending`, `active`).
  - Each toggle/checkbox change calls `PUT /api/notifications/preferences/:wallet`; display success (sonner toast) or error message; update store on success or revert to last known state on failure.
  - Render "Request Data Deletion" button that calls `DELETE /api/notifications/data/:wallet` with confirmation dialog.
  - _Requirements: 5.1–5.5, 8.1–8.3, 8.5, 10.2, 10.4_

- [ ]* 7.1 Write property test for Preference Page state rendering
  - **Property 10**: For any stored subscription state (arbitrary combinations of push/email enabled, period selections), the rendered Preference_Page controls match the stored state.
  - _Requirements: 5.2, 5.4_

- [ ]* 7.2 Write integration tests for Preference Page
  - Toggle a channel — mock API success — verify store updated and toast appears.
  - Mock API failure — verify error message and previous state retained.
  - Render with `isSupported = false` — verify push panel is disabled/hidden.
  - Render with `permissionDenied = true` — verify email panel is shown as alternative.
  - _Requirements: 5.3, 9.5, 10.4_

- [x] 8. Post-wrap notification prompt
  - In the wrap result screen (identify the final story screen in `StoryShell.tsx` or equivalent), after the last slide is displayed, check `notificationStore.consentGiven` and `notificationStore.pushEnabled` and `notificationStore.permissionDenied`.
  - If none are set, render an `<NotificationPrompt />` component (`app/components/NotificationPrompt.tsx`) as an inline banner.
  - `NotificationPrompt` shows: opt-in button (calls `useServiceWorker.subscribe()` then POSTs to `/api/notifications/subscribe`), email alternative link (if `permissionDenied` is true), and a dismiss option (sets a session flag to suppress the prompt, does not set `permissionDenied`).
  - On successful push subscription, set `pushEnabled = true` and `consentGiven = true` in store; POST subscription to API.
  - On permission denial, set `permissionDenied = true` in store and localStorage; do not show prompt again in the session.
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.1_

- [ ]* 8.1 Write unit tests for NotificationPrompt
  - `requestPermission` is not called on render, only on explicit button click.
  - After denial, `permissionDenied` flag is set and prompt does not re-render.
  - Email alternative is shown when `permissionDenied = true`.
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 9. Navbar integration
  - In `app/components/Navbar.tsx`, import a `Bell` icon from `lucide-react` and add a link to `/notifications` in the right-side icon group, visible only when `address` is non-null.
  - Add `/notifications` as a non-hidden path in `AppNavbar.tsx` (it should not be in `HIDDEN_PATHS`).
  - _Requirements: 5.1_

- [x] 10. Vercel Cron and environment configuration
  - Add `vercel.json` with a cron entry: `{ "crons": [{ "path": "/api/notifications/dispatch", "schedule": "0 * * * *" }] }` (hourly; dispatch logic determines active periods).
  - Document required environment variables in `.env.example`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `EMAIL_FROM`, `EMAIL_ENABLED`, `PHYSICAL_MAILING_ADDRESS`, `APP_BASE_URL`.
  - Add `next.config.ts` header for service worker scope if needed (ensure `public/sw.js` is served at root scope).
  - _Requirements: 2.4, 6.1_

- [~] 11. Final checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Property tests use `fast-check` (to be added as a dev dependency: `yarn add --dev fast-check`).
- The Vitest test environment is `node` by default; component tests that use `@testing-library/react` need the `jsdom` environment set via a per-file `// @vitest-environment jsdom` comment.
- The dispatch API route should be protected with a `CRON_SECRET` header check to prevent unauthenticated triggering.
- VAPID keys are generated once: `npx web-push generate-vapid-keys` and stored as environment variables — never committed to source.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["1.1", "2", "3"] },
    { "wave": 3, "tasks": ["2.1", "3.1", "4"] },
    { "wave": 4, "tasks": ["4.1", "5"] },
    { "wave": 5, "tasks": ["5.1", "5.2", "6"] },
    { "wave": 6, "tasks": ["7", "8"] },
    { "wave": 7, "tasks": ["7.1", "7.2", "8.1", "9", "10"] },
    { "wave": 8, "tasks": ["11"] }
  ]
}
```
