/**
 * Stellar Horizon API record types consumed by the achievement calculator.
 */

/**
 * Timeframe options for filtering transactions
 */
export type Timeframe = "1w" | "2w" | "1m" | "3m" | "6m" | "1y";

/**
 * Stellar Horizon API transaction record
 */
export interface HorizonTransaction {
  id: string;
  paging_token: string;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  source_account_sequence: string;
  fee_account: string;
  fee_charged: string;
  operation_count: number;
  envelope_xdr: string;
  result_xdr: string;
  result_meta_xdr: string;
  fee_meta_xdr: string;
  memo_type: string;
  memo?: string;
  signatures: string[];
  valid_after?: string;
  valid_before?: string;
  successful: boolean;
}

/**
 * Stellar Horizon API operation record
 */
export interface HorizonOperation {
  id: string;
  paging_token: string;
  transaction_successful: boolean;
  source_account: string;
  type: string;
  type_i: number;
  created_at: string;
  transaction_hash: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  amount?: string;
  function?: string;
  contract?: string;
  contract_id?: string;
}

/**
 * Indexed transaction with operations
 */
export interface IndexedTransaction {
  transaction: HorizonTransaction;
  operations: HorizonOperation[];
}
