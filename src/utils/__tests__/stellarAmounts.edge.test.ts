/**
 * Edge-case tests for src/utils/stellarAmounts.ts — Issue #474
 *
 * Covers: null / undefined inputs, unexpected data types, boundary values,
 * whitespace, overflow, underflow, formatting edge cases.
 */

import {
  STROOPS_PER_XLM,
  XLM_MAX_PRECISION,
  MAX_TOTAL_STROOPS,
  parseAmountToStroops,
  xlmToStroops,
  stroopsToXlm,
  formatXlm,
} from "../stellarAmounts";

// ─── parseAmountToStroops ─────────────────────────────────────────────────────

describe("parseAmountToStroops — happy paths", () => {
  it("parses '1' to one XLM in stroops", () => {
    expect(parseAmountToStroops("1")).toEqual({
      ok: true,
      value: BigInt(STROOPS_PER_XLM),
    });
  });

  it("parses '0.0000001' to 1 stroop", () => {
    expect(parseAmountToStroops("0.0000001")).toEqual({ ok: true, value: 1n });
  });

  it("parses '42.5' correctly", () => {
    expect(parseAmountToStroops("42.5")).toEqual({
      ok: true,
      value: BigInt(42 * STROOPS_PER_XLM + 5_000_000),
    });
  });

  it("parses '0' to zero stroops", () => {
    expect(parseAmountToStroops("0")).toEqual({ ok: true, value: 0n });
  });

  it("parses '0.0000000' to zero stroops", () => {
    expect(parseAmountToStroops("0.0000000")).toEqual({ ok: true, value: 0n });
  });

  it("trims surrounding whitespace", () => {
    expect(parseAmountToStroops("  2  ")).toEqual({
      ok: true,
      value: BigInt(2 * STROOPS_PER_XLM),
    });
  });

  it("parses maximum valid XLM string", () => {
    const maxXlm = (Number(MAX_TOTAL_STROOPS) / STROOPS_PER_XLM).toFixed(
      XLM_MAX_PRECISION,
    );
    const result = parseAmountToStroops(maxXlm);
    expect(result.ok).toBe(true);
  });

  it("handles exactly 7 decimal places", () => {
    const result = parseAmountToStroops("1.1234567");
    expect(result).toEqual({ ok: true, value: BigInt(STROOPS_PER_XLM) + 1_234_567n });
  });
});

