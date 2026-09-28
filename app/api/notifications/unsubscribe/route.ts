import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { kvGet, kvSet, kvKeys, kvSRem, SUB_KEY, PERIOD_KEY } from "../_lib/kv";
import type { SubscriptionRecord } from "@/app/types/notifications";
import { logger } from "@/app/utils/logger";
import { apiError, internalApiError } from "@/app/api/_lib/apiError";

const VALID_PERIODS = ["weekly", "monthly", "yearly"] as const;

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns false immediately if lengths differ (no content leak).
 */
function timingSafeTokenEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function isActive(record: SubscriptionRecord): boolean {
  return !!(record.push || record.email);
}

async function removeFromPeriodIndexes(walletAddress: string) {
  const ops = VALID_PERIODS.map((period) => kvSRem(PERIOD_KEY(period), walletAddress));
  await Promise.all(ops);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      token?: string;
      walletAddress?: string;
      channel?: "push" | "email";
    };

    if (body.token) {
      const keys = await kvKeys("notif:sub:*");
      for (const key of keys) {
        const record = await kvGet<SubscriptionRecord>(key);
        if (record?.email?.unsubscribeToken && timingSafeTokenEqual(record.email.unsubscribeToken, body.token)) {
          const walletAddress = record.walletAddress;
          const updated: SubscriptionRecord = { ...record, email: undefined };
          await kvSet(key, updated);
          return NextResponse.json({ ok: true }, { status: 200 });
        }
      }
      return apiError("INVALID_UNSUBSCRIBE_TOKEN", "Token not found", 401);
    }

    if (body.walletAddress && body.channel) {
      const record = await kvGet<SubscriptionRecord>(SUB_KEY(body.walletAddress));
      if (!record) {
        return apiError("NOT_FOUND", "No subscription found", 404);
      }

      const updated: SubscriptionRecord =
        body.channel === "push" ? { ...record, push: undefined } : { ...record, email: undefined };

      await kvSet(SUB_KEY(body.walletAddress), updated);

      if (body.channel === "push") {
        await removeFromPeriodIndexes(body.walletAddress);
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return apiError("INVALID_REQUEST", "Provide either token or walletAddress and channel", 400);
  } catch (err) {
    return internalApiError(logger, err);
  }
}
