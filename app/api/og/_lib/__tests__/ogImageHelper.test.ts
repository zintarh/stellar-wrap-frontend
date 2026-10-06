/**
 * Security tests for ogImageHelper (Path Traversal Prevention)
 *
 * Tests that the fetchOgArchetypeImage function properly validates
 * archetype image paths to prevent path traversal attacks.
 *
 * @module ogImageHelper.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Import after setting up mocks
const { fetchOgArchetypeImage } = await import('../ogImageHelper');

describe('ogImageHelper - Path Traversal Prevention', () => {
  const baseUrl = 'https://example.com';

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Path Traversal Attacks', () => {
    it('should reject path traversal with .. sequences', async () => {
      const maliciousPath = '/archetypes/../api/secret.png';
      
      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer', maliciousPath);

      // Should fall back to persona-derived path, not use malicious path
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/archetypes/../api/secret.png')
      );
      
      // Should try the safe persona-derived paths instead
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/archetypes/og/explorer.png')
      );
    });

    it('should reject path traversal attempting to reach API routes', async () => {
      const maliciousPath = '/archetypes/../../api/og/twitter/route.tsx';
      
      await fetchOgArchetypeImage(baseUrl, 'Wizard', maliciousPath);

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('../../api/')
      );
    });

    it('should reject paths with URL encoding for traversal', async () => {
      const maliciousPath = '/archetypes/%2e%2e/api/secret.png';
      
      await fetchOgArchetypeImage(baseUrl, 'Hodler', maliciousPath);

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('%2e%2e')
      );
    });

    it('should reject double-slash attempts', async () => {
      const maliciousPath = '/archetypes//api//secret.png';
      
      await fetchOgArchetypeImage(baseUrl, 'Explorer', maliciousPath);

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('//')
      );
    });

    it('should render default image on traversal attempt', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const maliciousPath = '/archetypes/../../../etc/passwd';
      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer', maliciousPath);

      // Should have attempted to fetch the safe default path
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/explorer.png');
      
      // Should return a valid data URI (not null, meaning it used the safe fallback)
      expect(result).toBeTruthy();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('Allowlist Validation', () => {
    it('should accept known archetype slugs from the allowlist', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const validPath = '/archetypes/wizard.png';
      await fetchOgArchetypeImage(baseUrl, 'Wizard', validPath);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/wizard.png');
    });

    it('should reject unknown archetype slugs not in the allowlist', async () => {
      const invalidPath = '/archetypes/unknown-archetype.png';
      
      await fetchOgArchetypeImage(baseUrl, 'Explorer', invalidPath);

      // Should not fetch the invalid path
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('unknown-archetype')
      );
      
      // Should fall back to persona-derived path
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/archetypes/og/explorer.png')
      );
    });

    it('should accept all known archetype slugs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const knownSlugs = [
        'explorer',
        'hodler',
        'wizard',
        'yield-farmer',
      ];

      for (const slug of knownSlugs) {
        mockFetch.mockClear();
        const path = `/archetypes/${slug}.png`;
        await fetchOgArchetypeImage(baseUrl, slug, path);

        expect(mockFetch).toHaveBeenCalled();
      }
    });
  });

  describe('Path Structure Validation', () => {
    it('should accept valid og/ subdirectory paths', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const validPath = '/archetypes/og/wizard.png';
      await fetchOgArchetypeImage(baseUrl, 'Wizard', validPath);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/wizard.png');
    });

    it('should accept valid responsive/ subdirectory paths', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const validPath = '/archetypes/responsive/128/wizard.png';
      await fetchOgArchetypeImage(baseUrl, 'Wizard', validPath);

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/wizard.png');
    });

    it('should reject paths not starting with /archetypes/', async () => {
      const invalidPath = '/public/images/logo.png';
      
      await fetchOgArchetypeImage(baseUrl, 'Explorer', invalidPath);

      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/public/images/')
      );
    });

    it('should reject absolute URLs', async () => {
      const externalUrl = 'https://evil.example/malicious.png';
      
      await fetchOgArchetypeImage(baseUrl, 'Wizard', externalUrl);

      expect(mockFetch).not.toHaveBeenCalledWith(externalUrl);
    });
  });

  describe('Content-Type Validation', () => {
    it('should only accept image content types', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer', '/archetypes/explorer.png');

      // Should return null when content-type is not an image
      expect(result).toBeNull();
    });

    it('should accept image/png content type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer', '/archetypes/explorer.png');

      expect(result).toBeTruthy();
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should accept image/webp content type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/webp' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer', '/archetypes/explorer.webp');

      expect(result).toBeTruthy();
      expect(result).toMatch(/^data:image\/webp;base64,/);
    });

    it('should reject non-image responses to prevent data leaks', async () => {
      const htmlResponse = '<html><body>Secret API Data</body></html>';
      const buffer = new TextEncoder().encode(htmlResponse).buffer;

      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        arrayBuffer: async () => buffer,
      });

      const result = await fetchOgArchetypeImage(
        baseUrl,
        'Explorer',
        '/archetypes/explorer.png'
      );

      // Should not leak non-image response
      expect(result).toBeNull();
    });
  });

  describe('Persona-Derived Path (Safe Default)', () => {
    it('should derive path from persona when no explicit path given', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      await fetchOgArchetypeImage(baseUrl, 'The Wizard');

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/wizard.png');
    });

    it('should normalize persona with spaces and "The" prefix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      await fetchOgArchetypeImage(baseUrl, 'The Yield Farmer');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/archetypes/og/yield-farmer.png'
      );
    });

    it('should use safe persona-derived path when explicit path is malicious', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      await fetchOgArchetypeImage(
        baseUrl,
        'Explorer',
        '/archetypes/../api/internal.json'
      );

      // Should fall back to safe persona-derived path
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/archetypes/og/explorer.png');
    });
  });

  describe('Error Handling', () => {
    it('should return null when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer');

      expect(result).toBeNull();
    });

    it('should return null when response is not ok', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchOgArchetypeImage(baseUrl, 'Explorer');

      expect(result).toBeNull();
    });

    it('should not leak error details from failed malicious requests', async () => {
      mockFetch.mockRejectedValue(new Error('File not found: /etc/passwd'));

      const result = await fetchOgArchetypeImage(
        baseUrl,
        'Explorer',
        '/archetypes/../../etc/passwd'
      );

      // Should return null without exposing error details
      expect(result).toBeNull();
    });
  });

  describe('Cache Behavior', () => {
    it('should cache successful fetches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: { get: () => 'image/png' },
        arrayBuffer: async () => new ArrayBuffer(8),
      });

      // First call
      const result1 = await fetchOgArchetypeImage(baseUrl, 'Explorer');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await fetchOgArchetypeImage(baseUrl, 'Explorer');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call

      expect(result1).toBe(result2);
    });
  });
});
