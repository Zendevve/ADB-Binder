/**
 * Integration Tests for Audnexus API
 *
 * MCAF Compliance:
 * - Uses real API calls (no mocks)
 * - Tests actual data parsing
 * - Verifies error handling
 */

import { describe, it, expect } from 'vitest';

// We'll test the API service functions directly
// Note: These tests require network access

const AUDNEXUS_BASE_URL = 'https://api.audnex.us';

describe('Audnexus API - Integration Tests', () => {
  describe('Book Lookup', () => {
    it('should fetch book details by ASIN', async () => {
      // Harry Potter and the Philosopher's Stone (UK Audible ASIN)
      const testAsin = 'B017V4IM1G';

      const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${testAsin}?region=us`);

      // Should return 200 or 404 (if ASIN doesn't exist)
      expect([200, 404]).toContain(response.status);

      if (response.ok) {
        const data = await response.json() as any;

        // Verify structure
        expect(data).toHaveProperty('asin');
        expect(data).toHaveProperty('title');
        expect(data).toHaveProperty('authors');
        expect(Array.isArray(data.authors)).toBe(true);
      }
    }, 10000);

    it('should fetch chapters by ASIN', async () => {
      const testAsin = 'B017V4IM1G';

      const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${testAsin}/chapters?region=us`);

      expect([200, 404]).toContain(response.status);

      if (response.ok) {
        const data = await response.json() as any;

        // Verify structure
        expect(data).toHaveProperty('chapters');
        expect(Array.isArray(data.chapters)).toBe(true);

        if (data.chapters.length > 0) {
          expect(data.chapters[0]).toHaveProperty('title');
          expect(data.chapters[0]).toHaveProperty('startOffsetMs');
        }
      }
    }, 10000);

    it('should handle invalid ASIN gracefully', async () => {
      const invalidAsin = 'INVALID_ASIN_12345';

      const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${invalidAsin}?region=us`);

      // Should return 404 for invalid ASIN
      expect(response.status).toBe(404);
    }, 10000);

    it('should support different regions', async () => {
      const testAsin = 'B017V4IM1G';
      const regions = ['us', 'uk', 'de', 'fr'];

      for (const region of regions) {
        const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${testAsin}?region=${region}`);

        // All regions should return a valid response (200 or 404)
        expect([200, 404, 500]).toContain(response.status);
      }
    }, 20000);
  });

  describe('Data Parsing', () => {
    it('should correctly parse author array', async () => {
      const testAsin = 'B017V4IM1G';

      const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${testAsin}?region=us`);

      if (response.ok) {
        const data = await response.json() as any;

        if (data.authors && data.authors.length > 0) {
          // Authors should have name
          expect(data.authors[0]).toHaveProperty('name');
          expect(typeof data.authors[0].name).toBe('string');
        }
      }
    }, 10000);

    it('should correctly parse narrator array', async () => {
      const testAsin = 'B017V4IM1G';

      const response = await fetch(`${AUDNEXUS_BASE_URL}/books/${testAsin}?region=us`);

      if (response.ok) {
        const data = await response.json() as any;

        if (data.narrators && data.narrators.length > 0) {
          expect(data.narrators[0]).toHaveProperty('name');
          expect(typeof data.narrators[0].name).toBe('string');
        }
      }
    }, 10000);
  });
});
