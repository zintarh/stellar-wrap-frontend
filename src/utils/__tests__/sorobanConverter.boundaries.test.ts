// @vitest-environment node
/**
 * Direct tests for src/utils/sorobanConverter.ts (issue #640).
 *
 * Layout:
 *   1. Per-type conversion + boundaries (u32/i32/u64/i64/u128/i128, symbol,
 *      string, bool, address, bytes, vec, map)
 *   2. Round trips (toScVal -> fromScVal)
 *   3. Type inference + rejection of unsupported input
 *   4. KNOWN ISSUES: `it.fails` tests that state the CORRECT behaviour but
 *      currently fail against the implementation. `it.fails` passes while the
 *      bug exists and starts FAILING once it is fixed, which is the signal to
 *      change `it.fails` to `it`.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { StrKey, xdr } from "stellar-sdk";
import {
  U32_MAX,
  U64_MAX,
  I32_MAX,
  I32_MIN,
  MAX_STRING_LENGTH,
  MAX_SYMBOL_LENGTH,
  numberToScValU32,
  numberToScValI32,
  numberToScValU64,
  numberToScValI64,
  numberToScValU128,
  numberToScValI128,
  stringToScVal,
  stringToScValSymbol,
  boolToScVal,
  addressToScVal,
  bytesToScVal,
  arrayToScValVec,
  objectToScValMap,
  toScVal,
  fromScVal,
  type ConversionResult,
  type ScValTargetType,
} from "../sorobanConverter";

// ─── Fixtures & helpers ─────────────────────────────────────────────────────

const G_ADDRESS = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const C_ADDRESS = StrKey.encodeContract(Buffer.alloc(32, 2));

const I64_MIN = -(2n ** 63n);
const I64_MAX = 2n ** 63n - 1n;
const U128_MAX = 2n ** 128n - 1n;
const I128_MIN = -(2n ** 127n);
const I128_MAX = 2n ** 127n - 1n;

/** Pass a deliberately wrong-typed value without fighting the type checker. */
const bad = (v: unknown): never => v as never;

const typeOf = (v: xdr.ScVal): string => v.switch().name;

function ok(r: ConversionResult): xdr.ScVal {
  if (!r.success) throw new Error(`expected success, got error: ${r.error}`);
  return r.value;
}

function expectFailure(r: ConversionResult, message?: string | RegExp) {
  expect(r.success).toBe(false);
  if (!r.success && message !== undefined) expect(r.error).toMatch(message);
}

/** A converter may reject an out-of-range value OR encode it exactly. It must never wrap. */
function expectNoSilentWrap(r: ConversionResult, input: bigint) {
  expect(r.success ? fromScVal(r.value) : input).toBe(input);
}

/** Map entries keyed by their symbol name. */
function entryMap(v: xdr.ScVal): Record<string, xdr.ScVal> {
  return Object.fromEntries(
    (v.map() ?? []).map((e) => [String(e.key().sym()), e.val()]),
  );
}

const mapKeys = (v: xdr.ScVal): string[] =>
  (v.map() ?? []).map((e) => String(e.key().sym()));

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── 1. Per-type conversion ─────────────────────────────────────────────────

describe("u32", () => {
  it("accepts 0 and U32_MAX", () => {
    expect(typeOf(ok(numberToScValU32(0)))).toBe("scvU32");
    expect(fromScVal(ok(numberToScValU32(0)))).toBe(0);
    expect(fromScVal(ok(numberToScValU32(U32_MAX)))).toBe(4_294_967_295);
  });

  it.each([-1, U32_MAX + 1, 1.5, NaN, Infinity, -Infinity])(
    "rejects %s",
    (v) => expectFailure(numberToScValU32(v)),
  );

  it("names the range in the out-of-range error", () => {
    expectFailure(numberToScValU32(U32_MAX + 1), /out of u32 range/);
  });

  it("rejects bigint and numeric strings instead of coercing", () => {
    expectFailure(numberToScValU32(bad(5n)));
    expectFailure(numberToScValU32(bad("5")));
  });
});

describe("i32", () => {
  it("accepts I32_MIN and I32_MAX", () => {
    expect(typeOf(ok(numberToScValI32(I32_MIN)))).toBe("scvI32");
    expect(fromScVal(ok(numberToScValI32(I32_MIN)))).toBe(-2_147_483_648);
    expect(fromScVal(ok(numberToScValI32(I32_MAX)))).toBe(2_147_483_647);
  });

  it.each([I32_MIN - 1, I32_MAX + 1, 0.5, NaN])("rejects %s", (v) =>
    expectFailure(numberToScValI32(v)),
  );
});

