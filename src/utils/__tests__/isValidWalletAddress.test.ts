import { StrKey } from "stellar-sdk";
import { isValidWalletAddress } from "../validateStellarAddress";

// Checksum-valid vectors. G is a well-known valid account address; M and C
// are encoded from fixed payloads so their checksums are valid by construction.
const VALID_G = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7";
const VALID_M = StrKey.encodeMed25519PublicKey(
  Buffer.concat([Buffer.alloc(32, 2), Buffer.alloc(8, 1)]),
);
const VALID_C = StrKey.encodeContract(Buffer.alloc(32, 3));

describe("isValidWalletAddress (issue #635)", () => {
  it("accepts a checksum-valid G address by default", () => {
    expect(isValidWalletAddress(VALID_G)).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidWalletAddress("GABC")).toBe(false);
    expect(isValidWalletAddress("G")).toBe(false);
    expect(isValidWalletAddress("")).toBe(false);
  });

  it("rejects a bad checksum", () => {
    const bad = `G${"Z".repeat(55)}`;
    expect(bad).toHaveLength(56);
    expect(isValidWalletAddress(bad)).toBe(false);
  });

  it("rejects a wrong prefix", () => {
    expect(isValidWalletAddress("SABC123")).toBe(false);
    expect(
      isValidWalletAddress("SCKFBEIYTKP2NM3BZXBIQXSJBEM3NTWGCAPXFQBHGTHZOO12345678"),
    ).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    expect(isValidWalletAddress(`  ${VALID_G}  `)).toBe(true);
  });

  it("rejects non-string input", () => {
    expect(isValidWalletAddress(undefined)).toBe(false);
    expect(isValidWalletAddress(null)).toBe(false);
    expect(isValidWalletAddress(42)).toBe(false);
  });

  it("rejects M and C addresses unless explicitly allowed", () => {
    expect(VALID_M[0]).toBe("M");
    expect(VALID_C[0]).toBe("C");
    expect(isValidWalletAddress(VALID_M)).toBe(false);
    expect(isValidWalletAddress(VALID_C)).toBe(false);
    expect(isValidWalletAddress(VALID_M, { allowedPrefixes: ["G", "M"] })).toBe(true);
    expect(isValidWalletAddress(VALID_C, { allowedPrefixes: ["G", "C"] })).toBe(true);
    // A G address stays valid when more families are allowed.
    expect(isValidWalletAddress(VALID_G, { allowedPrefixes: ["G", "M", "C"] })).toBe(true);
  });

  it("rejects a corrupted M address even when M is allowed", () => {
    const corrupted = `${VALID_M.slice(0, -1)}${VALID_M.endsWith("A") ? "B" : "A"}`;
    expect(isValidWalletAddress(corrupted, { allowedPrefixes: ["M"] })).toBe(false);
  });
});
