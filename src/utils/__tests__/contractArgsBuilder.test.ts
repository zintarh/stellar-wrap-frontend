// @vitest-environment node
/**
 * Direct tests for src/utils/contractArgsBuilder.ts (issue #640).
 *
 * Focus: argument ORDER, COUNT and ScVal TYPE for each contract call, amount
 * parsing at its limits, and rejection paths. Wallet/RPC code is not exercised.
 */
import { describe, it, expect, vi } from "vitest";
import { StrKey, xdr } from "stellar-sdk";

// contractArgsBuilder imports the Freighter API at module load; stub it so the
// tests never touch a wallet.
vi.mock("@stellar/freighter-api", () => ({
  isAllowed: vi.fn(),
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
}));

import {
  buildContractArgs,
  buildContractArgsAsMap,
  buildMintWrapArgs,
  parseStellarAmount,
  formatStellarAmount,
  validateIndexedStats,
  validateMintWrapInput,
  type BuildArgsResult,
  type ContractStatsInput,
  type MintWrapArgsInput,
} from "../contractArgsBuilder";
import { fromScVal, U32_MAX } from "../sorobanConverter";

// ─── Fixtures & helpers ─────────────────────────────────────────────────────

const G_ADDRESS = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));

const bad = (v: unknown): never => v as never;
const typeOf = (v: xdr.ScVal): string => v.switch().name;

function okArgs(r: BuildArgsResult) {
  if (!r.success) throw new Error(`expected success, got: ${r.errors.join("; ")}`);
  return r.data;
}

function failErrors(r: BuildArgsResult): string[] {
  if (r.success) throw new Error("expected failure but build succeeded");
  return r.errors;
}

function entryMap(v: xdr.ScVal): Record<string, xdr.ScVal> {
  return Object.fromEntries(
    (v.map() ?? []).map((e) => [String(e.key().sym()), e.val()]),
  );
}

const baseStats = (over: Partial<ContractStatsInput> = {}): ContractStatsInput => ({
  totalVolume: 45000,
  mostActiveAsset: "XLM",
  contractCalls: 120,
  ...over,
});

const baseMint = (over: Partial<MintWrapArgsInput> = {}): MintWrapArgsInput => ({
  accountAddress: G_ADDRESS,
  period: "monthly",
  archetype: "The DeFi Patron",
  dataHash: new Uint8Array(32).fill(7),
  signature: new Uint8Array(64).fill(9),
  ...over,
});

// ─── Amount parsing ─────────────────────────────────────────────────────────

describe("parseStellarAmount", () => {
  it.each<[string | number, bigint]>([
    ["0", 0n],
    ["1", 10_000_000n],
    ["0.0000001", 1n],
    ["1.5", 15_000_000n],
    [" 12 ", 120_000_000n],
    [45000, 450_000_000_000n],
    [0.1, 1_000_000n],
    ["922337203685.4775807", 9_223_372_036_854_775_807n], // i64 max stroops
    ["900719925.4740993", 9_007_199_254_740_993n], // beyond MAX_SAFE_INTEGER stroops
  ])("%s -> %s stroops", (input, stroops) => {
    expect(parseStellarAmount(input)).toBe(stroops);
  });

  it.each(["1.00000001", "-1", "", " ", "abc", "1e3", ".5", "1.", "1,5"])(
    "rejects string %j",
    (input) => expect(parseStellarAmount(input)).toBeNull(),
  );

  it.each([NaN, Infinity, -1, 1e21])("rejects number %s", (input) => {
    expect(parseStellarAmount(input)).toBeNull();
  });

  it("keeps full precision for large whole amounts (1e20 XLM)", () => {
    expect(parseStellarAmount(1e20)).toBe(10n ** 27n);
  });
});

describe("formatStellarAmount", () => {
  it.each<[bigint | number | string, string]>([
    [0n, "0"],
    [10_000_000n, "1"],
    [15_000_000n, "1.5"],
    [1n, "0.0000001"],
    [-1n, "-0.0000001"],
    ["9007199254740993", "900719925.4740993"],
  ])("%s -> %s", (stroops, text) => {
    expect(formatStellarAmount(stroops)).toBe(text);
  });

  it.each(["0", "1", "0.5", "123.4567891", "922337203685.4775807"])(
    "round-trips %s through parse and format",
    (text) => {
      expect(formatStellarAmount(parseStellarAmount(text) as bigint)).toBe(text);
    },
  );
});

// ─── validateIndexedStats ───────────────────────────────────────────────────

