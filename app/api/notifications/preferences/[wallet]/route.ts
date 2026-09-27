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
  rateLimitResponse,
  WRITE_IP_LIMIT,
  WRITE_IP_WINDOW,
  WRITE_TARGET_LIMIT,
  WRITE_TARGET_WINDOW,
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

    if (!isValidWallet(wallet)) {
      return apiError("INVALID_WALLET", "Invalid wallet address", 400);
    }

    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(
      `ratelimit:ip:preferences:${ip}`,
      WRITE_IP_LIMIT,
      WRITE_IP_WINDOW
    );
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetInSeconds);
    }
    const walletLimit = await checkRateLimit(
      `ratelimit:wallet:preferences:${wallet}`,
      WRITE_TARGET_LIMIT,
      WRITE_TARGET_WINDOW
    );
    if (!walletLimit.allowed) {
      return rateLimitResponse(
        walletLimit.resetInSeconds,
        "Too many requests for this wallet. Please try again later."
      );
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
