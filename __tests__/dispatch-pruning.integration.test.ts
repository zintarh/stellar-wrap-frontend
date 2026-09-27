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

const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();

vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
  },
  sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
}));

// In-memory KV store for testing
const mockStore = new Map<string, unknown>();

vi.mock("@/app/api/notifications/_lib/kv", () => ({
  kvGet: vi.fn().mockImplementation(async (key: string) => mockStore.get(key) ?? null),
  kvSet: vi.fn().mockImplementation(async (key: string, val: unknown) => {
    mockStore.set(key, val);
  }),
  kvKeys: vi.fn().mockImplementation(async (pattern: string) => {
    const prefix = pattern.replace("*", "");
    return [...mockStore.keys()].filter((k) => k.startsWith(prefix));
  }),
  kvSRem: vi.fn().mockImplementation(async (key: string, member: string) => {
    const existing = mockStore.get(key);
    if (existing instanceof Set) {
      existing.delete(member);
    }
  }),
  kvSAdd: vi.fn().mockImplementation(async (key: string, member: string) => {
    let existing = mockStore.get(key);
    if (!(existing instanceof Set)) {
      existing = new Set<string>();
      mockStore.set(key, existing);
    }
    (existing as Set<string>).add(member);
  }),
  SUB_KEY: (w: string) => `notif:sub:${w}`,
  PERIOD_KEY: (period: string) => `notif:period:${period}`,
  LOG_KEY: (w: string, c: string, p: string, pk: string) => `notif:log:${w}:${c}:${p}:${pk}`,
  PRUNE_KEY: (w: string, ts: string) => `notif:prune:${w}:${ts}`,
}));

vi.mock("@/app/api/notifications/_lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/utils/notifications/pushPayloadFormatter", () => ({
  formatPushPayload: vi.fn().mockReturnValue({ title: "Test", body: "Test body", url: "/" }),
}));

vi.mock("@/app/utils/notifications/periodKey", () => ({
  getPeriodKey: vi.fn().mockReturnValue("2026-01"),
  getActivePeriodsForNow: vi.fn().mockReturnValue(["monthly"]),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDispatchCall(authHeader?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new Request("http://localhost/api/notifications/dispatch", {
    method: "POST",
    headers,
    body: JSON.stringify({ periods: ["monthly"] }),
  });
}

async function importRoute() {
  const mod = await import("@/app/api/notifications/dispatch/route");
  return mod.POST;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/notifications/dispatch expired push pruning (Issue #614)", () => {
  const CRON_SECRET = "test-cron-secret";
  const TEST_WALLET = "GCFXWEGHY52SVT2JNWFFTLW4RE35Z72G433O7576R4E4Y5V6X7Z8A9B0";

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.clear();
    process.env.CRON_SECRET = CRON_SECRET;
    process.env.VAPID_PRIVATE_KEY = "test-private-key";
    process.env.VAPID_PUBLIC_KEY = "test-public-key";

    // Set up test subscription in KV
    mockStore.set(`notif:sub:${TEST_WALLET}`, {
      walletAddress: TEST_WALLET,
      consentGiven: true,
      consentTimestamp: "2026-01-01T00:00:00.000Z",
      push: {
        subscription: { endpoint: "https://push.service.example/sub1", keys: { p256dh: "a", auth: "b" } },
        periods: { weekly: false, monthly: true, yearly: false },
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const monthlyPeriodSet = new Set<string>([TEST_WALLET]);
    mockStore.set("notif:period:monthly", monthlyPeriodSet);
  });

  it("prunes subscription on 410 Gone terminal response without retrying", async () => {
    const error410 = new Error("Subscription expired");
    (error410 as { statusCode: number }).statusCode = 410;
    sendNotificationMock.mockRejectedValue(error410);

    const POST = await importRoute();
    const req = makeDispatchCall(`Bearer ${CRON_SECRET}`);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.pruned).toBe(1);
    expect(body.dispatched).toBe(0);

    // Verify web-push sendNotification was called only once (no retries for 410)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);

    // Verify push subscription was removed from record
    const updatedRecord = mockStore.get(`notif:sub:${TEST_WALLET}`) as { push?: unknown };
    expect(updatedRecord).toBeDefined();
    expect(updatedRecord.push).toBeUndefined();

    // Verify wallet was removed from period index
    const periodSet = mockStore.get("notif:period:monthly") as Set<string>;
    expect(periodSet.has(TEST_WALLET)).toBe(false);

    // Verify prune log entry was created in KV
    const pruneKeys = [...mockStore.keys()].filter((k) => k.startsWith(`notif:prune:${TEST_WALLET}`));
    expect(pruneKeys.length).toBeGreaterThan(0);
    const pruneLog = mockStore.get(pruneKeys[0]) as { statusCode: number; channel: string };
    expect(pruneLog.statusCode).toBe(410);
    expect(pruneLog.channel).toBe("push");
  });

  it("prunes subscription on 404 Not Found terminal response without retrying", async () => {
    const error404 = new Error("Subscription not found");
    (error404 as { statusCode: number }).statusCode = 404;
    sendNotificationMock.mockRejectedValue(error404);

    const POST = await importRoute();
    const req = makeDispatchCall(`Bearer ${CRON_SECRET}`);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.pruned).toBe(1);
    expect(body.dispatched).toBe(0);

    // Verify only 1 attempt was made (no retries)
    expect(sendNotificationMock).toHaveBeenCalledTimes(1);

    // Verify push subscription removed from record
    const updatedRecord = mockStore.get(`notif:sub:${TEST_WALLET}`) as { push?: unknown };
    expect(updatedRecord.push).toBeUndefined();

    // Verify prune log entry was created in KV
    const pruneKeys = [...mockStore.keys()].filter((k) => k.startsWith(`notif:prune:${TEST_WALLET}`));
    expect(pruneKeys.length).toBeGreaterThan(0);
    const pruneLog = mockStore.get(pruneKeys[0]) as { statusCode: number };
    expect(pruneLog.statusCode).toBe(404);
  });

  it("retries on non-terminal errors (500) and does NOT prune subscription", async () => {
    const error500 = new Error("Push service error");
    (error500 as { statusCode: number }).statusCode = 500;
    sendNotificationMock.mockRejectedValue(error500);

    const POST = await importRoute();
    const req = makeDispatchCall(`Bearer ${CRON_SECRET}`);
    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.pruned).toBe(0);
    expect(body.dispatched).toBe(0);

    // Verify 4 attempts were made (1 initial + 3 retries)
    expect(sendNotificationMock).toHaveBeenCalledTimes(4);

    // Verify subscription was NOT pruned
    const record = mockStore.get(`notif:sub:${TEST_WALLET}`) as { push?: unknown };
    expect(record.push).toBeDefined();

    // Verify no prune log was recorded
    const pruneKeys = [...mockStore.keys()].filter((k) => k.startsWith(`notif:prune:${TEST_WALLET}`));
    expect(pruneKeys.length).toBe(0);
  });
});