describe("validateIndexedStats", () => {
  it("accepts valid stats, with or without timeframe", () => {
    expect(validateIndexedStats(baseStats())).toEqual([]);
    expect(validateIndexedStats(baseStats({ timeframe: "weekly" }))).toEqual([]);
  });

  it("rejects null and non-objects", () => {
    expect(validateIndexedStats(bad(null))).toEqual([
      "Stats must be a non-null object",
    ]);
    expect(validateIndexedStats(bad("x"))).toHaveLength(1);
  });

  it.each<[string, Partial<ContractStatsInput>, RegExp]>([
    ["negative volume", { totalVolume: -1 }, /non-negative/],
    ["NaN volume", { totalVolume: NaN }, /finite/],
    ["Infinity volume", { totalVolume: Infinity }, /finite/],
    ["string volume", { totalVolume: bad("5") }, /must be a number/],
    ["empty asset", { mostActiveAsset: "" }, /must not be empty/],
    ["blank asset", { mostActiveAsset: "   " }, /must not be empty/],
    ["fractional calls", { contractCalls: 1.5 }, /integer/],
    ["negative calls", { contractCalls: -1 }, /non-negative/],
    ["numeric timeframe", { timeframe: bad(7) }, /timeframe must be a string/],
  ])("rejects %s", (_label, over, message) => {
    expect(validateIndexedStats(baseStats(over)).join(" ")).toMatch(message);
  });
});

// ─── buildContractArgs ──────────────────────────────────────────────────────

describe("buildContractArgs", () => {
  it("emits five args in contract order with the right ScVal types", () => {
    const { args, argDescriptions } = okArgs(buildContractArgs(baseStats(), G_ADDRESS));
    expect(args.map(typeOf)).toEqual([
      "scvAddress",
      "scvI128",
      "scvString",
      "scvU32",
      "scvString",
    ]);
    expect(argDescriptions).toHaveLength(args.length);
  });

  it("encodes the values correctly, defaulting timeframe to 'all'", () => {
    const { args } = okArgs(buildContractArgs(baseStats(), G_ADDRESS));
    expect(fromScVal(args[0])).toBe(G_ADDRESS);
    expect(fromScVal(args[1])).toBe(450_000_000_000n); // 45000 XLM in stroops
    expect(fromScVal(args[2])).toBe("XLM");
    expect(fromScVal(args[3])).toBe(120);
    expect(fromScVal(args[4])).toBe("all");
  });

  it("uses an explicit timeframe when given", () => {
    const { args } = okArgs(
      buildContractArgs(baseStats({ timeframe: "weekly" }), G_ADDRESS),
    );
    expect(fromScVal(args[4])).toBe("weekly");
  });

  describe("boundaries", () => {
    it("accepts zero volume", () => {
      const { args } = okArgs(buildContractArgs(baseStats({ totalVolume: 0 }), G_ADDRESS));
      expect(fromScVal(args[1])).toBe(0n);
    });

    it("keeps an i128 volume beyond Number.MAX_SAFE_INTEGER exact (1e20 XLM)", () => {
      const { args } = okArgs(
        buildContractArgs(baseStats({ totalVolume: 1e20 }), G_ADDRESS),
      );
      expect(fromScVal(args[1])).toBe(10n ** 27n);
    });

    it("rejects a volume too large to format without exponent (1e21)", () => {
      const errors = failErrors(
        buildContractArgs(baseStats({ totalVolume: 1e21 }), G_ADDRESS),
      );
      expect(errors.join(" ")).toMatch(/valid Stellar amount/);
    });

    it("accepts contractCalls = u32 max", () => {
      const { args } = okArgs(
        buildContractArgs(baseStats({ contractCalls: U32_MAX }), G_ADDRESS),
      );
      expect(fromScVal(args[3])).toBe(4_294_967_295);
    });

    it("rejects contractCalls = u32 max + 1 and names the field", () => {
      const errors = failErrors(
        buildContractArgs(baseStats({ contractCalls: U32_MAX + 1 }), G_ADDRESS),
      );
      expect(errors[0]).toMatch(/^contractCalls:/);
    });
  });

  describe("rejection", () => {
    it("returns validation errors and stops before converting", () => {
      const errors = failErrors(
        buildContractArgs(baseStats({ mostActiveAsset: "" }), "not-an-address"),
      );
      expect(errors).toEqual(["mostActiveAsset must not be empty"]);
    });

    it("prefixes address errors with the field name", () => {
      const errors = failErrors(buildContractArgs(baseStats(), "not-an-address"));
      expect(errors).toHaveLength(1);
      expect(errors[0]).toMatch(/^accountAddress: Invalid Stellar address/);
    });

    it("accumulates independent errors instead of stopping at the first", () => {
      const errors = failErrors(
        buildContractArgs(baseStats({ totalVolume: 1e21 }), "not-an-address"),
      );
      expect(errors).toHaveLength(2);
    });

    it("never returns a partial argument list", () => {
      const result = buildContractArgs(baseStats(), "not-an-address");
      expect(result.success).toBe(false);
      expect("data" in result).toBe(false);
    });
  });
});

// ─── buildContractArgsAsMap ─────────────────────────────────────────────────