describe("u64", () => {
  it("accepts 0 and U64_MAX and preserves them exactly", () => {
    expect(typeOf(ok(numberToScValU64(0)))).toBe("scvU64");
    expect(fromScVal(ok(numberToScValU64(0n)))).toBe(0n);
    expect(fromScVal(ok(numberToScValU64(U64_MAX)))).toBe(U64_MAX);
  });

  it("preserves bigint values beyond Number.MAX_SAFE_INTEGER exactly", () => {
    const beyondSafe = 2n ** 53n + 1n;
    expect(fromScVal(ok(numberToScValU64(beyondSafe)))).toBe(beyondSafe);
  });

  it("accepts a number at Number.MAX_SAFE_INTEGER", () => {
    expect(fromScVal(ok(numberToScValU64(Number.MAX_SAFE_INTEGER)))).toBe(
      BigInt(Number.MAX_SAFE_INTEGER),
    );
  });

  it("rejects U64_MAX + 1 with a message naming the limit", () => {
    expectFailure(numberToScValU64(U64_MAX + 1n), /exceeds u64 max/);
  });

  it("rejects negatives", () => {
    expectFailure(numberToScValU64(-1), /negative/);
    expectFailure(numberToScValU64(-1n), /negative/);
  });

  it("rejects NaN and Infinity", () => {
    expectFailure(numberToScValU64(NaN));
    expectFailure(numberToScValU64(Infinity));
  });
});

describe("i64", () => {
  it("accepts I64_MIN and I64_MAX exactly", () => {
    expect(typeOf(ok(numberToScValI64(I64_MAX)))).toBe("scvI64");
    expect(fromScVal(ok(numberToScValI64(I64_MIN)))).toBe(I64_MIN);
    expect(fromScVal(ok(numberToScValI64(I64_MAX)))).toBe(I64_MAX);
  });

  it("rejects one past each end", () => {
    expectFailure(numberToScValI64(I64_MIN - 1n), /out of i64 range/);
    expectFailure(numberToScValI64(I64_MAX + 1n), /out of i64 range/);
  });
});

describe("u128", () => {
  it("accepts 0 and U128_MAX exactly", () => {
    expect(typeOf(ok(numberToScValU128(0n)))).toBe("scvU128");
    expect(fromScVal(ok(numberToScValU128(0n)))).toBe(0n);
    expect(fromScVal(ok(numberToScValU128(U128_MAX)))).toBe(U128_MAX);
  });

  it("rejects negatives", () => {
    expectFailure(numberToScValU128(-1n), /negative/);
  });

  it("never silently wraps U128_MAX + 1", () => {
    expectNoSilentWrap(numberToScValU128(U128_MAX + 1n), U128_MAX + 1n);
  });
});

describe("i128", () => {
  it("accepts I128_MIN, -1, 0 and I128_MAX exactly", () => {
    expect(typeOf(ok(numberToScValI128(0n)))).toBe("scvI128");
    for (const v of [I128_MIN, -1n, 0n, I128_MAX]) {
      expect(fromScVal(ok(numberToScValI128(v)))).toBe(v);
    }
  });

  it("preserves bigint values beyond Number.MAX_SAFE_INTEGER exactly", () => {
    for (const v of [2n ** 53n + 1n, -(2n ** 53n) - 1n, 10n ** 27n + 7n]) {
      expect(fromScVal(ok(numberToScValI128(v)))).toBe(v);
    }
  });

  it("never silently wraps one past either end", () => {
    expectNoSilentWrap(numberToScValI128(I128_MAX + 1n), I128_MAX + 1n);
    expectNoSilentWrap(numberToScValI128(I128_MIN - 1n), I128_MIN - 1n);
  });
});

describe("symbol", () => {
  it(`accepts exactly ${MAX_SYMBOL_LENGTH} characters`, () => {
    const s = "a".repeat(MAX_SYMBOL_LENGTH);
    const v = ok(stringToScValSymbol(s));
    expect(typeOf(v)).toBe("scvSymbol");
    expect(fromScVal(v)).toBe(s);
  });

  it(`rejects ${MAX_SYMBOL_LENGTH + 1} characters`, () => {
    expectFailure(
      stringToScValSymbol("a".repeat(MAX_SYMBOL_LENGTH + 1)),
      /Invalid symbol/,
    );
  });

  it("rejects the empty symbol", () => {
    expectFailure(stringToScValSymbol(""), /Invalid symbol/);
  });

  it.each(["has space", "a-b", "x.y", "é", "emoji🌍"])(
    "rejects invalid characters: %s",
    (s) => expectFailure(stringToScValSymbol(s), /Invalid symbol/),
  );

  it("accepts underscores and digits after the first character", () => {
    expect(fromScVal(ok(stringToScValSymbol("_ok_1")))).toBe("_ok_1");
  });

  // Pins current behaviour: a leading digit is rejected. Soroban itself allows
  // it ([a-zA-Z0-9_]), so this is stricter than the host. Revisit if a contract
  // ever needs such a symbol.
  it("rejects a leading digit (stricter than the Soroban host)", () => {
    expectFailure(stringToScValSymbol("9lives"), /Invalid symbol/);
  });

  it("rejects non-strings", () => {
    expectFailure(stringToScValSymbol(bad(5)), /Expected string/);
  });
});

