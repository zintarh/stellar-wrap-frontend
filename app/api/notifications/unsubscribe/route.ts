import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, kvKeys, kvSRem, SUB_KEY, PERIOD_KEY } from "../_lib/kv";
import type { SubscriptionRecord } from "@/app/types/notifications";
import { logger } from "@/app/utils/logger";
import { apiError, internalApiError } from "@/app/api/_lib/apiError";
import {
  getClientIp,
  checkRateLimit,
  rateLimitResponse,
  WRITE_IP_LIMIT,
  WRITE_IP_WINDOW,
  WRITE_TARGET_LIMIT,
  WRITE_TARGET_WINDOW,
} from "../_lib/rateLimit";

const VALID_PERIODS = ["weekly", "monthly", "yearly"] as const;

function isActive(record: SubscriptionRecord): boolean {
  return !!(record.push || record.email);
}

async function removeFromPeriodIndexes(walletAddress: string) {
  const ops = VALID_PERIODS.map((period) => kvSRem(PERIOD_KEY(period), walletAddress));
  await Promise.all(ops);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(
      `ratelimit:ip:unsubscribe:${ip}`,
      WRITE_IP_LIMIT,
      WRITE_IP_WINDOW
    );
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.resetInSeconds);
    }

    const body = (await request.json()) as {
      token?: string;
      walletAddress?: string;
      channel?: "push" | "email";
    };

    if (body.token) {
      const tokenLimit = await checkRateLimit(
        `ratelimit:token:unsubscribe:${body.token}`,
        WRITE_TARGET_LIMIT,
        WRITE_TARGET_WINDOW
      );
      if (!tokenLimit.allowed) {
        return rateLimitResponse(
          tokenLimit.resetInSeconds,
          "Too many requests for this unsubscribe link. Please try again later."
        );
      }
      const keys = await kvKeys("notif:sub:*");
      for (const key of keys) {
        const record = await kvGet<SubscriptionRecord>(key);
        if (record?.email?.unsubscribeToken === body.token) {
          const walletAddress = record.walletAddress;
          const updated: SubscriptionRecord = { ...record, email: undefined };
          await kvSet(key, updated);
          return NextResponse.json({ ok: true }, { status: 200 });
        }
      }
      return apiError("INVALID_UNSUBSCRIBE_TOKEN", "Token not found", 401);
    }

    if (body.walletAddress && body.channel) {
      const walletLimit = await checkRateLimit(
        `ratelimit:wallet:unsubscribe:${body.walletAddress}`,
        WRITE_TARGET_LIMIT,
        WRITE_TARGET_WINDOW
      );
      if (!walletLimit.allowed) {
        return rateLimitResponse(
          walletLimit.resetInSeconds,
          "Too many requests for this wallet. Please try again later."
        );
      }
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