describe("buildContractArgsAsMap", () => {
  it("emits [address, map] with correctly typed fields", () => {
    const { args } = okArgs(
      buildContractArgsAsMap(baseStats({ timeframe: "weekly" }), G_ADDRESS),
    );
    expect(args.map(typeOf)).toEqual(["scvAddress", "scvMap"]);
    expect(fromScVal(args[0])).toBe(G_ADDRESS);

    const fields = entryMap(args[1]);
    expect(typeOf(fields.total_volume)).toBe("scvI128");
    expect(fromScVal(fields.total_volume)).toBe(450_000_000_000n);
    expect(typeOf(fields.most_active_asset)).toBe("scvString");
    expect(typeOf(fields.contract_calls)).toBe("scvU32");
    expect(fromScVal(fields.timeframe)).toBe("weekly");
  });

  // Pins current behaviour: unlike buildContractArgs (which defaults to "all"),
  // the map form omits `timeframe` when it is missing or empty. If the deployed
  // contract requires the field, this is a bug; update this test with the fix.
  it("omits timeframe when not provided", () => {
    const { args } = okArgs(buildContractArgsAsMap(baseStats(), G_ADDRESS));
    expect(Object.keys(entryMap(args[1]))).not.toContain("timeframe");
  });

  it("rejects an unrepresentable volume (1e21)", () => {
    failErrors(buildContractArgsAsMap(baseStats({ totalVolume: 1e21 }), G_ADDRESS));
  });

  it("rejects an invalid address", () => {
    const errors = failErrors(buildContractArgsAsMap(baseStats(), "nope"));
    expect(errors[0]).toMatch(/^accountAddress:/);
  });

  // KNOWN ISSUE: the Soroban host requires map keys sorted lexicographically.
  // The builder emits insertion order (total_volume, most_active_asset,
  // contract_calls), so simulation would reject this argument. `it.fails` passes
  // while the bug exists; flip it to `it` once map keys are sorted.
  it.fails("emits map keys in sorted order", () => {
    const { args } = okArgs(buildContractArgsAsMap(baseStats(), G_ADDRESS));
    const keys = Object.keys(entryMap(args[1]));
    expect(keys).toEqual([...keys].sort());
  });
});

// ─── mint_wrap ──────────────────────────────────────────────────────────────

describe("validateMintWrapInput", () => {
  it("accepts a complete input", () => {
    expect(validateMintWrapInput(baseMint())).toEqual([]);
  });

  it("rejects null", () => {
    expect(validateMintWrapInput(bad(null))).toEqual([
      "Mint wrap input must be a non-null object",
    ]);
  });

  it("reports every missing field of an empty object", () => {
    expect(validateMintWrapInput(bad({}))).toHaveLength(5);
  });

  it.each<[string, Partial<MintWrapArgsInput>, RegExp]>([
    ["blank address", { accountAddress: "  " }, /accountAddress/],
    ["blank period", { period: " " }, /period/],
    ["blank archetype", { archetype: "" }, /archetype/],
    ["empty dataHash", { dataHash: new Uint8Array(0) }, /dataHash/],
    ["empty signature", { signature: new Uint8Array(0) }, /signature/],
    ["array dataHash", { dataHash: bad([1, 2, 3]) }, /dataHash/],
    ["string signature", { signature: bad("abc") }, /signature/],
  ])("rejects %s", (_label, over, message) => {
    expect(validateMintWrapInput(baseMint(over)).join(" ")).toMatch(message);
  });
});

describe("buildMintWrapArgs", () => {
  it("emits five args in contract order with the right ScVal types", () => {
    const { args, argDescriptions } = okArgs(buildMintWrapArgs(baseMint()));
    expect(args.map(typeOf)).toEqual([
      "scvAddress",
      "scvString",
      "scvString",
      "scvBytes",
      "scvBytes",
    ]);
    expect(argDescriptions).toHaveLength(5);
  });

  it("encodes each value correctly", () => {
    const { args } = okArgs(buildMintWrapArgs(baseMint()));
    expect(fromScVal(args[0])).toBe(G_ADDRESS);
    expect(fromScVal(args[1])).toBe("monthly");
    expect(fromScVal(args[2])).toBe("The DeFi Patron");
    expect(Array.from(fromScVal(args[3]) as Uint8Array)).toEqual(Array(32).fill(7));
    expect(Array.from(fromScVal(args[4]) as Uint8Array)).toEqual(Array(64).fill(9));
  });

  it("round-trips all 256 byte values through dataHash", () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    const { args } = okArgs(buildMintWrapArgs(baseMint({ dataHash: all })));
    expect(Array.from(fromScVal(args[3]) as Uint8Array)).toEqual(Array.from(all));
  });

  it("accepts a Node Buffer for the byte fields", () => {
    okArgs(
      buildMintWrapArgs(
        baseMint({ dataHash: Buffer.alloc(32, 1), signature: Buffer.alloc(64, 2) }),
      ),
    );
  });

  it("rejects empty bytes even though the raw converter accepts them", () => {
    failErrors(buildMintWrapArgs(baseMint({ dataHash: new Uint8Array(0) })));
    failErrors(buildMintWrapArgs(baseMint({ signature: new Uint8Array(0) })));
  });

  it("prefixes a bad address with the contract parameter name", () => {
    const errors = failErrors(
      buildMintWrapArgs(baseMint({ accountAddress: "not-an-address" })),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^user: Invalid Stellar address/);
  });

  it("fails cleanly on null input", () => {
    expect(failErrors(buildMintWrapArgs(bad(null)))).toHaveLength(1);
  });
});
