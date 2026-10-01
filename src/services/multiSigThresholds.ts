import type { MultiSigContractMethod } from '../types/multiSig';

/**
 * Stellar account threshold level an operation requires.
 *
 * Stellar accounts carry low / medium / high thresholds and each operation
 * binds to one of them. A multi-sig proposal must be evaluated against the
 * level its operation actually needs — otherwise a quorum that satisfies
 * the wallet's own count can still fall short on-chain.
 */
export type StellarThresholdLevel = 'low' | 'medium' | 'high';

/**
 * Maps a contract method to the Stellar account threshold level it needs.
 *
 * Conservative by design: fund-moving and admin operations require `high`,
 * read-mostly reporting requires `medium`, and anything unrecognised
 * (`custom`) requires `high` so novel operations fail safe.
 */
export function requiredThresholdLevelForMethod(
  method: MultiSigContractMethod,
): StellarThresholdLevel {
  switch (method) {
    case 'mint_wrap':
    case 'update_config':
    case 'custom':
      return 'high';
    case 'submit_stats':
      return 'medium';
  }
}

/**
 * Validates a proposal's signer threshold. Returns an error message when
 * the threshold can never be satisfied, `null` when it is sane.
 *
 * A threshold below 1 would leave the proposal immediately executable;
 * a threshold above the signer count could never be met.
 */
export function validateProposalThreshold(
  signerCount: number,
  threshold: number,
): string | null {
  if (!Number.isInteger(threshold) || threshold < 1) {
    return `Threshold must be a positive integer, got ${threshold}`;
  }
  if (threshold > signerCount) {
    return `Threshold ${threshold} exceeds signer count ${signerCount} and could never be met`;
  }
  return null;
}
