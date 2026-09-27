/**
 * POST /api/notifications/dispatch
 *
 * Called by the Vercel Cron job (hourly).
 * Evaluates which wrap periods have just started and fans out push/email
 * notifications to all matching subscribers.
 *
 * Protected by CRON_SECRET to prevent unauthenticated triggering.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { kvGet, kvSet, kvKeys, kvSRem, SUB_KEY, LOG_KEY, PERIOD_KEY, PRUNE_KEY } from "../_lib/kv";
import { sendEmail } from "../_lib/email";
import { formatPushPayload } from "@app/utils/notifications/pushPayloadFormatter";
import { renderEmailTemplate } from "@app/utils/notifications/emailTemplate";
import { logger } from "@/app/utils/logger";
import { getPeriodKey, getActivePeriodsForNow } from "@app/utils/notifications/periodKey";
import type { SubscriptionRecord, DispatchLogEntry, WrapPeriod, PruneLogEntry } from "@app/types/notifications";
import { apiError, internalApiError } from "@/app/api/_lib/apiError";

const log = logger.child("api:dispatch");

const PERIOD_LABEL: Record<WrapPeriod, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const VALID_PERIODS = ["weekly", "monthly", "yearly"] as const;

// ─── Push Error Classification Helpers ───────────────────────────────────────

function getPushErrorStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as { statusCode?: number; status?: number };
    return e.statusCode ?? e.status;
  }
  return undefined;
}

function isTerminalPushError(err: unknown): boolean {
  const status = getPushErrorStatus(err);
  return status === 404 || status === 410;
}

// ─── Retry with exponential backoff ──────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  shouldRetry?: (err: unknown) => boolean
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (shouldRetry && !shouldRetry(err)) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

// ─── Pruning Helper ──────────────────────────────────────────────────────────

async function prunePushSubscription(walletAddress: string, statusCode: number): Promise<void> {
  // 1. Remove push subscription from SubscriptionRecord
  const record = await kvGet<SubscriptionRecord>(SUB_KEY(walletAddress));
  if (record) {
    const updatedRecord: SubscriptionRecord = { ...record, push: undefined };
    await kvSet(SUB_KEY(walletAddress), updatedRecord);
  }

  // 2. Remove wallet address from period indexes
  await Promise.all(VALID_PERIODS.map((period) => kvSRem(PERIOD_KEY(period), walletAddress)));

  // 3. Record pruning in KV and log
  const prunedAt = new Date().toISOString();
  const pruneLogEntry: PruneLogEntry = {
    walletAddress,
    channel: "push",
    statusCode,
    prunedAt,
  };
  await kvSet(PRUNE_KEY(walletAddress, prunedAt), pruneLogEntry);

  log.warn({ walletAddress, statusCode, prunedAt }, `Pruned expired web-push subscription (${statusCode})`);
}

// ─── Push dispatch ────────────────────────────────────────────────────────────

async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  walletAddress: string,
  period: WrapPeriod
): Promise<{ success: boolean; pruned: boolean }> {
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:noreply@stellarwrapped.app";

  if (!vapidPrivateKey || !vapidPublicKey) {
    log.warn("VAPID keys not configured — skipping push");
    return { success: false, pruned: false };
  }

  const webPush = await import("web-push");
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = formatPushPayload(period);

  try {
    await withRetry(
      async () => {
        const result = await webPush.sendNotification(
          subscription as Parameters<typeof webPush.sendNotification>[0],
          JSON.stringify(payload)
        );
        return result;
      },
      3,
      (err) => !isTerminalPushError(err)
    );
    return { success: true, pruned: false };
  } catch (err: unknown) {
    const status = getPushErrorStatus(err);
    if (isTerminalPushError(err)) {
      await prunePushSubscription(walletAddress, status ?? 410);
      return { success: false, pruned: true };
    }
    throw err;
  }
}

// ─── Email dispatch ───────────────────────────────────────────────────────────

async function sendEmailNotification(
  emailAddress: string,
  unsubscribeToken: string,
  period: WrapPeriod
): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const physicalAddress =
    process.env.PHYSICAL_MAILING_ADDRESS ?? "Stellar Wrapped, Address on file";

  const html = renderEmailTemplate({
    period,
    periodLabel: PERIOD_LABEL[period],
    ctaUrl: `${baseUrl}/connect?period=${period}`,
    unsubscribeUrl: `${baseUrl}/api/notifications/unsubscribe?token=${unsubscribeToken}`,
    physicalAddress,
  });

  await withRetry(() =>
    sendEmail({
      to: emailAddress,
      subject: `Your ${PERIOD_LABEL[period]} Stellar Wrapped is ready! 🎉`,
      html,
    })
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify cron secret — fail closed if not configured
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error("CRON_SECRET is not configured — refusing to serve requests");
    return apiError("INTERNAL_ERROR", "Server misconfiguration", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const secretBuf = Buffer.from(cronSecret);
  const tokenBuf = Buffer.from(token);

  if (secretBuf.length !== tokenBuf.length || !crypto.timingSafeEqual(secretBuf, tokenBuf)) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { periods?: WrapPeriod[] };
    const now = new Date();
    const activePeriods: WrapPeriod[] = body.periods ?? getActivePeriodsForNow(now);

    if (activePeriods.length === 0) {
      return NextResponse.json({ ok: true, dispatched: 0, pruned: 0, message: "No active periods" });
    }

    // Scan all subscription records
    const subKeys = await kvKeys("notif:sub:*");
    let dispatched = 0;
    let pruned = 0;

    for (const key of subKeys) {
      const record = await kvGet<SubscriptionRecord>(key);
      if (!record || record.deletionRequested) continue;

      for (const period of activePeriods) {
        const periodKey = getPeriodKey(period, now);

        // ── Push ──
        if (record.push?.periods[period] && record.push.subscription) {
          const logKey = LOG_KEY(record.walletAddress, "push", period, periodKey);
          const existing = await kvGet<DispatchLogEntry>(logKey);

          if (!existing) {
            let status: "sent" | "failed" | "pruned" = "sent";
            let attempts = 1;

            try {
              const res = await sendPushNotification(
                record.push.subscription,
                record.walletAddress,
                period
              );
              if (res.pruned) {
                status = "pruned";
                pruned++;
              }
            } catch {
              status = "failed";
              attempts = 4; // 1 initial + 3 retries
            }

            const logEntry: DispatchLogEntry = {
              walletAddress: record.walletAddress,
              channel: "push",
              period,
              periodKey,
              sentAt: new Date().toISOString(),
              status,
              attempts,
            };
            await kvSet(logKey, logEntry);
            if (status === "sent") dispatched++;
          }
        }

        // ── Email ──
        if (
          record.email?.status === "active" &&
          record.email.periods[period] &&
          record.email.address
        ) {
          const logKey = LOG_KEY(record.walletAddress, "email", period, periodKey);
          const existing = await kvGet<DispatchLogEntry>(logKey);

          if (!existing) {
            let status: "sent" | "failed" = "sent";
            let attempts = 1;

            try {
              await sendEmailNotification(
                record.email.address,
                record.email.unsubscribeToken,
                period
              );
            } catch {
              status = "failed";
              attempts = 4;
            }

            const logEntry: DispatchLogEntry = {
              walletAddress: record.walletAddress,
              channel: "email",
              period,
              periodKey,
              sentAt: new Date().toISOString(),
              status,
              attempts,
            };
            await kvSet(logKey, logEntry);
            if (status === "sent") dispatched++;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, dispatched, pruned, periods: activePeriods });
  } catch (err) {
    return internalApiError(log, err);
  }
}

