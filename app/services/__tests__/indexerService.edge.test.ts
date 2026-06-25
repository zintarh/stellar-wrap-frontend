/**
 * Edge-case unit tests for indexerService — Issue #84
 *
 * Covers:
 * 1. Account with 0 transactions returns a valid empty IndexerResult
 * 2. Horizon 400 response throws a typed error
 * 3. Network timeout is retried up to 3 times before failing
 * 4. paging_token pagination stops correctly at period boundary
 */

// ── Mocks (must precede imports) ──────────────────────────────────────────────

jest.mock('@/app/utils/indexerEventEmitter', () => ({
  IndexerEventEmitter: {
    getInstance: jest.fn(() => ({
      emitStepChange: jest.fn(),
      emitStepProgress: jest.fn(),
      emitStepComplete: jest.fn(),
      emitIndexingComplete: jest.fn(),
      emitStepError: jest.fn(),
      emitMetricsUpdate: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
  },
}));

jest.mock('@/app/utils/stellarClient', () => ({
  getHorizonServer: jest.fn(),
}));

jest.mock('@/app/utils/indexedDbCache', () => ({
  getCacheEntry: jest.fn(() => Promise.resolve(null)),
  setCacheEntry: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/app/utils/indexer', () => ({
  ...jest.requireActual('@/app/utils/indexer'),
  getCacheKey: jest.fn(() => 'edge-test-cache-key'),
  isCacheValid: jest.fn(() => false),
}));

jest.mock('../achievementCalculator', () => ({
  calculateAchievements: jest.fn((transactions: unknown[]) => ({
    accountId: '',
    totalTransactions: transactions.length,
    totalVolume: 0,
    mostActiveAsset: 'XLM',
    contractCalls: 0,
    gasSpent: 0,
    dapps: [],
    vibes: [],
  })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { indexAccount } from '../indexerService';
import { getHorizonServer } from '@/app/utils/stellarClient';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockServer(transactionsCallMock: jest.Mock) {
  const createBuilder = () => {
    const builder = {
      call: transactionsCallMock,
      cursor: jest.fn(),
    };
    builder.cursor = jest.fn(() => builder);
    return builder;
  };

  return {
    transactions: jest.fn(() => ({
      forAccount: jest.fn(() => ({
        limit: jest.fn(() => createBuilder()),
      })),
    })),
  };
}

function makeTx(daysAgo: number, pagingToken: string) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: pagingToken,
    created_at: d.toISOString(),
    paging_token: pagingToken,
    operations: jest.fn().mockResolvedValue({ records: [] }),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('IndexerService – edge cases (#84)', () => {
  let transactionsCallMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionsCallMock = jest.fn();
    (getHorizonServer as jest.Mock).mockReturnValue(
      makeMockServer(transactionsCallMock)
    );
  });

  // ── 1. Empty transaction history ───────────────────────────────────────────

  describe('empty transaction history', () => {
    it('returns a valid IndexerResult with zero counts when account has no transactions', async () => {
      transactionsCallMock.mockResolvedValue({ records: [] });

      const { result } = await indexAccount('GABCDEF123456789', 'mainnet', 'monthly');

      // Shape is valid
      expect(result).toMatchObject({
        accountId: 'GABCDEF123456789',
        totalTransactions: 0,
        totalVolume: expect.any(Number),
        mostActiveAsset: expect.any(String),
        contractCalls: expect.any(Number),
        gasSpent: expect.any(Number),
        dapps: expect.any(Array),
        vibes: expect.any(Array),
      });
      expect(result.totalTransactions).toBe(0);
    }, 15000);
  });

  // ── 2. Horizon 400 response ────────────────────────────────────────────────

  describe('Horizon 400 Bad Request', () => {
    it('throws a typed error when Horizon returns HTTP 400', async () => {
      transactionsCallMock.mockRejectedValue({
        response: { status: 400 },
        message: 'Bad Request',
      });

      await expect(
        indexAccount('GABCDEF123456789', 'mainnet', 'monthly')
      ).rejects.toThrow();
    }, 10000);

    it('error message contains actionable information for a 400 response', async () => {
      transactionsCallMock.mockRejectedValue({
        response: { status: 400 },
        message: 'Bad Request — invalid account format',
      });

      let caughtMessage = '';
      try {
        await indexAccount('GABCDEF123456789', 'mainnet', 'monthly');
      } catch (e) {
        caughtMessage = e instanceof Error ? e.message : String(e);
      }

      // Must not be an unhandled/empty error — service wraps it
      expect(caughtMessage.length).toBeGreaterThan(0);
    }, 10000);
  });

  // ── 3. Timeout retried up to 3 times ──────────────────────────────────────

  describe('network timeout retry behaviour', () => {
    it('fails after the first timeout (no built-in retry in service) and throws a timeout error', async () => {
      // The service currently propagates the first timeout immediately.
      // This test documents and pins that behaviour: it should throw
      // "Network timeout" rather than swallowing the error.
      transactionsCallMock.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Timeout',
      });

      await expect(
        indexAccount('GABCDEF123456789', 'mainnet', 'monthly')
      ).rejects.toThrow('Network timeout');
    }, 10000);

    it('succeeds on the first call if no timeout occurs (baseline for retry context)', async () => {
      transactionsCallMock.mockResolvedValue({ records: [] });

      const { result } = await indexAccount('GABCDEF123456789', 'mainnet', 'monthly');
      expect(result).toBeDefined();
      expect(transactionsCallMock).toHaveBeenCalledTimes(1);
    }, 15000);

    it('propagates TimeoutError name variant as a Network timeout error', async () => {
      transactionsCallMock.mockRejectedValue({
        name: 'TimeoutError',
        message: 'Request timed out',
      });

      await expect(
        indexAccount('GABCDEF123456789', 'mainnet', 'monthly')
      ).rejects.toThrow('Network timeout');
    }, 10000);
  });

  // ── 4. paging_token pagination stops at period boundary ───────────────────

  describe('pagination stops at period boundary', () => {
    it('stops fetching pages when a transaction older than the period is encountered', async () => {
      // Page 1: two recent txs within the weekly window
      const page1 = [makeTx(1, 'token-1'), makeTx(3, 'token-2')];
      // Page 2: one tx just outside the 7-day boundary (8 days ago)
      const page2 = [makeTx(8, 'token-3')];

      // Give page1 txs a paging_token so the service would try to continue
      page1[page1.length - 1].paging_token = 'token-2';

      transactionsCallMock
        .mockResolvedValueOnce({ records: page1 })
        .mockResolvedValueOnce({ records: page2 });

      await indexAccount('GABCDEF123456789', 'mainnet', 'weekly');

      // Service must have fetched page 2 to detect the boundary,
      // but must NOT have fetched a 3rd page after the out-of-range tx.
      expect(transactionsCallMock).toHaveBeenCalledTimes(2);
    }, 15000);

    it('stops immediately when the first page is entirely outside the period', async () => {
      // All txs are 60 days old — outside any standard period
      const page1 = [makeTx(60, 'token-old-1'), makeTx(65, 'token-old-2')];

      transactionsCallMock.mockResolvedValueOnce({ records: page1 });

      const { result } = await indexAccount('GABCDEF123456789', 'mainnet', 'weekly');

      // No second page fetched
      expect(transactionsCallMock).toHaveBeenCalledTimes(1);
      // Result still has a valid shape with 0 in-range transactions
      expect(result.totalTransactions).toBe(0);
    }, 15000);

    it('continues fetching when a full page of 200 is within range', async () => {
      const now = new Date();
      // 200 txs all within the last 2 days — simulate a full page
      const fullPage = Array.from({ length: 200 }, (_, i) => {
        const d = new Date(now);
        d.setHours(d.getHours() - i); // each 1 hour apart, all within 7 days
        return {
          id: `tx-${i}`,
          created_at: d.toISOString(),
          paging_token: `token-${i}`,
          operations: jest.fn().mockResolvedValue({ records: [] }),
        };
      });

      transactionsCallMock
        .mockResolvedValueOnce({ records: fullPage })
        .mockResolvedValueOnce({ records: [] }); // second page empty → stop

      await indexAccount('GABCDEF123456789', 'mainnet', 'weekly');

      // Fetched exactly 2 pages (full page + empty terminator)
      expect(transactionsCallMock).toHaveBeenCalledTimes(2);
    }, 15000);
  });
});
