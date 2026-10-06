/**
 * Test utilities and helpers for service unit tests
 */

import { IndexedTransaction, HorizonTransaction, HorizonOperation } from '../achievement/horizonTypes';
import { AssetInfo } from '../achievement/types';

/**
 * Creates a mock Horizon transaction
 */
export function createMockTransaction(overrides?: Partial<HorizonTransaction>): HorizonTransaction {
  const now = new Date();
  return {
    id: '123456789',
    paging_token: '123456789',
    hash: '0xabcdef123456',
    ledger: 1000000,
    created_at: now.toISOString(),
    source_account: 'GABCDEF123456789',
    source_account_sequence: '1000000',
    fee_account: 'GABCDEF123456789',
    fee_charged: '100',
    operation_count: 1,
    envelope_xdr: 'mock_xdr',
    result_xdr: 'mock_result_xdr',
    result_meta_xdr: 'mock_meta_xdr',
    fee_meta_xdr: 'mock_fee_meta_xdr',
    memo_type: 'none',
    signatures: ['sig1', 'sig2'],
    successful: true,
    ...overrides,
  };
}

/**
 * Creates a mock Horizon operation
 */
export function createMockOperation(overrides?: Partial<HorizonOperation>): HorizonOperation {
  const now = new Date();
  return {
    id: '987654321',
    paging_token: '987654321',
    transaction_successful: true,
    source_account: 'GABCDEF123456789',
    type: 'payment',
    type_i: 1,
    created_at: now.toISOString(),
    transaction_hash: '0xabcdef123456',
    ...overrides,
  };
}

/**
 * Creates a mock indexed transaction
 */
export function createMockIndexedTransaction(
  transactionOverrides?: Partial<HorizonTransaction>,
  operations?: HorizonOperation[]
): IndexedTransaction {
  return {
    transaction: createMockTransaction(transactionOverrides),
    operations: operations || [createMockOperation()],
  };
}

/**
 * Creates a mock payment operation
 */
export function createMockPaymentOperation(
  amount: string = '100.0',
  assetCode: string = 'XLM',
  assetIssuer?: string
): HorizonOperation {
  return createMockOperation({
    type: 'payment',
    type_i: 1,
    amount,
    asset_type: assetCode === 'XLM' ? 'native' : 'credit_alphanum4',
    asset_code: assetCode === 'XLM' ? undefined : assetCode,
    asset_issuer: assetIssuer,
    from: 'GABCDEF123456789',
    to: 'GZYXWV987654321',
  });
}

/**
 * Creates a mock contract invocation operation
 */
export function createMockContractOperation(
  contractId: string = 'CONTRACT123',
  functionName: string = 'transfer'
): HorizonOperation {
  return createMockOperation({
    type: 'invokeHostFunction',
    type_i: 24,
    contract: contractId,
    contract_id: contractId,
    function: functionName,
  });
}

/**
 * Creates a mock extend footprint operation
 */
export function createMockExtendFootprintOperation(
  contractId: string = 'CONTRACT123'
): HorizonOperation {
  return createMockOperation({
    type: 'extendFootprintTtl',
    type_i: 17,
    contract: contractId,
    contract_id: contractId,
  });
}

/**
 * Creates transactions within a specific timeframe
 */
export function createTransactionsInTimeframe(
  count: number,
  timeframe: '1w' | '2w' | '1m',
  startFromNow: boolean = true
): IndexedTransaction[] {
  const transactions: IndexedTransaction[] = [];
  const now = new Date();
  
  let daysBack: number;
  switch (timeframe) {
    case '1w':
      daysBack = 7;
      break;
    case '2w':
      daysBack = 14;
      break;
    case '1m':
      daysBack = 30;
      break;
    default:
      daysBack = 7;
  }

  for (let i = 0; i < count; i++) {
    const daysAgo = startFromNow ? (daysBack - i) : i;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    transactions.push(
      createMockIndexedTransaction({
        created_at: date.toISOString(),
      })
    );
  }

  return transactions;
}

/**
 * Creates transactions outside a specific timeframe
 */
export function createTransactionsOutsideTimeframe(
  count: number,
  timeframe: '1w' | '2w' | '1m'
): IndexedTransaction[] {
  const transactions: IndexedTransaction[] = [];
  const now = new Date();
  
  let daysBack: number;
  switch (timeframe) {
    case '1w':
      daysBack = 8;
      break;
    case '2w':
      daysBack = 15;
      break;
    case '1m':
      daysBack = 31;
      break;
    default:
      daysBack = 8;
  }

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (daysBack + i));
    
    transactions.push(
      createMockIndexedTransaction({
        created_at: date.toISOString(),
      })
    );
  }

  return transactions;
}

/**
 * Creates a mock asset info
 */
export function createMockAssetInfo(
  code: string = 'XLM',
  issuer?: string
): AssetInfo {
  return {
    code,
    issuer,
    type: code === 'XLM' ? 'native' : 'credit_alphanum4',
  };
}

/**
 * Helper to create multiple payment transactions with different assets
 */
export function createMultiAssetTransactions(
  assetConfigs: Array<{ code: string; issuer?: string; amount: string; count: number }>
): IndexedTransaction[] {
  const transactions: IndexedTransaction[] = [];
  
  assetConfigs.forEach(({ code, issuer, amount, count }) => {
    for (let i = 0; i < count; i++) {
      transactions.push(
        createMockIndexedTransaction(
          {},
          [createMockPaymentOperation(amount, code, issuer)]
        )
      );
    }
  });

  return transactions;
}

/**
 * Helper to create transactions with contract calls
 */
export function createContractCallTransactions(
  contractConfigs: Array<{ contractId: string; functionName?: string; count: number }>
): IndexedTransaction[] {
  const transactions: IndexedTransaction[] = [];
  
  contractConfigs.forEach(({ contractId, functionName, count }) => {
    for (let i = 0; i < count; i++) {
      transactions.push(
        createMockIndexedTransaction(
          {},
          [createMockContractOperation(contractId, functionName)]
        )
      );
    }
  });

  return transactions;
}
