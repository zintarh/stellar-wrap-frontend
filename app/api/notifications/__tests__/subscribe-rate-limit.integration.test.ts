import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST as subscribePOST } from "../subscribe/route";
import { POST as subscribeEmailPOST } from "../subscribe-email/route";
import { GET as confirmEmailGET } from "../confirm-email/route";
import { GET as unsubscribeGET } from "../unsubscribe/route";
import { POST as dispatchPOST } from "../dispatch/route";
import { GET as preferencesGET, POST as preferencesPOST } from "../preferences/route";
import { GET as dataGET } from "../data/route";
import { kvKeys, kvGet, kvSet, kvDel } from "../_lib/kv";
import {
  SUBSCRIBE_IP_LIMIT,
  SUBSCRIBE_EMAIL_IP_LIMIT,
  SUBSCRIBE_EMAIL_TARGET_LIMIT,
} from "../_lib/rateLimit";
import type { SubscriptionRecord } from "@/app/types/notifications";

vi.mock("../_lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

const VALID_WALLET_1 = "GDRZZGQDRBLJBAY24O3EMZFDGZ4EY6A7L24OERKQTPLT4T7SZKLUAZVQ";
const VALID_WALLET_2 = "GBDTABC1234567890123456789012345678901234567890123456789";

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

function createGetRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "GET",
    headers,
  });
}