describe("string", () => {
  it("accepts the empty string and round-trips unicode", () => {
    expect(fromScVal(ok(stringToScVal("")))).toBe("");
    expect(fromScVal(ok(stringToScVal("héllo 🌍")))).toBe("héllo 🌍");
    expect(typeOf(ok(stringToScVal("x")))).toBe("scvString");
  });

  it("accepts exactly MAX_STRING_LENGTH bytes and rejects one more", () => {
    expect(stringToScVal("a".repeat(MAX_STRING_LENGTH)).success).toBe(true);
    expectFailure(
      stringToScVal("a".repeat(MAX_STRING_LENGTH + 1)),
      /exceeds maximum length/,
    );
  });

  it("measures the limit in bytes, not characters", () => {
    // "é" is 2 bytes in UTF-8
    expect(stringToScVal("é".repeat(MAX_STRING_LENGTH / 2)).success).toBe(true);
    expectFailure(stringToScVal("é".repeat(MAX_STRING_LENGTH / 2 + 1)));
  });

  it("rejects non-strings", () => {
    expectFailure(stringToScVal(bad(5)), /Expected string/);
  });
});

describe("bool", () => {
  it("round-trips true and false", () => {
    expect(fromScVal(ok(boolToScVal(true)))).toBe(true);
    expect(fromScVal(ok(boolToScVal(false)))).toBe(false);
    expect(typeOf(ok(boolToScVal(true)))).toBe("scvBool");
  });

  it.each([1, 0, "true", null])("rejects truthy/falsy non-boolean %s", (v) =>
    expectFailure(boolToScVal(bad(v)), /Expected boolean/),
  );
});

describe("address", () => {
  it("accepts G and C addresses and round-trips them", () => {
    for (const a of [G_ADDRESS, C_ADDRESS]) {
      const v = ok(addressToScVal(a));
      expect(typeOf(v)).toBe("scvAddress");
      expect(fromScVal(v)).toBe(a);
    }
  });

  it("trims surrounding whitespace", () => {
    expect(fromScVal(ok(addressToScVal(`  ${G_ADDRESS}\n`)))).toBe(G_ADDRESS);
  });

  it("rejects malformed addresses with a clear error", () => {
    const flipped =
      G_ADDRESS.slice(0, -1) + (G_ADDRESS.endsWith("A") ? "B" : "A");
    const cases = [
      "",
      "G",
      G_ADDRESS.slice(0, 55), // too short
      G_ADDRESS + "A", // too long
      G_ADDRESS.toLowerCase(), // wrong case
      flipped, // bad checksum
      "G" + "A".repeat(55), // right shape, invalid payload
      "M".padEnd(69, "A"), // muxed prefix is not supported
    ];
    for (const c of cases) {
      expectFailure(addressToScVal(c), /Invalid Stellar address/);
    }
  });

  it("rejects non-strings", () => {
    expectFailure(addressToScVal(bad(123)), /Expected string address/);
    expectFailure(addressToScVal(bad(null)), /Expected string address/);
  });
});

describe("bytes", () => {
  it("accepts empty bytes (Buffer and Uint8Array)", () => {
    for (const empty of [Buffer.alloc(0), new Uint8Array(0)]) {
      const v = ok(bytesToScVal(empty));
      expect(typeOf(v)).toBe("scvBytes");
      expect(Buffer.from(fromScVal(v) as Uint8Array).length).toBe(0);
    }
  });

  it("round-trips every byte value 0..255", () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    const back = fromScVal(ok(bytesToScVal(all))) as Uint8Array;
    expect(Array.from(back)).toEqual(Array.from(all));
  });

  it("copies only the visible window of a Uint8Array view", () => {
    const backing = Uint8Array.from([9, 9, 1, 2, 3, 9]);
    const view = backing.subarray(2, 5);
    const back = fromScVal(ok(bytesToScVal(view))) as Uint8Array;
    expect(Array.from(back)).toEqual([1, 2, 3]);
  });

  it("rejects numbers and null", () => {
    expectFailure(bytesToScVal(bad(123)), /Failed to convert bytes/);
    expectFailure(bytesToScVal(bad(null)), /Failed to convert bytes/);
  });
});

