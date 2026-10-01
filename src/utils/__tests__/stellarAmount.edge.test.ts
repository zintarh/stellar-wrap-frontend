/**
 * Edge-case tests for src/utils/stellarAmount.ts — Issue #474
 *
 * Covers: null / undefined inputs, unexpected data types, boundary values,
 * whitespace variants, precision edge cases, and the formatting pipeline.
 */

import {
  toStroops,
  fromStroops,
  isValidStellarAmount,
  formatStellarAmount,
  STROOPS_PER_UNIT,
  MAX_STROOPS,
  MAX_STELLAR_LIMIT,
} from "../stellarAmount";

// ─── toStroops ────────────────────────────────────────────────────────────────

describe("toStroops — happy paths", () => {
  it("converts integer string '1' to 10_000_000n", () => {
    expect(toStroops("1")).toBe(10_000_000n);
  });

  it("converts integer number 1 to 10_000_000n", () => {
    expect(toStroops(1)).toBe(10_000_000n);
  });

  it("converts '0.0000001' (minimum non-zero) to 1n", () => {
    expect(toStroops("0.0000001")).toBe(1n);
  });

  it("converts the MAX_STELLAR_LIMIT string to MAX_STROOPS", () => {
    expect(toStroops(MAX_STELLAR_LIMIT)).toBe(MAX_STROOPS);
  });

  it("converts '0.1234567' correctly", () => {
    expect(toStroops("0.1234567")).toBe(1_234_567n);
  });

  it("converts '123.4567890' (trailing zero in 7 places) correctly", () => {
    expect(toStroops("123.4567890")).toBe(1_234_567_890n);
  });

  it("handles leading zeros in whole part (e.g. '007')", () => {
    // BigInt("007") is 7n — consistent behaviour
    expect(toStroops("007")).toBe(7n * STROOPS_PER_UNIT);
  });

  it("trims surrounding whitespace before processing", () => {
    expect(toStroops("  2.5  " as unknown as string)).toBe(25_000_000n);
  });

  it("converts number 0.5 to 5_000_000n", () => {
    expect(toStroops(0.5)).toBe(5_000_000n);
  });

  it("converts number 100 to 1_000_000_000n", () => {
    expect(toStroops(100)).toBe(1_000_000_000n);
  });
});

describe("toStroops — unhappy paths / edge cases", () => {
  it("throws for an empty string", () => {
    expect(() => toStroops("")).toThrow(/empty/i);
  });

  it("throws for a string that is only whitespace", () => {
    expect(() => toStroops("   ")).toThrow(/empty/i);
  });

  it("throws for a negative string", () => {
    expect(() => toStroops("-1")).toThrow(/Negative/i);
  });

  it("throws for a negative number", () => {
    expect(() => toStroops(-0.5)).toThrow(/Negative/i);
  });

  it("throws for more than 7 decimal places", () => {
    expect(() => toStroops("1.12345678")).toThrow(/exceeds maximum 7 decimal places/i);
  });

  it("throws for 8 decimal places", () => {
    expect(() => toStroops("0.00000001")).toThrow(/exceeds maximum 7 decimal places/i);
  });

  it("throws for alphabetical input", () => {
    expect(() => toStroops("abc")).toThrow(/Invalid numeric characters/i);
  });

  it("throws for mixed alpha-numeric", () => {
    expect(() => toStroops("1a2")).toThrow(/Invalid numeric characters/i);
  });

  it("throws for multiple decimal points", () => {
    expect(() => toStroops("1.2.3")).toThrow(/Invalid amount format/i);
  });

  it("throws for scientific notation string", () => {
    // "1e7" splits into parts ["1e7"] — "1e7" fails the /^\d+$/ check
    expect(() => toStroops("1e7")).toThrow();
  });

  it("throws when amount exceeds Int64 maximum stroops", () => {
    // One stroop above the max
    const overMax = "922337203685.4775808";
    expect(() => toStroops(overMax)).toThrow(/exceeds maximum Stellar 64-bit integer limit/i);
  });

  it("throws for 'NaN' as string", () => {
    expect(() => toStroops("NaN")).toThrow();
  });

  it("throws for 'Infinity' as string", () => {
    expect(() => toStroops("Infinity")).toThrow();
  });

  it("throws for zero decimal places string containing only a dot", () => {
    expect(() => toStroops(".")).toThrow();
  });

  it("throws for amount with only a decimal point before digits (e.g. '.5')", () => {
    // ".5" splits to ["", "5"] — wholePart is "" → BigInt("") throws
    expect(() => toStroops(".5")).toThrow();
  });
});

