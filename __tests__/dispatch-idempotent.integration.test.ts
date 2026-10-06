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
  }

  class MockNextRequest extends Request {
    constructor(input: string | URL | Request, init?: RequestInit) {
      super(input, init);
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

// Use an in-process store for KV so both invocations share state.
const kvStore = new Map<string, unknown>();

vi.mock("@/app/api/notifications/_lib/kv", () => ({
  kvGet: vi.fn(async (key: string) => kvStore.get(key) ?? null),
  kvSet: vi.fn(async (key: string, value: unknown) => { kvStore.set(key, value); }),
  kvKeys: vi.fn(async (pattern: string) => {
    const prefix = pattern.replace("*", "");
    return [...kvStore.keys()].filter((k) => k.startsWith(prefix));
  }),
  SUB_KEY: (w: string) => `notif:sub:${w}`,
  LOG_KEY: (w: string, c: string, p: string, pk: string) =>
    `notif:log:${w}:${c}:${p}:${pk}`,
}));

const sendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/api/notifications/_lib/email", () => ({ sendEmail }));

vi.mock("@/app/utils/notifications/pushPayloadFormatter", () => ({
  formatPushPayload: vi.fn().mockReturnValue({ title: "", body: "", url: "" }),
}));

vi.mock("@/app/utils/notifications/emailTemplate", () => ({
  renderEmailTemplate: vi.fn().mockReturnValue("<html></html>"),
}));

vi.mock("@/app/utils/notifications/periodKey", () => ({
  getPeriodKey: vi.fn().mockReturnValue("2026-09"),
  getActivePeriodsForNow: vi.fn().mockReturnValue(["monthly"]),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const WALLET = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";
const CORRECT_SECRET = "test-cron-secret-idempotent-xyz";

function makeRequest() {
  return new Request("http://localhost/api/notifications/dispatch", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${CORRECT_SECRET}`,
    },
    body: JSON.stringify({ periods: ["monthly"] }),
  });
}

async function importRoute() {
  const mod = await import("@/app/api/notifications/dispatch/route");
  return mod.POST;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/notifications/dispatch — idempotency (issue #612)", () => {
  beforeEach(() => {
    vi.resetModules();
    kvStore.clear();
    sendEmail.mockClear();
    process.env.CRON_SECRET = CORRECT_SECRET;

    // Seed one active email subscriber
    kvStore.set(`notif:sub:${WALLET}`, {
      walletAddress: WALLET,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
      email: {
        address: "user@example.com",
        status: "active",
        confirmationToken: "",
        unsubscribeToken: "unsub-abc",
        periods: { weekly: false, monthly: true, yearly: false },
        createdAt: new Date().toISOString(),
      },
    });
  });

  it("sends exactly one email when dispatch is invoked twice for the same period", async () => {
    const POST = await importRoute();

    // First invocation
    const res1 = await POST(makeRequest() as never);
    const body1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(body1.dispatched).toBe(1);

    // Second invocation (simulates a cron retry)
    const POST2 = await importRoute();
    const res2 = await POST2(makeRequest() as never);
    const body2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(body2.dispatched).toBe(0);

    // sendEmail should have been called exactly once in total
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it("writes the log key to KV before attempting the send", async () => {
    const { kvSet } = await import("@/app/api/notifications/_lib/kv");
    const kvSetMock = vi.mocked(kvSet);

    const callOrder: string[] = [];

    kvSetMock.mockImplementation(async (key: string, value: unknown) => {
      kvStore.set(key, value);
      callOrder.push(key.includes("notif:log") ? "log" : "other");
    });

    sendEmail.mockImplementation(async () => {
      callOrder.push("send");
    });

    const POST = await importRoute();
    await POST(makeRequest() as never);

    // The log write must appear before the send in the call sequence
    const logIndex = callOrder.indexOf("log");
    const sendIndex = callOrder.indexOf("send");
    expect(logIndex).toBeGreaterThanOrEqual(0);
    expect(sendIndex).toBeGreaterThanOrEqual(0);
    expect(logIndex).toBeLessThan(sendIndex);
  });
});
