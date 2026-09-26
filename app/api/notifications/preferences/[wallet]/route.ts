/**
 * GET  /api/notifications/preferences/:wallet  — read subscription record
 * PUT  /api/notifications/preferences/:wallet  — update subscription record
 */

import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, SUB_KEY } from "../../_lib/kv";
import { logger } from "@/app/utils/logger";
import type { SubscriptionRecord } from "@/app/types/notifications";
import { apiError, internalApiError } from "@/app/api/_lib/apiError";
import {
  getClientIp,
  checkRateLimit,
  rateLimitDenialResponse,
  PREFERENCES_IP_LIMIT,
  PREFERENCES_IP_WINDOW,
  PREFERENCES_WALLET_LIMIT,
  PREFERENCES_WALLET_WINDOW,
} from "../../_lib/rateLimit";

const log = logger.child("api:preferences");

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

function isValidWallet(address: string): boolean {
  return typeof address === "string" && address.startsWith("G") && address.length === 56;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;

    if (!isValidWallet(wallet)) {
      return apiError("INVALID_WALLET", "Invalid wallet address", 400);
    }

    const record = await kvGet<SubscriptionRecord>(SUB_KEY(wallet));

    if (!record) {
      return apiError("NOT_FOUND", "No subscription found", 404);
    }

    return NextResponse.json(record, { status: 200 });
  } catch (err) {
    return internalApiError(log, err);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;

    // PUT is a public write, so throttle it on both the source IP and the
    // wallet being written to.
    const ipDenial = rateLimitDenialResponse(
      await checkRateLimit(
        `ratelimit:ip:preferences:${getClientIp(request)}`,
        PREFERENCES_IP_LIMIT,
        PREFERENCES_IP_WINDOW
      )
    );

    if (ipDenial) {
      return ipDenial;
    }

    if (!isValidWallet(wallet)) {
      return apiError("INVALID_WALLET", "Invalid wallet address", 400);
    }

    const walletDenial = rateLimitDenialResponse(
      await checkRateLimit(
        `ratelimit:wallet:preferences:${wallet}`,
        PREFERENCES_WALLET_LIMIT,
        PREFERENCES_WALLET_WINDOW
      )
    );

    if (walletDenial) {
      return walletDenial;
    }

    const body = (await request.json()) as Partial<SubscriptionRecord>;

    const existing = await kvGet<SubscriptionRecord>(SUB_KEY(wallet));

    if (!existing) {
      return apiError("NOT_FOUND", "No subscription found", 404);
    }

    // Merge only allowed fields — never overwrite walletAddress
    const updated: SubscriptionRecord = {
      ...existing,
      ...(body.push !== undefined && { push: body.push }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.consentGiven !== undefined && { consentGiven: body.consentGiven }),
    };

    await kvSet(SUB_KEY(wallet), updated);

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return internalApiError(log, err);
  }
}