describe("vec", () => {
  it("converts an empty array to an empty vec", () => {
    const v = ok(arrayToScValVec([]));
    expect(typeOf(v)).toBe("scvVec");
    expect(fromScVal(v)).toEqual([]);
  });

  it("infers each element and preserves order", () => {
    const v = ok(arrayToScValVec([1, "a", true]));
    expect((v.vec() ?? []).map(typeOf)).toEqual([
      "scvU32",
      "scvString",
      "scvBool",
    ]);
  });

  it("applies an element type hint to every element", () => {
    const v = ok(arrayToScValVec([1, 2], "u64"));
    expect((v.vec() ?? []).map(typeOf)).toEqual(["scvU64", "scvU64"]);
    expect(fromScVal(v)).toEqual([1n, 2n]);
  });

  it("names the failing index", () => {
    expectFailure(
      arrayToScValVec([1, 2, -1], "u32"),
      /array element at index 2/,
    );
  });

  it("rejects non-arrays", () => {
    expectFailure(arrayToScValVec(bad("x")), /Expected array/);
  });
});

describe("map", () => {
  it("converts an empty object to an empty map", () => {
    const v = ok(objectToScValMap({}));
    expect(typeOf(v)).toBe("scvMap");
    expect(v.map()).toHaveLength(0);
  });

  it("applies per-key type hints", () => {
    const v = ok(objectToScValMap({ count: 5 }, { count: "u64" }));
    expect(typeOf(entryMap(v).count)).toBe("scvU64");
  });

  it("rejects keys that are not valid symbols", () => {
    expectFailure(objectToScValMap({ "bad key": 1 }), /map key "bad key"/);
  });

  it("names the key whose value failed", () => {
    expectFailure(
      objectToScValMap({ n: -1 }, { n: "u32" }),
      /map value for key "n"/,
    );
  });

  it("rejects arrays and null", () => {
    expectFailure(objectToScValMap(bad([])), /received array/);
    expectFailure(objectToScValMap(bad(null)));
  });
});

// ─── 2. Round trips ─────────────────────────────────────────────────────────

describe("round trip: toScVal -> fromScVal", () => {
  const cases: Array<[ScValTargetType, unknown]> = [
    ["u32", 0],
    ["u32", U32_MAX],
    ["i32", I32_MIN],
    ["i32", I32_MAX],
    ["u64", 0n],
    ["u64", U64_MAX],
    ["u64", 2n ** 53n + 1n],
    ["i64", I64_MIN],
    ["i64", I64_MAX],
    ["u128", U128_MAX],
    ["i128", I128_MIN],
    ["i128", I128_MAX],
    ["i128", -1n],
    ["i128", 2n ** 53n + 1n],
    ["bool", true],
    ["bool", false],
    ["string", ""],
    ["string", "héllo 🌍"],
    ["symbol", "a".repeat(MAX_SYMBOL_LENGTH)],
    ["address", G_ADDRESS],
    ["address", C_ADDRESS],
  ];

  it.each(cases)("%s: %s", (type, value) => {
    expect(fromScVal(ok(toScVal(value, type)))).toEqual(value);
  });

  it("round-trips a nested structure", () => {
    const v = ok(toScVal({ name: "x", list: [1, 2, 3], flag: true }));
    expect(fromScVal(v)).toEqual({ name: "x", list: [1, 2, 3], flag: true });
  });

  it("fromScVal returns null (and logs) for input the SDK cannot decode", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(fromScVal(bad(null))).toBeNull();
    expect(spy).toHaveBeenCalled();
  });
});

// ─── 3. Inference, nesting, rejection ───────────────────────────────────────

describe("toScVal type inference", () => {
  it.each<[string, unknown, string]>([
    ["small integer", 42, "scvU32"],
    ["U32_MAX", U32_MAX, "scvU32"],
    ["above u32", U32_MAX + 1, "scvU64"],
    ["bigint", 5n, "scvU64"],
    ["string", "hi", "scvString"],
    ["boolean", true, "scvBool"],
    ["null", null, "scvVoid"],
    ["undefined", undefined, "scvVoid"],
    ["array", [1], "scvVec"],
    ["object", { a: 1 }, "scvMap"],
    ["Buffer", Buffer.from([1, 2]), "scvBytes"],
  ])("%s", (_label, value, expected) => {
    expect(typeOf(ok(toScVal(value)))).toBe(expected);
  });
});