// ─── fromStroops ──────────────────────────────────────────────────────────────

describe("fromStroops — happy paths", () => {
  it("converts 10_000_000n to '1.0000000'", () => {
    expect(fromStroops(10_000_000n)).toBe("1.0000000");
  });

  it("converts 1n to '0.0000001'", () => {
    expect(fromStroops(1n)).toBe("0.0000001");
  });

  it("converts 0n to '0.0000000'", () => {
    expect(fromStroops(0n)).toBe("0.0000000");
  });

  it("converts MAX_STROOPS to MAX_STELLAR_LIMIT", () => {
    expect(fromStroops(MAX_STROOPS)).toBe(MAX_STELLAR_LIMIT);
  });

  it("accepts a numeric string input", () => {
    expect(fromStroops("10000000")).toBe("1.0000000");
  });

  it("accepts a plain number input", () => {
    expect(fromStroops(10_000_000)).toBe("1.0000000");
  });

  it("trims trailing zeroes when requested — whole amount", () => {
    expect(fromStroops(10_000_000n, true)).toBe("1");
  });

  it("trims trailing zeroes when requested — partial decimal", () => {
    expect(fromStroops(10_500_000n, true)).toBe("1.05");
  });

  it("never trims the last significant fractional digit", () => {
    expect(fromStroops(1n, true)).toBe("0.0000001");
  });

  it("returns full 7-decimal string when trimTrailingZeroes is false (default)", () => {
    expect(fromStroops(10_500_000n)).toBe("1.0500000");
  });
});

describe("fromStroops — unhappy paths / edge cases", () => {
  it("throws for negative bigint", () => {
    expect(() => fromStroops(-1n)).toThrow(/cannot be negative/i);
  });

  it("throws for negative number", () => {
    expect(() => fromStroops(-10_000_000)).toThrow();
  });

  it("throws for negative numeric string", () => {
    expect(() => fromStroops("-1")).toThrow();
  });

  it("throws for non-numeric string input", () => {
    expect(() => fromStroops("abc")).toThrow();
  });

  it("handles whitespace-only string by coercing to '0' (BigInt('') throws)", () => {
    // BigInt(String("  ").trim()) = BigInt("0") = 0n — depends on impl
    // The impl does: BigInt(String(stroops).trim())
    // "  ".trim() = "" — BigInt("") throws SyntaxError
    expect(() => fromStroops("  ")).toThrow();
  });
});

// ─── isValidStellarAmount ─────────────────────────────────────────────────────

describe("isValidStellarAmount — valid inputs", () => {
  it("returns true for '100'", () => {
    expect(isValidStellarAmount("100")).toBe(true);
  });

  it("returns true for '0.5'", () => {
    expect(isValidStellarAmount("0.5")).toBe(true);
  });

  it("returns true for '0.0000001' (minimum positive)", () => {
    expect(isValidStellarAmount("0.0000001")).toBe(true);
  });

  it("returns true for MAX_STELLAR_LIMIT", () => {
    expect(isValidStellarAmount(MAX_STELLAR_LIMIT)).toBe(true);
  });

  it("returns true for a whole number with no decimal part", () => {
    expect(isValidStellarAmount("1000000")).toBe(true);
  });
});

