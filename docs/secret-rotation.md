# Secret Rotation Guide

This document describes the rotation procedure for `CRON_SECRET` and the VAPID key pair
used by the push-notification system.

---

## CRON_SECRET

`CRON_SECRET` authenticates requests to `POST /api/notifications/dispatch`.
The dispatch route accepts **both** `CRON_SECRET` and `CRON_SECRET_PREVIOUS` during a
rotation window so the transition is not atomic with the deploy.

### Normal rotation

1. Generate a new secret (minimum 32 bytes of random data, base64- or hex-encoded):
   ```bash
   openssl rand -base64 32
   ```
2. In your Vercel project (or `.env.local` for local testing), set:
   - `CRON_SECRET` → the new secret
   - `CRON_SECRET_PREVIOUS` → the old secret
3. **Redeploy** the application. Both values are now accepted simultaneously.
4. **Update your cron configuration** (e.g., `vercel.json` `Authorization` header, any
   external scheduler) to use the new secret.
5. Once every running/queued cron invocation has completed or been retired, **remove**
   `CRON_SECRET_PREVIOUS` and redeploy again to close the window.

### If you believe CRON_SECRET is compromised

1. Generate a new secret immediately (step 1 above).
2. Set `CRON_SECRET` to the new value. **Do not** set `CRON_SECRET_PREVIOUS` — this
   revokes the old value immediately.
3. Redeploy.
4. Update the cron scheduler to the new value.
5. Review dispatch logs for unexpected invocations.

---

## VAPID Keys

VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) authenticate the
server to browser push services. **Rotating VAPID keys invalidates every existing push
subscription** — browsers will silently discard notifications sent with an unknown key and
eventually stop delivering them. This means every user who has enabled push notifications
must re-subscribe after the rotation.

### When to rotate

Only rotate VAPID keys if the private key is believed to be compromised. Unlike
`CRON_SECRET`, there is no safe dual-key window for VAPID — the Web Push protocol does not
support accepting two public keys simultaneously.

### Rotation procedure

1. Generate a new VAPID key pair:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Update the environment variables:
   - `VAPID_PUBLIC_KEY` → new public key
   - `VAPID_PRIVATE_KEY` → new private key
   - `VAPID_SUBJECT` → typically unchanged (e.g., `mailto:noreply@stellarwrapped.app`)
3. Redeploy the application.
4. **Prompt users to re-subscribe.** After deploy, the service worker will receive a push
   error (`410 Gone` or `401`) for existing subscriptions. The dispatch route already
   cleans up `410` subscriptions automatically. To re-acquire subscriptions:
   - Display a banner or notification prompt the next time the user visits the app.
   - Call the existing push-subscription flow (`/api/notifications/subscribe`) with the
     new VAPID public key.
5. All old subscriptions are now invalid and will be cleaned up automatically as they
   produce `410` errors on the next dispatch run.

### If you believe the VAPID private key is compromised

1. Rotate immediately following the procedure above — there is no safe grace period.
2. Treat all existing push subscriptions as invalid; do not attempt to send to them.
3. Notify users via email (if they also have an email subscription) that they need to
   re-enable push notifications.
