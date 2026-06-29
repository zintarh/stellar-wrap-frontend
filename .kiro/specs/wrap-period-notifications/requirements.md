# Requirements Document

## Introduction

Stellar Wrapped is a "Spotify Wrapped"-style app for Stellar blockchain wallet activity. Currently, users have no way to know when a new wrap period becomes available — they must manually revisit the app. This feature adds an opt-in notification system that re-engages users at the start of each new wrap period (weekly, monthly, or yearly) via push notifications and/or email.

This is a significant, greenfield feature requiring new backend infrastructure (a scheduled job service, optional email service integration, and push notification support via a service worker). Because the app currently has no notification system and no user registration, the design must introduce these capabilities with minimal friction, full GDPR compliance, and an opt-in-only model.

---

## Glossary

- **Notification_Service**: The backend component responsible for storing notification preferences, triggering scheduled notifications, and managing subscriptions.
- **Subscription_Store**: The persistent data store that holds notification preferences keyed by wallet address.
- **Push_Notification**: A browser-native notification delivered via the Web Push API, requiring a service worker and explicit user permission.
- **Email_Notification**: A templated email sent to a registered address at the start of each wrap period.
- **Service_Worker**: A background browser script that enables offline support and push notification receipt.
- **Wrap_Period**: A time window for which wallet activity is summarised — one of `weekly`, `monthly`, or `yearly`.
- **Period_Boundary**: The UTC timestamp at which a new wrap period begins (e.g. 00:00 UTC on the first day of a month).
- **Preference_Page**: The in-app UI where users manage their notification channel selections and subscribed periods.
- **Opt_In**: An explicit, affirmative user action to enable a notification channel. No notification is sent without an opt-in.
- **Unsubscribe_Token**: A unique, cryptographically random token embedded in every email that allows one-click unsubscription without requiring login.
- **VAPID_Key**: A Voluntary Application Server Identification key pair used to authenticate push notification delivery.
- **CAN-SPAM**: US federal law governing commercial email; requires an unsubscribe mechanism and physical address.
- **GDPR**: EU General Data Protection Regulation; requires lawful basis for processing personal data, right to erasure, and explicit consent.

---

## Requirements

### Requirement 1: Notification Channel Design Decision

**User Story:** As a product owner, I want a documented tradeoff analysis of push vs. email notifications, so that the team can make an informed implementation decision.

#### Acceptance Criteria

1. THE Notification_Service SHALL support both push notifications and email notifications as independent, opt-in channels.
2. THE Notification_Service SHALL allow users to subscribe to push only, email only, or both channels simultaneously.
3. WHERE email notifications are enabled, THE Notification_Service SHALL treat email collection as optional and separate from wallet connection.
4. WHERE push notifications are enabled, THE Notification_Service SHALL treat browser permission as a prerequisite and SHALL NOT send push notifications without it.

---

### Requirement 2: Service Worker and Push Notification Infrastructure

**User Story:** As a developer, I want a service worker with push notification support, so that the app can receive and display push notifications even when the browser tab is closed.

#### Acceptance Criteria

1. THE Service_Worker SHALL be registered on the Next.js frontend and SHALL handle `push` events from the browser's Push API.
2. WHEN a push event is received, THE Service_Worker SHALL display a notification with a title, body, icon, and a deep-link action URL.
3. WHEN a user clicks a push notification, THE Service_Worker SHALL navigate the browser to `/connect` with the relevant wrap period pre-selected as a URL query parameter.
4. THE Service_Worker SHALL cache the VAPID public key at registration time and SHALL use it for all push subscription requests.
5. IF the browser does not support service workers or the Push API, THEN THE Notification_Service SHALL disable the push notification opt-in UI and SHALL NOT attempt registration.

---

### Requirement 3: Push Notification Permission Request

**User Story:** As a user, I want to be asked for notification permission in a non-intrusive way, so that I can opt in without feeling pressured.

#### Acceptance Criteria

1. WHEN a user successfully completes their first wrap view, THE Notification_Service SHALL display a permission prompt offering to notify them when the next period is ready.
2. THE Notification_Service SHALL request browser notification permission only after the user clicks an explicit opt-in button — not on page load.
3. IF the user denies browser notification permission, THEN THE Notification_Service SHALL record the denial in localStorage and SHALL NOT display the permission prompt again during the same browser session.
4. IF the user has previously denied browser notification permission, THEN THE Notification_Service SHALL present the email notification option as an alternative channel.
5. WHEN a push subscription is successfully created, THE Notification_Service SHALL persist the subscription endpoint and VAPID keys to the Subscription_Store keyed by wallet address.

---

### Requirement 4: Email Notification Collection and Opt-In

**User Story:** As a user, I want to optionally provide my email address to receive wrap notifications, so that I don't miss new periods even if I don't use browser notifications.

#### Acceptance Criteria

1. WHEN a user is on the Preference_Page, THE Notification_Service SHALL present an optional email input field for subscribing to email notifications.
2. WHEN a user submits an email address, THE Notification_Service SHALL validate that the address conforms to RFC 5322 format before persisting it.
3. IF an email address fails format validation, THEN THE Notification_Service SHALL display an inline error message and SHALL NOT persist the address.
4. WHEN a valid email is submitted, THE Notification_Service SHALL store the email address, the associated wallet address, and the subscribed periods in the Subscription_Store.
5. THE Notification_Service SHALL send a confirmation email to the submitted address before activating email notifications, and SHALL only activate the subscription upon the user clicking the confirmation link.
6. WHERE email notifications are active, THE Notification_Service SHALL include an Unsubscribe_Token link in every outbound email that, when clicked, immediately deactivates the subscription.

