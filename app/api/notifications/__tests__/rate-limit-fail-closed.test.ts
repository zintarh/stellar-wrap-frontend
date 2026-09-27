import { NextRequest } from "next/server";
import { checkRateLimit } from "../_lib/rateLimit";
import { POST as unsubscribePOST } from "../unsubscribe/route";

jest.mock("../_lib/kv", () => {
  const actual = jest.requireActual("../_lib/kv");
  const failure = jest.fn().mockRejectedValue(new Error("KV unavailable"));
  return {
    ...actual,
    kvGet: failure,
    kvSet: failure,
  };
});

function createPostRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.168.40.1",
    },
    body: JSON.stringify(body),
  });
}

describe("Rate limiter fail-closed behavior (issue #617)", () => {
  it("denies when KV reads fail", async () => {
    const result = await checkRateLimit("ratelimit:ip:test:1.2.3.4", 100, 60);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.reason).toBe("kv_unavailable");
  });

  it("route returns 429 instead of an unlimited pass when KV is down", async () => {
    const res = await unsubscribePOST(
      createPostRequest("/api/notifications/unsubscribe", {
        walletAddress: "GDRZZGQDRBLJBAY24O3EMZFDGZ4EY6A7L24OERKQTPLT4T7SZKLUAZVQ",
        channel: "email",
      }),
    );
    // Fail closed: denied (429), never a 200 pass or an unhandled 500.
    expect(res.status).toBe(429);
  });
});
