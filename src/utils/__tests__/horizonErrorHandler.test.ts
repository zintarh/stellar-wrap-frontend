/**
 * Edge-case tests for horizonErrorHandler (Issue #463)
 *
 * Tests error mapping for various Horizon error responses, with special
 * attention to rate limiting (429) with Retry-After headers.
 *
 * @module horizonErrorHandler.test
 */

import { describe, it, expect } from 'vitest';
import { parseHorizonError, type StructuredHorizonError } from '../horizonErrorHandler';

describe('horizonErrorHandler - Issue #463 Edge Cases', () => {
  describe('429 Rate Limiting with Retry-After', () => {
    it('should detect 429 and honor Retry-After header', async () => {
      const error = {
        response: {
          status: 429,
          data: { title: 'Rate Limit Exceeded' },
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1735430400',
            'retry-after': '60',
          },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('RATE_LIMIT');
      expect(result.status).toBe(429);
      expect(result.isRetryable).toBe(true);
      expect(result.rateLimit).toBeDefined();
      expect(result.rateLimit?.retryAfterSeconds).toBe(60);
      expect(result.rateLimit?.remaining).toBe(0);
    });

    it('should handle 429 without Retry-After header', async () => {
      const error = {
        response: {
          status: 429,
          data: { title: 'Rate Limit Exceeded' },
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1735430400',
          },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('RATE_LIMIT');
      expect(result.status).toBe(429);
      expect(result.isRetryable).toBe(true);
      expect(result.rateLimit).toBeDefined();
      expect(result.rateLimit?.retryAfterSeconds).toBeUndefined();
    });

    it('should parse Retry-After as seconds when numeric', async () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1735430400',
            'retry-after': '120',
          },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.rateLimit?.retryAfterSeconds).toBe(120);
    });
  });

  describe('429 vs 404 vs 5xx Status Distinction', () => {
    it('should mark 404 as NOT_FOUND and non-retryable', async () => {
      const error = {
        response: {
          status: 404,
          data: { title: 'Account Not Found' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('NOT_FOUND');
      expect(result.status).toBe(404);
      expect(result.isRetryable).toBe(false);
    });

    it('should mark 429 as RATE_LIMIT and retryable', async () => {
      const error = {
        response: {
          status: 429,
          data: { title: 'Rate Limit Exceeded' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('RATE_LIMIT');
      expect(result.status).toBe(429);
      expect(result.isRetryable).toBe(true);
    });

    it('should mark 500 as TRANSIENT_ERROR and retryable', async () => {
      const error = {
        response: {
          status: 500,
          data: { title: 'Internal Server Error' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TRANSIENT_ERROR');
      expect(result.status).toBe(500);
      expect(result.isRetryable).toBe(true);
    });

    it('should mark 502 as TRANSIENT_ERROR and retryable', async () => {
      const error = {
        response: {
          status: 502,
          data: { title: 'Bad Gateway' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TRANSIENT_ERROR');
      expect(result.status).toBe(502);
      expect(result.isRetryable).toBe(true);
    });

    it('should mark 503 as SERVICE_UNAVAILABLE and retryable', async () => {
      const error = {
        response: {
          status: 503,
          data: { title: 'Service Unavailable' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('SERVICE_UNAVAILABLE');
      expect(result.status).toBe(503);
      expect(result.isRetryable).toBe(true);
    });

    it('should mark 504 as TIMEOUT and retryable', async () => {
      const error = {
        response: {
          status: 504,
          data: { title: 'Gateway Timeout' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TIMEOUT');
      expect(result.status).toBe(504);
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('Each Status Class Handling', () => {
    it('should handle 4xx client errors as non-retryable (except 404, 408, 429)', async () => {
      const statuses = [400, 401, 403, 405, 422];

      for (const status of statuses) {
        const error = {
          response: {
            status,
            data: { title: 'Client Error' },
          },
        };

        const result = await parseHorizonError(error);

        expect(result.type).toBe('CLIENT_ERROR');
        expect(result.status).toBe(status);
        expect(result.isRetryable).toBe(false);
      }
    });

    it('should handle 408 as TIMEOUT and retryable', async () => {
      const error = {
        response: {
          status: 408,
          data: { title: 'Request Timeout' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TIMEOUT');
      expect(result.status).toBe(408);
      expect(result.isRetryable).toBe(true);
    });

    it('should handle generic 5xx errors as TRANSIENT_ERROR and retryable', async () => {
      const statuses = [501, 505, 507, 599];

      for (const status of statuses) {
        const error = {
          response: {
            status,
            data: { title: 'Server Error' },
          },
        };

        const result = await parseHorizonError(error);

        expect(result.type).toBe('TRANSIENT_ERROR');
        expect(result.status).toBe(status);
        expect(result.isRetryable).toBe(true);
      }
    });
  });

  describe('Network Errors', () => {
    it('should handle network connectivity errors as retryable', async () => {
      const error = {
        message: 'Network Error',
        code: 'ECONNABORTED',
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TIMEOUT');
      expect(result.isRetryable).toBe(true);
    });

    it('should handle connection aborted as TIMEOUT', async () => {
      const error = {
        code: 'ECONNABORTED',
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('TIMEOUT');
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('Rate Limit Header Extraction', () => {
    it('should extract complete rate limit information', async () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '5',
            'x-ratelimit-reset': '1735430400',
            'retry-after': '30',
          },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.rateLimit).toEqual({
        limit: 100,
        remaining: 5,
        reset: 1735430400,
        retryAfterSeconds: 30,
      });
    });

    it('should return undefined rate limit info when headers are missing', async () => {
      const error = {
        response: {
          status: 429,
          headers: {},
        },
      };

      const result = await parseHorizonError(error);

      expect(result.rateLimit).toBeUndefined();
    });

    it('should return undefined when headers are malformed', async () => {
      const error = {
        response: {
          status: 429,
          headers: {
            'x-ratelimit-limit': 'invalid',
            'x-ratelimit-remaining': 'also-invalid',
            'x-ratelimit-reset': 'not-a-number',
          },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.rateLimit).toBeUndefined();
    });
  });

  describe('Edge Cases and Unknown Errors', () => {
    it('should handle errors without response object', async () => {
      const error = {
        message: 'Something went wrong',
      };

      const result = await parseHorizonError(error);

      expect(result.type).toBe('UNKNOWN');
      expect(result.status).toBe(0);
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle completely unknown error objects', async () => {
      const error = {};

      const result = await parseHorizonError(error);

      expect(result.type).toBe('UNKNOWN');
      expect(result.status).toBe(0);
      expect(result.isRetryable).toBe(false);
      expect(result.message).toBe('Unknown Horizon Error');
    });

    it('should preserve original error for debugging', async () => {
      const error = {
        response: {
          status: 500,
          data: { title: 'Server Error' },
        },
      };

      const result = await parseHorizonError(error);

      expect(result.originalError).toBe(error);
    });
  });

  describe('Sustained Rate Limiting Detection', () => {
    it('should provide rate limit info for monitoring sustained rate limiting', async () => {
      const error = {
        response: {
          status: 429,
          data: { title: 'Rate Limit Exceeded' },
          headers: {
            'x-ratelimit-limit': '100',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Date.now() / 1000 + 300), // 5 minutes from now
            'retry-after': '300',
          },
        },
      };

      const result = await parseHorizonError(error);

      // This info can be used by calling code to determine if rate limiting is sustained
      expect(result.type).toBe('RATE_LIMIT');
      expect(result.rateLimit?.retryAfterSeconds).toBe(300);
      expect(result.rateLimit?.remaining).toBe(0);
      
      // With this data, calling code can determine whether to:
      // - Show "this is taking longer" to user (sustained)
      // - Apply backoff silently (transient)
    });
  });
});