describe("isValidStellarAmount — invalid / edge case inputs", () => {
  it("returns false for an empty string", () => {
    expect(isValidStellarAmount("")).toBe(false);
  });

  it("returns false for '0' (zero stroops is not a valid positive amount)", () => {
    expect(isValidStellarAmount("0")).toBe(false);
  });

  it("returns false for '0.0000000' (zero stroops)", () => {
    expect(isValidStellarAmount("0.0000000")).toBe(false);
  });

  it("returns false for a negative amount", () => {
    expect(isValidStellarAmount("-1")).toBe(false);
  });

  it("returns false for 8 decimal places", () => {
    expect(isValidStellarAmount("1.12345678")).toBe(false);
  });

  it("returns false for alphabetical input", () => {
    expect(isValidStellarAmount("abc")).toBe(false);
  });

  it("returns false for scientific notation", () => {
    expect(isValidStellarAmount("1e7")).toBe(false);
  });

  it("returns false for amount exceeding i64 stroops range", () => {
    expect(isValidStellarAmount("999999999999999999.0")).toBe(false);
  });

  it("returns false when input is not a string (number passed)", () => {
    // The function signature accepts string; passing a non-string is a misuse.
    // The internal guard `typeof amount !== 'string'` should return false.
    expect(isValidStellarAmount(100 as unknown as string)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isValidStellarAmount(null as unknown as string)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isValidStellarAmount(undefined as unknown as string)).toBe(false);
  });

  it("returns false for an object", () => {
    expect(isValidStellarAmount({} as unknown as string)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isValidStellarAmount([] as unknown as string)).toBe(false);
  });

  it("returns false for a string with leading/trailing spaces", () => {
    // The outer guard `!amount` will be falsy for "  ", but the regex won't
    // match the trimmed empty string. Either way: invalid.
    expect(isValidStellarAmount("  ")).toBe(false);
  });

  it("returns false for 'NaN'", () => {
    expect(isValidStellarAmount("NaN")).toBe(false);
  });

  it("returns false for 'Infinity'", () => {
    expect(isValidStellarAmount("Infinity")).toBe(false);
  });

  it("returns false for a lone decimal point '.'", () => {
    expect(isValidStellarAmount(".")).toBe(false);
  });

  it("returns false for '.5' (no leading digit)", () => {
    expect(isValidStellarAmount(".5")).toBe(false);
  });
});

// ─── formatStellarAmount ──────────────────────────────────────────────────────

describe("formatStellarAmount — null / undefined / empty", () => {
  it("returns '0' for undefined", () => {
    expect(formatStellarAmount(undefined)).toBe("0");
  });

  it("returns '0' for null", () => {
    expect(formatStellarAmount(null)).toBe("0");
  });

  it("returns '0' for empty string", () => {
    expect(formatStellarAmount("")).toBe("0");
  });
});

describe("formatStellarAmount — valid amounts", () => {
  it("strips all trailing decimal zeros from '100.0000000'", () => {
    expect(formatStellarAmount("100.0000000")).toBe("100");
  });

  it("strips partial trailing zeros from '50.1230000'", () => {
    expect(formatStellarAmount("50.1230000")).toBe("50.123");
  });

  it("respects maxDecimals=4 by truncating to 4 places", () => {
    expect(formatStellarAmount("12.3456789", 4)).toBe("12.3456");
  });

  it("respects maxDecimals=0 returning only the whole part", () => {
    expect(formatStellarAmount("12.9999999", 0)).toBe("12");
  });

  it("returns '0.0000001' for the minimum positive amount", () => {
    expect(formatStellarAmount("0.0000001")).toBe("0.0000001");
  });

  it("handles a number input (e.g. 100)", () => {
    expect(formatStellarAmount(100)).toBe("100");
  });

  it("handles a number input with decimals (e.g. 1.5)", () => {
    expect(formatStellarAmount(1.5)).toBe("1.5");
  });
});

describe("formatStellarAmount — invalid / unexpected inputs (passthrough)", () => {
  it("passes through 'abc' unchanged (non-parseable string)", () => {
    expect(formatStellarAmount("abc")).toBe("abc");
  });

  it("passes through negative string '-5' unchanged", () => {
    expect(formatStellarAmount("-5")).toBe("-5");
  });

  it("passes through overflowing amount unchanged", () => {
    const over = "999999999999999999.0";
    expect(formatStellarAmount(over)).toBe(over);
  });

  it("passes through '0' (zero) unchanged", () => {
    // '0' is not a valid Stellar amount (zero stroops), so the raw string is returned
    expect(formatStellarAmount("0")).toBe("0");
  });
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe("exported constants", () => {
  it("STROOPS_PER_UNIT equals 10_000_000n", () => {
    expect(STROOPS_PER_UNIT).toBe(10_000_000n);
  });

  it("MAX_STROOPS equals i64 max (9223372036854775807n)", () => {
    expect(MAX_STROOPS).toBe(9_223_372_036_854_775_807n);
  });

  it("MAX_STELLAR_LIMIT is the correct string representation", () => {
    expect(MAX_STELLAR_LIMIT).toBe("922337203685.4775807");
  });

  it("fromStroops(MAX_STROOPS) round-trips to MAX_STELLAR_LIMIT", () => {
    expect(fromStroops(MAX_STROOPS)).toBe(MAX_STELLAR_LIMIT);
  });

  it("toStroops(MAX_STELLAR_LIMIT) round-trips to MAX_STROOPS", () => {
    expect(toStroops(MAX_STELLAR_LIMIT)).toBe(MAX_STROOPS);
  });
});