---

### Requirement 5: Notification Preferences Page

**User Story:** As a user, I want a dedicated page to manage my notification preferences, so that I can subscribe, unsubscribe, and change settings at any time.

#### Acceptance Criteria

1. THE Notification_Service SHALL provide a Preference_Page accessible from the application navbar.
2. THE Preference_Page SHALL display the current status of each notification channel (push and email) for the connected wallet address.
3. WHEN a user toggles a notification channel on the Preference_Page, THE Notification_Service SHALL update the Subscription_Store within 2 seconds and SHALL display a success or error confirmation.
4. THE Preference_Page SHALL allow users to select which wrap periods (weekly, monthly, yearly) they wish to receive notifications for, independently per channel.
5. WHEN a user removes their email address on the Preference_Page, THE Notification_Service SHALL delete the email address from the Subscription_Store and SHALL send a final unsubscription confirmation email.

---

### Requirement 6: Scheduled Notification Dispatch

**User Story:** As a user, I want to receive a notification at the start of each new wrap period, so that I am prompted to view my latest Stellar activity summary.

#### Acceptance Criteria

1. THE Notification_Service SHALL run a scheduled job that evaluates Period_Boundaries and dispatches notifications at the start of each wrap period.
2. WHEN a Period_Boundary is reached for a `weekly` period, THE Notification_Service SHALL dispatch notifications to all subscribers with weekly notifications enabled.
3. WHEN a Period_Boundary is reached for a `monthly` period, THE Notification_Service SHALL dispatch notifications to all subscribers with monthly notifications enabled.
4. WHEN a Period_Boundary is reached for a `yearly` period, THE Notification_Service SHALL dispatch notifications to all subscribers with yearly notifications enabled.
5. THE Notification_Service SHALL dispatch at most 1 notification per user per period per channel — duplicate dispatch within the same period SHALL be suppressed.
6. WHEN dispatching a push notification, THE Notification_Service SHALL include a payload with the message `"Your [Period] Stellar Wrapped is ready! 🎉"` and a deep-link URL to `/connect?period=[period]`.
7. WHEN dispatching an email notification, THE Notification_Service SHALL use a branded, responsive HTML email template containing a CTA button that deep-links to `/connect?period=[period]`, an Unsubscribe_Token link, and the sender's physical mailing address (CAN-SPAM compliance).

---

### Requirement 7: Rate Limiting

**User Story:** As a user, I want to receive at most one notification per period, so that I am not spammed if the notification system runs more than once.

#### Acceptance Criteria

1. THE Notification_Service SHALL maintain a dispatch log recording the wallet address, channel, and period for every notification sent.
2. BEFORE dispatching a notification, THE Notification_Service SHALL check the dispatch log, and IF a notification for the same wallet address, channel, and period has already been sent, THEN THE Notification_Service SHALL skip the dispatch.
3. THE Notification_Service SHALL enforce a maximum of 1 notification per wallet address per wrap period per channel.

---

### Requirement 8: GDPR Compliance and Data Deletion

**User Story:** As a user, I want my personal data handled lawfully and erasable on request, so that my privacy rights are respected.

#### Acceptance Criteria

1. THE Notification_Service SHALL collect notification preferences and email addresses only after obtaining explicit, informed user consent.
2. THE Notification_Service SHALL present a clear consent statement on the Preference_Page that describes what data is stored, how it is used, and how to request deletion.
3. WHEN a user requests data deletion on the Preference_Page, THE Notification_Service SHALL delete all stored data for that wallet address — including email addresses, push subscriptions, and dispatch logs — within 30 days.
4. THE Notification_Service SHALL not share stored email addresses or push subscriptions with third parties beyond the configured email delivery service.
5. WHEN a user's data is fully deleted, THE Notification_Service SHALL send a deletion confirmation email to the registered email address if one exists.

---

### Requirement 9: Error Handling and Resilience

**User Story:** As a developer, I want the notification system to degrade gracefully on failure, so that transient errors do not permanently block users from receiving notifications.

#### Acceptance Criteria

1. IF a push notification dispatch fails due to a network or push service error, THEN THE Notification_Service SHALL retry the dispatch up to 3 times with exponential backoff before marking it as failed.
2. IF a push subscription endpoint returns a 410 Gone response, THEN THE Notification_Service SHALL immediately remove that subscription from the Subscription_Store.
3. IF an email dispatch fails, THEN THE Notification_Service SHALL retry the dispatch up to 3 times before logging the failure and continuing to the next subscriber.
4. WHEN a dispatch job encounters a fatal error, THE Notification_Service SHALL log the error with sufficient context for diagnosis and SHALL NOT terminate processing for remaining subscribers.
5. IF the Notification_Service is unavailable when a user attempts to update preferences, THEN THE Preference_Page SHALL display a descriptive error message and SHALL retain the previous preference state.

---

### Requirement 10: Notification Subscription State Persistence

**User Story:** As a user, I want my notification preferences to persist across sessions, so that I don't need to re-subscribe every time I visit the app.

#### Acceptance Criteria

1. THE Subscription_Store SHALL persist notification preferences durably (surviving server restarts) keyed by wallet address.
2. WHEN a user navigates to the Preference_Page with a previously connected wallet address, THE Preference_Page SHALL load and display the current subscription state from the Subscription_Store within 3 seconds.
3. THE Notification_Service SHALL associate notification preferences with the wallet address, not with a browser session, so that preferences are accessible when the same wallet is connected from a different device.
4. WHERE the Preference_Page cannot retrieve preferences due to a Notification_Service failure, THE Preference_Page SHALL display the last known local state and indicate that synchronisation is pending.
