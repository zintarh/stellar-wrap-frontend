import { NextRequest } from "next/server";

jest.mock("../_lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

import { PUT as preferencesPUT } from "../preferences/[wallet]/route";
import { POST as unsubscribePOST } from "../unsubscribe/route";
import { GET as confirmEmailGET } from "../confirm-email/route";
import { kvKeys, kvSet, SUB_KEY } from "../_lib/kv";
import {
  WRITE_IP_LIMIT,
  WRITE_TARGET_LIMIT,
} from "../_lib/rateLimit";
import type { SubscriptionRecord } from "@/app/types/notifications";

const VALID_WALLET_1 = "GDRZZGQDRBLJBAY24O3EMZFDGZ4EY6A7L24OERKQTPLT4T7SZKLUAZVQ";

/** Distinct valid wallets (G + 55 chars) so per-wallet limits don't trip IP tests. */
function walletFor(i: number): string {
  return `G${String(i).padStart(55, "A")}`;
}

function createPostRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createPutRequest(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function createGetRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers,
  });
}

function createDeleteRequest(url: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "DELETE",
    headers,
  });
}

async function clearKv() {
  const keys = await kvKeys("*");
  const { kvDel } = await import("../_lib/kv");
  for (const key of keys) {
    await kvDel(key);
  }
}

async function seedRecord(wallet = VALID_WALLET_1): Promise<void> {
  const record: SubscriptionRecord = {
    walletAddress: wallet,
    consentGiven: true,
    consentTimestamp: new Date().toISOString(),
    email: {
      address: "user@example.com",
      status: "pending",
      confirmationToken: "tok-123",
      unsubscribeToken: "untok-123",
      periods: { weekly: true, monthly: false, yearly: false },
      createdAt: new Date().toISOString(),
    },
  };
  await kvSet(SUB_KEY(wallet), record);
}

describe("Notification write-route rate limiting (issue #617)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearKv();
  });

  describe("PUT /api/notifications/preferences/:wallet", () => {
    it("enforces per-IP rate limit with 429 + Retry-After", async () => {
      const headers = { "x-forwarded-for": "192.168.10.1" };

      for (let i = 0; i < WRITE_IP_LIMIT; i++) {
        const wallet = walletFor(i);
        await seedRecord(wallet);
        const res = await preferencesPUT(
          createPutRequest(
            `/api/notifications/preferences/${wallet}`,
            { consentGiven: true },
            headers,
          ),
          { params: Promise.resolve({ wallet }) },
        );
        expect(res.status).toBe(200);
      }

      const lastWallet = walletFor(WRITE_IP_LIMIT);
      await seedRecord(lastWallet);
      const blocked = await preferencesPUT(
        createPutRequest(
          `/api/notifications/preferences/${lastWallet}`,
          { consentGiven: true },
          headers,
        ),
        { params: Promise.resolve({ wallet: lastWallet }) },
      );
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });

    it("enforces per-wallet limit across IPs", async () => {
      await seedRecord();
      const params = { params: Promise.resolve({ wallet: VALID_WALLET_1 }) };

      for (let i = 0; i < WRITE_TARGET_LIMIT; i++) {
        const res = await preferencesPUT(
          createPutRequest(
            `/api/notifications/preferences/${VALID_WALLET_1}`,
            { consentGiven: true },
            { "x-forwarded-for": `192.168.11.${i}` },
          ),
          params,
        );
        expect(res.status).toBe(200);
      }

      const blocked = await preferencesPUT(
        createPutRequest(
          `/api/notifications/preferences/${VALID_WALLET_1}`,
          { consentGiven: true },
          { "x-forwarded-for": "192.168.11.99" },
        ),
        params,
      );
      expect(blocked.status).toBe(429);
    });
  });

  describe("POST /api/notifications/unsubscribe", () => {
    it("enforces per-IP rate limit", async () => {
      const headers = { "x-forwarded-for": "192.168.20.1" };

      for (let i = 0; i < WRITE_IP_LIMIT; i++) {
        const wallet = walletFor(100 + i);
        await seedRecord(wallet);
        const res = await unsubscribePOST(
          createPostRequest(
            "/api/notifications/unsubscribe",
            { walletAddress: wallet, channel: "email" },
            headers,
          ),
        );
        expect(res.status).toBe(200);
      }

      const lastWallet = walletFor(100 + WRITE_IP_LIMIT);
      await seedRecord(lastWallet);
      const blocked = await unsubscribePOST(
        createPostRequest(
          "/api/notifications/unsubscribe",
          { walletAddress: lastWallet, channel: "email" },
          headers,
        ),
      );
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("DELETE /api/notifications/data/:wallet", () => {
    it("enforces per-IP rate limit on destructive deletes", async () => {
      const { DELETE: dataDelete } = await import("../data/[wallet]/route");
      const headers = { "x-forwarded-for": "192.168.50.1" };

      for (let i = 0; i < WRITE_IP_LIMIT; i++) {
        const wallet = walletFor(200 + i);
        await seedRecord(wallet);
        const res = await dataDelete(
          createDeleteRequest(`/api/notifications/data/${wallet}`, headers),
          { params: Promise.resolve({ wallet }) },
        );
        expect(res.status).toBe(200);
      }

      const lastWallet = walletFor(200 + WRITE_IP_LIMIT);
      await seedRecord(lastWallet);
      const blocked = await dataDelete(
        createDeleteRequest(`/api/notifications/data/${lastWallet}`, headers),
        { params: Promise.resolve({ wallet: lastWallet }) },
      );
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("GET /api/notifications/confirm-email", () => {
    it("enforces per-IP rate limit against token guessing", async () => {
      await seedRecord();
      const headers = { "x-forwarded-for": "192.168.30.1" };

      const first = await confirmEmailGET(
        createGetRequest(
          `/api/notifications/confirm-email?token=tok-123&wallet=${VALID_WALLET_1}`,
          headers,
        ),
      );
      // Redirect on success (already-active path also redirects).
      expect([301, 302, 307, 308]).toContain(first.status);

      for (let i = 1; i < WRITE_IP_LIMIT; i++) {
        await confirmEmailGET(
          createGetRequest(
            `/api/notifications/confirm-email?token=tok-123&wallet=${VALID_WALLET_1}`,
            headers,
          ),
        );
      }

      const blocked = await confirmEmailGET(
        createGetRequest(
          `/api/notifications/confirm-email?token=tok-123&wallet=${VALID_WALLET_1}`,
          headers,
        ),
      );
      expect(blocked.status).toBe(429);
    });
  });
});
