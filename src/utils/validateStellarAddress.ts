import { StrKey } from 'stellar-sdk';
import { Network } from '../config';

export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'invalid-format' | 'wrong-network' | 'not-found' | 'indexing' | 'error';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  state: ValidationState;
}

/**
 * Validates a Stellar public key (address) format with network-specific checks
 * @param address The string to validate
 * @param network The current network context (mainnet/testnet)
 * @returns ValidationResult containing status and optional error message
 */
export const validateStellarAddress = (address: string, _network: Network): ValidationResult => {
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      state: 'idle'
    };
  }

  const trimmedAddress = address.trim();

  // Length check: Stellar addresses are always 56 characters
  if (trimmedAddress.length !== 56) {
    return {
      isValid: false,
      error: `Invalid address length. Expected 56 characters, got ${trimmedAddress.length}`,
      state: 'invalid-format'
    };
  }

  // Check address prefix
  const firstChar = trimmedAddress[0];
  
  // Basic check: must start with G (Ed25519) or M (Muxed)
  if (firstChar !== 'G' && firstChar !== 'M') {
    return {
      isValid: false,
      error: 'Stellar address must start with G (mainnet/testnet) or M (muxed account)',
      state: 'invalid-format'
    };
  }

  try {
    // Validate address format using Stellar SDK
    if (firstChar === 'G') {
      if (!StrKey.isValidEd25519PublicKey(trimmedAddress)) {
         return {
          isValid: false,
          error: 'Invalid Stellar address format - checksum validation failed',
          state: 'invalid-format'
        };
      }
    } 
    // Check Muxed Account
    else if (firstChar === 'M') {
      if (!StrKey.isValidMed25519PublicKey(trimmedAddress)) {
        return {
          isValid: false,
          error: 'Invalid Stellar muxed address format - checksum validation failed',
          state: 'invalid-format'
        };
      }
    }
    
    // Network-specific validation
    // Note: Both mainnet and testnet use 'G' prefix for regular addresses
    // Testnet doesn't have a distinct prefix, so we rely on network context
    // The actual network validation happens when checking account existence
    
    // Format is valid, proceed to network validation
    return {
      isValid: true,
      state: 'validating' // Transition to network existence check
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid Stellar address format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      state: 'invalid-format'
    };
  }
};

/**
 * Address families this application accepts, per context:
 * - `G` — Ed25519 account addresses (wallets; every call site).
 * - `M` — muxed (M-address) accounts sharing an underlying G account.
 * - `C` — contract addresses (only where a contract id is expected).
 *
 * Both mainnet and testnet use the same prefixes; network existence is
 * checked separately via Horizon. Callers opt into non-`G` families
 * explicitly so a contract id can never pass where a wallet is required.
 */
export type StellarAddressPrefix = "G" | "M" | "C";

export interface WalletValidationOptions {
  /** Families to accept. Defaults to `["G"]` (plain wallets only). */
  allowedPrefixes?: readonly StellarAddressPrefix[];
}

/**
 * Single shared wallet-address predicate backing every call site (UI hook
 * and API routes). Trims whitespace, enforces the 56-char strkey shape,
 * restricts the prefix, and verifies the checksum with the Stellar SDK.
 */
/** Encoded strkey length per family: G/C are 56 chars, M is 69 chars. */
const PREFIX_LENGTHS: Record<StellarAddressPrefix, number> = {
  G: 56,
  M: 69,
  C: 56,
};

export const isValidWalletAddress = (
  address: unknown,
  options?: WalletValidationOptions,
): boolean => {
  if (typeof address !== "string") return false;
  const trimmed = address.trim();
  if (trimmed.length === 0) return false;

  const allowed = options?.allowedPrefixes ?? (["G"] as const);
  const prefix = trimmed[0] as StellarAddressPrefix;
  if (!(allowed as readonly string[]).includes(prefix)) return false;
  if (!(prefix in PREFIX_LENGTHS)) return false;
  if (trimmed.length !== PREFIX_LENGTHS[prefix]) return false;

  try {
    switch (prefix) {
      case "G":
        return StrKey.isValidEd25519PublicKey(trimmed);
      case "M":
        return StrKey.isValidMed25519PublicKey(trimmed);
      case "C":
        return StrKey.isValidContract(trimmed);
      default:
        return false;
    }
  } catch {
    return false;
  }
};

/**
 * Check if an address prefix matches the expected network
 * Note: Stellar mainnet and testnet both use 'G' prefix, so this primarily
 * validates format. Network existence is checked via Horizon API.
 * @param address The Stellar address
 * @param network The expected network
 * @returns true if prefix is valid for the network
 */
export const isAddressPrefixValidForNetwork = (address: string, _network: Network): boolean => {
  if (!address || address.length === 0) return false;
  
  const prefix = address[0];
  
  // Both mainnet and testnet use 'G' for Ed25519 public keys
  // 'M' is for muxed accounts on both networks
  if (prefix === 'G' || prefix === 'M') {
    return true;
  }
  
  return false;
};
