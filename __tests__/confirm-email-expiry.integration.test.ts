import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/server", () => {
  class MockNextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      });
    }
    static redirect(url: URL | string) {
      return new Response(null, {
        status: 302,
        headers: { location: url.toString() },
      });
    }
  }

  return { NextResponse: MockNextResponse };
});

vi.mock("@/app/api/notifications/_lib/kv", () => ({
  kvGet: vi.fn(),
  kvSet: vi.fn().mockResolvedValue(undefined),
  SUB_KEY: (w: string) => `notif:sub:${w}`,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const WALLET = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
const VALID_TOKEN = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

/** Creates a minimal request-like object with nextUrl for the route handler. */
function makeRequest(token: string, wallet: string = WALLET) {
  const url = new URL(
    `http://localhost/api/notifications/confirm-email?token=${token}&wallet=${wallet}`
  );
  return { nextUrl: url, url: url.toString() } as never;
}

async function importRoute() {
  const mod = await import("@/app/api/notifications/confirm-email/route");
  return mod.GET;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/notifications/confirm-email — token expiry (issue #610)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("returns 401 when the confirmation token is older than 24 hours", async () => {
    const { kvGet } = await import("@/app/api/notifications/_lib/kv");

    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

    vi.mocked(kvGet).mockResolvedValue({
      walletAddress: WALLET,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      email: {
        address: "user@example.com",
        status: "pending",
        confirmationToken: VALID_TOKEN,
        tokenIssuedAt: twentyFiveHoursAgo,
        unsubscribeToken: "unsub-token-xyz",
        periods: { weekly: false, monthly: true, yearly: false },
        createdAt: twentyFiveHoursAgo,
      },
    });

    const GET = await importRoute();
    const res = await GET(makeRequest(VALID_TOKEN));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/invalid or expired/i);
  });

  it("redirects on success when the token is within 24 hours", async () => {
    const { kvGet } = await import("@/app/api/notifications/_lib/kv");

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    vi.mocked(kvGet).mockResolvedValue({
      walletAddress: WALLET,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      email: {
        address: "user@example.com",
        status: "pending",
        confirmationToken: VALID_TOKEN,
        tokenIssuedAt: oneHourAgo,
        unsubscribeToken: "unsub-token-xyz",
        periods: { weekly: false, monthly: true, yearly: false },
        createdAt: oneHourAgo,
      },
    });

    const GET = await importRoute();
    const res = await GET(makeRequest(VALID_TOKEN));

    expect(res.status).toBe(302);
  });

  it("returns 401 when the token does not match (timing-safe)", async () => {
    const { kvGet } = await import("@/app/api/notifications/_lib/kv");

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    vi.mocked(kvGet).mockResolvedValue({
      walletAddress: WALLET,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      email: {
        address: "user@example.com",
        status: "pending",
        confirmationToken: VALID_TOKEN,
        tokenIssuedAt: oneHourAgo,
        unsubscribeToken: "unsub-token-xyz",
        periods: { weekly: false, monthly: true, yearly: false },
        createdAt: oneHourAgo,
      },
    });

    const GET = await importRoute();
    const res = await GET(makeRequest("wrong-token-value-xyz"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/invalid or expired/i);
  });
});