describe("toScVal explicit types", () => {
  it("rejects an unknown type tag with a clear error", () => {
    expectFailure(toScVal(1, bad("nope")), /Unsupported ScVal type: nope/);
  });

  it("rejects a value that does not match the requested type", () => {
    expectFailure(toScVal("abc", "u32"));
    expectFailure(toScVal(undefined, "u32"));
    expectFailure(toScVal(5, "bool"), /Expected boolean/);
    expectFailure(toScVal({}, "vec"), /Expected array/);
    expectFailure(toScVal([], "map"), /Expected plain object/);
  });
});

describe("toScVal unsupported input", () => {
  it("rejects functions and symbols", () => {
    expectFailure(toScVal(() => 1), /Cannot infer ScVal type/);
    expectFailure(toScVal(Symbol("s")), /Cannot infer ScVal type/);
  });

  it("rejects NaN and negative numbers when inferring", () => {
    expectFailure(toScVal(NaN));
    expectFailure(toScVal(-1), /negative/);
  });
});

describe("nested structures", () => {
  it("keeps element types at every level", () => {
    const v = ok(toScVal({ name: "x", list: [1, { deep: true }] }));
    const top = entryMap(v);
    expect(typeOf(top.name)).toBe("scvString");
    const list = top.list.vec() ?? [];
    expect(typeOf(list[0])).toBe("scvU32");
    expect(typeOf(list[1])).toBe("scvMap");
    expect(typeOf(entryMap(list[1]).deep)).toBe("scvBool");
  });

  it("reports the full path of a deeply nested failure", () => {
    expectFailure(
      toScVal({ a: [1, () => 1] }),
      /map value for key "a".*array element at index 1.*Cannot infer/,
    );
  });

  it("applies key hints only to top-level keys", () => {
    const v = ok(objectToScValMap({ n: 1, inner: { m: 2 } }, { n: "u64" }));
    const top = entryMap(v);
    expect(typeOf(top.n)).toBe("scvU64");
    expect(typeOf(entryMap(top.inner).m)).toBe("scvU32"); // inferred, not hinted
  });
});

// ─── 4. KNOWN ISSUES ────────────────────────────────────────────────────────
// Each `it.fails` below asserts the behaviour a Soroban caller needs. They pass
// today because the implementation gets it wrong. When you fix the converter,
// vitest will report them as failing: flip `it.fails` to `it`.

describe("KNOWN ISSUES (it.fails = bug still present)", () => {
  it.fails("map keys are sorted (the Soroban host rejects unsorted maps)", () => {
    const v = ok(objectToScValMap({ b: 1, a: 2, c: 3 }));
    expect(mapKeys(v)).toEqual(["a", "b", "c"]);
  });

  it.fails("toScVal(Uint8Array) infers bytes, not a map", () => {
    expect(typeOf(ok(toScVal(new Uint8Array([1, 2, 3]))))).toBe("scvBytes");
  });

  it.fails("toScVal(empty Uint8Array) infers bytes, not an empty map", () => {
    expect(typeOf(ok(toScVal(new Uint8Array(0))))).toBe("scvBytes");
  });

  it.fails("toScVal(Date) is rejected instead of becoming an empty map", () => {
    expectFailure(toScVal(new Date()));
  });

  describe.each<[string, (v: never) => ConversionResult]>([
    ["u64", numberToScValU64],
    ["i64", numberToScValI64],
    ["u128", numberToScValU128],
    ["i128", numberToScValI128],
  ])("%s numeric coercion", (_name, convert) => {
    for (const [label, input] of [
      ["null", null],
      ["true", true],
      ["empty string", ""],
      ["empty array", []],
    ] as const) {
      it.fails(`rejects ${label} instead of coercing it to a number`, () => {
        expectFailure(convert(bad(input)));
      });
    }

    it.fails("rejects a fractional number instead of flooring it", () => {
      expectFailure(convert(bad(1.9)));
    });

    it.fails("rejects an unsafe integer number (precision already lost)", () => {
      expectFailure(convert(bad(Number.MAX_SAFE_INTEGER + 2)));
    });
  });

  it.fails("i128 from a decimal string keeps precision beyond 2^53", () => {
    // Math.floor("9007199254740993") runs the string through a float first.
    const r = numberToScValI128(bad("9007199254740993"));
    expectNoSilentWrap(r, 9007199254740993n);
  });

  it.fails("toScVal(1.5) is rejected instead of silently becoming u64 1", () => {
    expectFailure(toScVal(1.5));
  });

  it.fails("bytes rejects a string instead of UTF-8 encoding it", () => {
    expectFailure(bytesToScVal(bad("abc")));
  });
});