async function seedSubscription(
  walletAddress: string,
  overrides: Partial<SubscriptionRecord> = {},
): Promise<SubscriptionRecord> {
  const record: SubscriptionRecord = {
    walletAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
  await kvSet(`notif:sub:${walletAddress}`, record);
  return record;
}

describe("Notification Subscribe Rate Limiting & Idempotency", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const keys = await kvKeys("*");
    for (const key of keys) {
      await kvDel(key);
    }
  });

  describe("POST /api/notifications/subscribe", () => {
    it("enforces per-IP rate limit and returns 429 with Retry-After header", async () => {
      const clientIp = "192.168.1.10";
      const requestHeaders = { "x-forwarded-for": clientIp };

      const payload = {
        walletAddress: VALID_WALLET_1,
        subscription: { endpoint: "https://push.example.com/sub/1" },
        periods: { weekly: true, monthly: true, yearly: false },
      };

      // Requests up to SUBSCRIBE_IP_LIMIT should succeed
      for (let i = 0; i < SUBSCRIBE_IP_LIMIT; i++) {
        const req = createPostRequest(
          "/api/notifications/subscribe",
          payload,
          requestHeaders,
        );
        const res = await subscribePOST(req);
        expect(res.status).toBe(200);
      }

      // Limit + 1 request from same IP should be blocked with 429
      const blockedReq = createPostRequest(
        "/api/notifications/subscribe",
        payload,
        requestHeaders,
      );
      const blockedRes = await subscribePOST(blockedReq);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
      const body = await blockedRes.json();
      expect(body.error).toContain("Too many requests");

      // Request from a different IP should succeed
      const newIpReq = createPostRequest(
        "/api/notifications/subscribe",
        payload,
        { "x-forwarded-for": "192.168.1.11" },
      );
      const newIpRes = await subscribePOST(newIpReq);
      expect(newIpRes.status).toBe(200);
    });

    it("ensures repeated subscribes for an existing wallet are idempotent", async () => {
      const payload = {
        walletAddress: VALID_WALLET_1,
        subscription: { endpoint: "https://push.example.com/sub/1" },
        periods: { weekly: true, monthly: false, yearly: false },
      };

      // First subscribe
      const req1 = createPostRequest("/api/notifications/subscribe", payload, {
        "x-forwarded-for": "10.0.0.1",
      });
      const res1 = await subscribePOST(req1);
      expect(res1.status).toBe(200);

      // Second subscribe with updated periods
      const payload2 = {
        ...payload,
        periods: { weekly: true, monthly: true, yearly: true },
      };
      const req2 = createPostRequest("/api/notifications/subscribe", payload2, {
        "x-forwarded-for": "10.0.0.2",
      });
      const res2 = await subscribePOST(req2);
      expect(res2.status).toBe(200);

      // Check KV store keys - must have only 1 key for the wallet
      const subKeys = await kvKeys("notif:sub:*");
      expect(subKeys).toEqual([`notif:sub:${VALID_WALLET_1}`]);

      const record = await kvGet<SubscriptionRecord>(`notif:sub:${VALID_WALLET_1}`);
      expect(record).not.toBeNull();
      expect(record?.walletAddress).toBe(VALID_WALLET_1);
      expect(record?.push?.periods).toEqual({ weekly: true, monthly: true, yearly: true });
    });

    it("rejects invalid input with 400 and a descriptive error", async () => {
      const req = createPostRequest(
        "/api/notifications/subscribe",
        { walletAddress: "not-a-wallet", periods: { weekly: true } },
        { "x-forwarded-for": "10.0.0.50" },
      );
      const res = await subscribePOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvSet").mockRejectedValueOnce(new Error("KV down"));
      const req = createPostRequest(
        "/api/notifications/subscribe",
        {
          walletAddress: VALID_WALLET_1,
          subscription: { endpoint: "https://push.example.com/sub/1" },
          periods: { weekly: true, monthly: false, yearly: false },
        },
        { "x-forwarded-for": "10.0.0.60" },
      );
      const res = await subscribePOST(req);
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("POST /api/notifications/subscribe-email", () => {
    it("enforces per-IP rate limit and returns 429 with Retry-After header", async () => {
      const clientIp = "192.168.2.20";
      const requestHeaders = { "x-forwarded-for": clientIp };

      for (let i = 0; i < SUBSCRIBE_EMAIL_IP_LIMIT; i++) {
        const req = createPostRequest(
          "/api/notifications/subscribe-email",
          {
            walletAddress: VALID_WALLET_1,
            email: `user${i}@example.com`,
            periods: { weekly: true, monthly: false, yearly: false },
          },
          requestHeaders,
        );
        const res = await subscribeEmailPOST(req);
        expect(res.status).toBe(200);
      }

      // Next request from same IP should return 429
      const blockedReq = createPostRequest(
        "/api/notifications/subscribe-email",
        {
          walletAddress: VALID_WALLET_1,
          email: "user_blocked@example.com",
          periods: { weekly: true, monthly: false, yearly: false },
        },
        requestHeaders,
      );
      const blockedRes = await subscribeEmailPOST(blockedReq);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
    });

    it("enforces per-email-address rate limit across multiple IPs", async () => {
      const targetEmail = "victim@example.com";

      for (let i = 0; i < SUBSCRIBE_EMAIL_TARGET_LIMIT; i++) {
        const req = createPostRequest(
          "/api/notifications/subscribe-email",
          {
            walletAddress: i === 0 ? VALID_WALLET_1 : VALID_WALLET_2,
            email: targetEmail,
            periods: { weekly: true, monthly: false, yearly: false },
          },
          { "x-forwarded-for": `192.168.3.${10 + i}` },
        );
        const res = await subscribeEmailPOST(req);
        expect(res.status).toBe(200);
      }

      // Next request targeting the same email from a new IP should fail with 429
      const blockedReq = createPostRequest(
        "/api/notifications/subscribe-email",
        {
          walletAddress: VALID_WALLET_1,
          email: targetEmail,
          periods: { weekly: true, monthly: false, yearly: false },
        },
        { "x-forwarded-for": "192.168.3.99" },
      );
      const blockedRes = await subscribeEmailPOST(blockedReq);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
      const body = await blockedRes.json();
      expect(body.error).toContain("this email address");
    });

    it("ensures repeated email subscribes for an existing wallet are idempotent", async () => {
      const email = "idempotent@example.com";
      const payload = {
        walletAddress: VALID_WALLET_1,
        email,
        periods: { weekly: true, monthly: false, yearly: false },
      };

      // First subscribe
      const req1 = createPostRequest("/api/notifications/subscribe-email", payload, {
        "x-forwarded-for": "10.1.0.1",
      });
      const res1 = await subscribeEmailPOST(req1);
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.status).toBe("pending");

      // Simulate confirmation by setting email status to active in KV
      const record = await kvGet<SubscriptionRecord>(`notif:sub:${VALID_WALLET_1}`);
      if (record?.email) {
        record.email.status = "active";
        await kvSet(`notif:sub:${VALID_WALLET_1}`, record);
      }

      // Second subscribe for same wallet and email
      const req2 = createPostRequest(
        "/api/notifications/subscribe-email",
        {
          ...payload,
          periods: { weekly: true, monthly: true, yearly: false },
        },
        { "x-forwarded-for": "10.1.0.2" },
      );
      const res2 = await subscribeEmailPOST(req2);
      expect(res2.status).toBe(200);

      const subKeys = await kvKeys("notif:sub:*");
      expect(subKeys).toEqual([`notif:sub:${VALID_WALLET_1}`]);
    });

    it("rejects invalid email input with 400", async () => {
      const req = createPostRequest(
        "/api/notifications/subscribe-email",
        {
          walletAddress: VALID_WALLET_1,
          email: "not-an-email",
          periods: { weekly: true, monthly: false, yearly: false },
        },
        { "x-forwarded-for": "10.1.0.50" },
      );
      const res = await subscribeEmailPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvSet").mockRejectedValueOnce(new Error("KV down"));
      const req = createPostRequest(
        "/api/notifications/subscribe-email",
        {
          walletAddress: VALID_WALLET_1,
          email: "kvdown@example.com",
          periods: { weekly: true, monthly: false, yearly: false },
        },
        { "x-forwarded-for": "10.1.0.60" },
      );
      const res = await subscribeEmailPOST(req);
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("GET /api/notifications/confirm-email", () => {
    it("confirms a pending email subscription via token (no auth required)", async () => {
      const token = "confirm-token-abc";
      await seedSubscription(VALID_WALLET_1, {
        email: {
          address: "confirm@example.com",
          status: "pending",
          token,
          periods: { weekly: true, monthly: false, yearly: false },
        },
      });

      const req = createGetRequest(
        `/api/notifications/confirm-email?token=${token}`,
      );
      const res = await confirmEmailGET(req);
      expect([200, 302]).toContain(res.status);

      const record = await kvGet<SubscriptionRecord>(`notif:sub:${VALID_WALLET_1}`);
      expect(record?.email?.status).toBe("active");
    });

    it("rejects a missing or invalid token", async () => {
      const missing = await confirmEmailGET(
        createGetRequest("/api/notifications/confirm-email"),
      );
      expect([400, 404]).toContain(missing.status);

      const invalid = await confirmEmailGET(
        createGetRequest("/api/notifications/confirm-email?token=does-not-exist"),
      );
      expect([400, 404]).toContain(invalid.status);
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvGet").mockRejectedValueOnce(new Error("KV down"));
      const res = await confirmEmailGET(
        createGetRequest("/api/notifications/confirm-email?token=any"),
      );
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("GET /api/notifications/unsubscribe", () => {
    it("unsubscribes via token without authentication", async () => {
      const token = "unsub-token-xyz";
      await seedSubscription(VALID_WALLET_1, {
        email: {
          address: "unsub@example.com",
          status: "active",
          token,
          periods: { weekly: true, monthly: false, yearly: false },
        },
      });

      const res = await unsubscribeGET(
        createGetRequest(`/api/notifications/unsubscribe?token=${token}`),
      );
      expect([200, 302]).toContain(res.status);

      const record = await kvGet<SubscriptionRecord>(`notif:sub:${VALID_WALLET_1}`);
      expect(record?.email?.status).toBe("unsubscribed");
    });

    it("rejects a missing or invalid token", async () => {
      const missing = await unsubscribeGET(
        createGetRequest("/api/notifications/unsubscribe"),
      );
      expect([400, 404]).toContain(missing.status);

      const invalid = await unsubscribeGET(
        createGetRequest("/api/notifications/unsubscribe?token=nope"),
      );
      expect([400, 404]).toContain(invalid.status);
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvGet").mockRejectedValueOnce(new Error("KV down"));
      const res = await unsubscribeGET(
        createGetRequest("/api/notifications/unsubscribe?token=any"),
      );
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("POST /api/notifications/dispatch", () => {
    it("dispatches notifications for a valid payload", async () => {
      await seedSubscription(VALID_WALLET_1, {
        push: {
          endpoint: "https://push.example.com/sub/1",
          periods: { weekly: true, monthly: false, yearly: false },
        },
      });

      const req = createPostRequest("/api/notifications/dispatch", {
        period: "weekly",
      });
      const res = await dispatchPOST(req);
      expect([200, 202]).toContain(res.status);
      const body = await res.json();
      expect(body).toBeTypeOf("object");
    });

    it("rejects invalid input with 400", async () => {
      const req = createPostRequest("/api/notifications/dispatch", {
        period: "not-a-period",
      });
      const res = await dispatchPOST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvKeys").mockRejectedValueOnce(new Error("KV down"));
      const res = await dispatchPOST(
        createPostRequest("/api/notifications/dispatch", { period: "weekly" }),
      );
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("GET/POST /api/notifications/preferences", () => {
    it("returns preferences for an existing wallet", async () => {
      await seedSubscription(VALID_WALLET_1, {
        push: {
          endpoint: "https://push.example.com/sub/1",
          periods: { weekly: true, monthly: false, yearly: false },
        },
      });

      const res = await preferencesGET(
        createGetRequest(
          `/api/notifications/preferences?walletAddress=${VALID_WALLET_1}`,
        ),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeTypeOf("object");
    });

    it("rejects invalid input with 400", async () => {
      const res = await preferencesGET(
        createGetRequest("/api/notifications/preferences?walletAddress=bad"),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("updates preferences for a valid payload", async () => {
      await seedSubscription(VALID_WALLET_1);
      const res = await preferencesPOST(
        createPostRequest("/api/notifications/preferences", {
          walletAddress: VALID_WALLET_1,
          periods: { weekly: true, monthly: true, yearly: false },
        }),
      );
      expect(res.status).toBe(200);
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvGet").mockRejectedValueOnce(new Error("KV down"));
      const res = await preferencesGET(
        createGetRequest(
          `/api/notifications/preferences?walletAddress=${VALID_WALLET_1}`,
        ),
      );
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });

  describe("GET /api/notifications/data", () => {
    it("returns subscription data for an existing wallet", async () => {
      await seedSubscription(VALID_WALLET_1);
      const res = await dataGET(
        createGetRequest(
          `/api/notifications/data?walletAddress=${VALID_WALLET_1}`,
        ),
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toBeTypeOf("object");
    });

    it("rejects invalid input with 400", async () => {
      const res = await dataGET(
        createGetRequest("/api/notifications/data?walletAddress=bad"),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(typeof body.error).toBe("string");
    });

    it("returns 503 when KV is unavailable", async () => {
      const kv = await import("../_lib/kv");
      const spy = vi.spyOn(kv, "kvGet").mockRejectedValueOnce(new Error("KV down"));
      const res = await dataGET(
        createGetRequest(
          `/api/notifications/data?walletAddress=${VALID_WALLET_1}`,
        ),
      );
      expect([500, 503]).toContain(res.status);
      spy.mockRestore();
    });
  });
});
