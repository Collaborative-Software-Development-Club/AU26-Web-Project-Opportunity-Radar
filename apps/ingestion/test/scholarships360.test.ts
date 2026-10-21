import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Adjust this to wherever parseScholarships360 is exported from.
import { parseScholarships360 } from '../src/sources/static-scrapers';

const PAGE_URL =
  'https://scholarships360.org/scholarships/top-ohio-scholarships/?sidebar_sort=relevant&current_page=1&filter=college_and_grad';

// Adjust if your fixture lives somewhere else.
const FIXTURE_PATH = fileURLToPath(
  new URL('./fixtures/scholarships360-page1.html', import.meta.url),
);

const OPENING = 'Calling all Ohio residents';

// Parse once; every test below reads from the same saved HTML (no network).
const html = readFileSync(FIXTURE_PATH, 'utf8');
const results = parseScholarships360(html, PAGE_URL);

describe('parseScholarships360 (saved page 1)', () => {
  it('returns 30 records', () => {
    expect(results).toHaveLength(30);
  });

  it('parses the first card exactly', () => {
    const first = results[0];

    expect(first.title).toBe('Ohio Education and Training Voucher Scholarship');
    expect(first.applicationUrl).toBe(
      'https://scholarships360.org/scholarships/search/ohio-education-and-training-voucher-scholarship/',
    );
    expect(first.compensation).toBe('Varies');
    expect(first.deadline).toBe('Jul 31, 2027');
    expect(first.sourceType).toBe('scrape');
    expect(first.sourceName).toBe('scholarships360');
    expect(first.sourceUrl).toBe(PAGE_URL);

    const description = first.description ?? '';
    expect(description.startsWith(OPENING)).toBe(true);
    // Guards against the bug where the excerpt AND the full text were both captured.
    expect(description.split(OPENING).length - 1).toBe(1);
  });

  it('parses a card with a "Rolling" deadline', () => {
    const card = results.find((r) => r.title === 'Choose Ohio First Scholarship');

    expect(card).toBeDefined();
    expect(card?.compensation).toBe('$6,000');
    expect(card?.deadline).toBe('Rolling');
  });

  it('returns well-formed records', () => {
    for (const r of results) {
      // The second argument to expect() is the message shown on failure,
      // so you can see which scholarship broke.
      expect(r.title, 'title').toBeTruthy();
      expect(r.applicationUrl, r.title).toMatch(/^https:\/\//);
      expect(r.externalId, r.title).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('cleans up descriptions', () => {
    for (const r of results) {
      if (r.description === undefined) continue;
      expect(r.description, r.title).not.toContain('Show More');
      expect(r.description, r.title).not.toMatch(/\n/);
    }
  });

  it('produces stable, unique IDs', () => {
    const idsFirstRun = results.map((r) => r.externalId);
    const idsSecondRun = parseScholarships360(html, PAGE_URL).map((r) => r.externalId);

    // Same input, same IDs (idempotency).
    expect(idsSecondRun).toEqual(idsFirstRun);
    // No two records share an ID (uniqueness).
    expect(new Set(idsFirstRun).size).toBe(30);
  });
});