describe("parseAmountToStroops — unhappy paths / edge cases", () => {
  it("rejects empty string with 'invalid'", () => {
    expect(parseAmountToStroops("")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects whitespace-only string with 'invalid'", () => {
    expect(parseAmountToStroops("   ")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects alphabetical string with 'invalid'", () => {
    expect(parseAmountToStroops("abc")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects 'NaN' with 'invalid'", () => {
    expect(parseAmountToStroops("NaN")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects 'Infinity' with 'invalid'", () => {
    expect(parseAmountToStroops("Infinity")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects '1e7' (scientific notation) with 'invalid'", () => {
    expect(parseAmountToStroops("1e7")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects multiple decimal points '1.2.3' with 'invalid'", () => {
    expect(parseAmountToStroops("1.2.3")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a lone decimal point '.' with 'invalid'", () => {
    expect(parseAmountToStroops(".")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects '.5' (no leading digit) with 'invalid'", () => {
    expect(parseAmountToStroops(".5")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects null with 'invalid'", () => {
    expect(parseAmountToStroops(null as unknown as string)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects undefined with 'invalid'", () => {
    expect(parseAmountToStroops(undefined as unknown as string)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a number input with 'invalid'", () => {
    expect(parseAmountToStroops(42 as unknown as string)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects an object input with 'invalid'", () => {
    expect(parseAmountToStroops({} as unknown as string)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects 8 decimal places with 'too-many-decimals'", () => {
    expect(parseAmountToStroops("1.12345678")).toEqual({
      ok: false,
      reason: "too-many-decimals",
    });
  });

  it("rejects 9 decimal places with 'too-many-decimals'", () => {
    expect(parseAmountToStroops("0.000000001")).toEqual({
      ok: false,
      reason: "too-many-decimals",
    });
  });

  it("rejects values beyond Int64 stroops range with 'overflow'", () => {
    // The MAX_TOTAL_STROOPS / STROOPS_PER_XLM number is already the border value;
    // adding 1 whole XLM guarantees overflow.
    const overflowXlm = (
      Math.ceil(Number(MAX_TOTAL_STROOPS) / STROOPS_PER_XLM) + 1
    ).toString();
    expect(parseAmountToStroops(overflowXlm)).toEqual({
      ok: false,
      reason: "overflow",
    });
  });
});

// ─── xlmToStroops ─────────────────────────────────────────────────────────────

describe("xlmToStroops — happy paths", () => {
  it("converts number 1 to one XLM in stroops", () => {
    const result = xlmToStroops(1);
    expect(result).toEqual({ ok: true, value: BigInt(STROOPS_PER_XLM) });
  });

  it("converts number 0 to 0 stroops", () => {
    expect(xlmToStroops(0)).toEqual({ ok: true, value: 0n });
  });

  it("converts string '1' to one XLM in stroops", () => {
    expect(xlmToStroops("1")).toEqual({ ok: true, value: BigInt(STROOPS_PER_XLM) });
  });

  it("converts 0.1 honoring 7-digit precision", () => {
    expect(xlmToStroops(0.1)).toEqual({
      ok: true,
      value: BigInt(Math.round(0.1 * STROOPS_PER_XLM)),
    });
  });
});

describe("xlmToStroops — unhappy paths / edge cases", () => {
  it("rejects NaN with 'invalid'", () => {
    expect(xlmToStroops(Number.NaN)).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects +Infinity with 'invalid'", () => {
    expect(xlmToStroops(Number.POSITIVE_INFINITY)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects -Infinity with 'invalid'", () => {
    expect(xlmToStroops(Number.NEGATIVE_INFINITY)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a negative number with 'negative'", () => {
    expect(xlmToStroops(-1)).toEqual({ ok: false, reason: "negative" });
  });

  it("rejects a negative float with 'negative'", () => {
    expect(xlmToStroops(-0.0000001)).toEqual({ ok: false, reason: "negative" });
  });

  it("rejects an empty string with 'invalid'", () => {
    expect(xlmToStroops("")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects 'abc' with 'invalid'", () => {
    expect(xlmToStroops("abc")).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects null passed as string with 'invalid'", () => {
    expect(xlmToStroops(null as unknown as string)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

// ─── stroopsToXlm ─────────────────────────────────────────────────────────────

describe("stroopsToXlm — happy paths", () => {
  it("converts STROOPS_PER_XLM bigint to 1", () => {
    expect(stroopsToXlm(BigInt(STROOPS_PER_XLM))).toBe(1);
  });

  it("converts 1500000n to 0.15", () => {
    expect(stroopsToXlm(1_500_000n)).toBe(0.15);
  });

  it("converts integer string '10000000' to 1", () => {
    expect(stroopsToXlm("10000000")).toBe(1);
  });

  it("converts integer number 10000000 to 1", () => {
    expect(stroopsToXlm(10_000_000)).toBe(1);
  });

  it("converts 0n to 0", () => {
    expect(stroopsToXlm(0n)).toBe(0);
  });

  it("converts '0' string to 0", () => {
    expect(stroopsToXlm("0")).toBe(0);
  });
});

describe("stroopsToXlm — unhappy paths / edge cases", () => {
  it("throws RangeError for negative bigint", () => {
    expect(() => stroopsToXlm(-1n)).toThrow(RangeError);
  });

  it("throws RangeError for negative number", () => {
    expect(() => stroopsToXlm(-1)).toThrow(RangeError);
  });

  it("throws RangeError for negative string", () => {
    expect(() => stroopsToXlm("-1")).toThrow(RangeError);
  });

  it("throws for non-numeric string", () => {
    expect(() => stroopsToXlm("abc")).toThrow();
  });

  it("throws RangeError when exceeding MAX_TOTAL_STROOPS", () => {
    expect(() => stroopsToXlm(MAX_TOTAL_STROOPS + 1n)).toThrow(RangeError);
  });

  it("handles whitespace-only string (coerces to '0')", () => {
    // The impl: BigInt("  ".trim() || "0") = BigInt("0") = 0n
    expect(stroopsToXlm("   ")).toBe(0);
  });
});

// ─── formatXlm ────────────────────────────────────────────────────────────────

describe("formatXlm — default precision", () => {
  it("formats 10_000_000n as '1.0000000' with default 7dp", () => {
    expect(formatXlm(10_000_000n)).toBe("1.0000000");
  });

  it("formats 1_500_000n as '0.1500000'", () => {
    expect(formatXlm(1_500_000n)).toBe("0.1500000");
  });

  it("formats 1n as '0.0000001'", () => {
    expect(formatXlm(1n)).toBe("0.0000001");
  });

  it("formats 0n as '0.0000000'", () => {
    expect(formatXlm(0n)).toBe("0.0000000");
  });
});

describe("formatXlm — maxFractionDigits option", () => {
  it("formats with 2 decimal places", () => {
    expect(formatXlm(10_000_000n, { maxFractionDigits: 2 })).toBe("1.00");
  });

  it("formats with 0 decimal places (integer only)", () => {
    expect(formatXlm(10_000_000n, { maxFractionDigits: 0 })).toBe("1");
  });

  it("clamps maxFractionDigits above XLM_MAX_PRECISION to 7dp", () => {
    expect(
      formatXlm(10_000_000n, { maxFractionDigits: XLM_MAX_PRECISION + 3 }),
    ).toBe("1.0000000");
  });

  it("clamps negative maxFractionDigits to 0", () => {
    expect(formatXlm(10_000_000n, { maxFractionDigits: -3 })).toBe("1");
  });

  it("accepts exactly XLM_MAX_PRECISION (7)", () => {
    expect(
      formatXlm(10_000_000n, { maxFractionDigits: XLM_MAX_PRECISION }),
    ).toBe("1.0000000");
  });
});

describe("formatXlm — non-bigint inputs", () => {
  it("accepts a numeric string", () => {
    expect(formatXlm("10000000")).toBe("1.0000000");
  });

  it("accepts a plain integer number", () => {
    expect(formatXlm(10_000_000)).toBe("1.0000000");
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe("exported constants", () => {
  it("STROOPS_PER_XLM equals 10_000_000", () => {
    expect(STROOPS_PER_XLM).toBe(10_000_000);
  });

  it("XLM_MAX_PRECISION equals 7", () => {
    expect(XLM_MAX_PRECISION).toBe(7);
  });

  it("MAX_TOTAL_STROOPS equals (2^63) - 1", () => {
    expect(MAX_TOTAL_STROOPS).toBe((1n << 63n) - 1n);
  });
});
