/**
 * POST /api/notifications/subscribe-email
 *
 * Validates an email address, writes a pending subscription to KV,
 * and sends a confirmation email.
 */

import { NextRequest, NextResponse } from "next/server";
import { kvGet, kvSet, SUB_KEY } from "../_lib/kv";
import { sendEmail } from "../_lib/email";
import { isValidEmail } from "@/app/utils/notifications/emailValidator";
import { generateUnsubscribeToken } from "@/app/utils/notifications/unsubscribeToken";
import type { SubscriptionRecord, PeriodPrefs } from "@/app/types/notifications";

function isValidWallet(address: string): boolean {
  return typeof address === "string" && address.startsWith("G") && address.length === 56;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, email, periods } = body as {
      walletAddress: string;
      email: string;
      periods: PeriodPrefs;
    };

    if (!isValidWallet(walletAddress)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const confirmationToken = generateUnsubscribeToken();
    const unsubscribeToken = generateUnsubscribeToken();
    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

    const existing = (await kvGet<SubscriptionRecord>(SUB_KEY(walletAddress))) ?? {
      walletAddress,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
    };

    const updated: SubscriptionRecord = {
      ...existing,
      email: {
        address: email,
        status: "pending",
        confirmationToken,
        unsubscribeToken,
        periods: periods ?? { weekly: false, monthly: false, yearly: false },
        createdAt: new Date().toISOString(),
      },
    };

    await kvSet(SUB_KEY(walletAddress), updated);

    const confirmUrl = `${baseUrl}/api/notifications/confirm-email?token=${confirmationToken}&wallet=${walletAddress}`;

    await sendEmail({
      to: email,
      subject: "Confirm your Stellar Wrapped notifications",
      html: `
        <p>Click the link below to confirm your email subscription to Stellar Wrapped notifications:</p>
        <p><a href="${confirmUrl}">Confirm subscription</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    return NextResponse.json({ ok: true, status: "pending" }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/notifications/subscribe-email]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
