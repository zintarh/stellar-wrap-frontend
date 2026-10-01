/**
 * GET /api/notifications/confirm-email?token=...&wallet=...
 *
 * Activates a pending email subscription by matching the confirmation token.
 * Redirects to /notifications?confirmed=true on success.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
// KV_FAILURE: LOUD — cannot confirm the subscription without writing the
// updated status; errors propagate so the user retries the link.
import { kvGet, kvSet, SUB_KEY } from "../_lib/kv";
import { logger } from "@/app/utils/logger";
import type { SubscriptionRecord } from "@/app/types/notifications";
import { apiError, internalApiError } from "@/app/api/_lib/apiError";
import {
  getClientIp,
  checkRateLimit,
  rateLimitDenialResponse,
  CONFIRM_EMAIL_IP_LIMIT,
  CONFIRM_EMAIL_IP_WINDOW,
  CONFIRM_EMAIL_TOKEN_LIMIT,
  CONFIRM_EMAIL_TOKEN_WINDOW,
} from "../_lib/rateLimit";

const log = logger.child("api:confirm-email");

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns false immediately if lengths differ (no content leak).
 */
function timingSafeTokenEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Confirmation tokens expire after 24 hours. */
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get("token");
    const wallet = searchParams.get("wallet");

    // This GET changes state (it activates a pending subscription), so it is
    // throttled like the other public write routes.
    const ipDenial = rateLimitDenialResponse(
      await checkRateLimit(
        `ratelimit:ip:confirm-email:${getClientIp(request)}`,
        CONFIRM_EMAIL_IP_LIMIT,
        CONFIRM_EMAIL_IP_WINDOW
      )
    );

    if (ipDenial) {
      return ipDenial;
    }

    if (!token || !wallet) {
      return apiError("INVALID_REQUEST", "Missing token or wallet parameter", 400);
    }

    const tokenDenial = rateLimitDenialResponse(
      await checkRateLimit(
        `ratelimit:token:confirm-email:${token}`,
        CONFIRM_EMAIL_TOKEN_LIMIT,
        CONFIRM_EMAIL_TOKEN_WINDOW
      )
    );

    if (tokenDenial) {
      return tokenDenial;
    }

    const record = await kvGet<SubscriptionRecord>(SUB_KEY(wallet));

    if (!record?.email) {
      return apiError("NOT_FOUND", "No pending email subscription found", 404);
    }

    if (!record?.email?.confirmationToken || !timingSafeTokenEqual(record.email.confirmationToken, token)) {
      return apiError("INVALID_CONFIRMATION_TOKEN", "Invalid or expired confirmation token", 401);
    }

    // Enforce the 24-hour expiry on the confirmation token.
    if (record.email.tokenIssuedAt) {
      const issuedAt = new Date(record.email.tokenIssuedAt).getTime();
      if (Date.now() - issuedAt > TOKEN_EXPIRY_MS) {
        return apiError("INVALID_CONFIRMATION_TOKEN", "Invalid or expired confirmation token", 401);
      }
    }

    if (record.email.status === "active") {
      // Already confirmed — just redirect
      return NextResponse.redirect(new URL("/notifications?confirmed=true", request.url));
    }

    const updated: SubscriptionRecord = {
      ...record,
      email: {
        ...record.email,
        status: "active",
        confirmationToken: "", // clear token after use
      },
    };

    await kvSet(SUB_KEY(wallet), updated);

    return NextResponse.redirect(new URL("/notifications?confirmed=true", request.url));
  } catch (err) {
    return internalApiError(log, err);
  }
}
