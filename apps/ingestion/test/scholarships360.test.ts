import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { parseScholarships360 } from '../src/sources/static-scrapers';

const PAGE_URL =
  'https://scholarships360.org/scholarships/top-ohio-scholarships/?sidebar_sort=relevant&current_page=1&filter=college_and_grad';

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/scholarships360-page1.html', import.meta.url));

const OPENING = 'Calling all Ohio residents';

// Parse once; every test below reads from the same saved HTML (no network).
const html = readFileSync(FIXTURE_PATH, 'utf8');
const results = parseScholarships360(html, PAGE_URL);

describe('parseScholarships360 (saved page 1)', () => {
  it('returns 30 records', () => {
    assert.equal(results.length, 30);
  });

  it('parses the first card exactly', () => {
    const first = results[0]!;

    assert.equal(first.title, 'Ohio Education and Training Voucher Scholarship');
    assert.equal(
      first.applicationUrl,
      'https://scholarships360.org/scholarships/search/ohio-education-and-training-voucher-scholarship/',
    );
    assert.equal(first.compensation, 'Varies');
    assert.equal(first.deadline, 'Jul 31, 2027');
    assert.equal(first.sourceType, 'scrape');
    assert.equal(first.sourceName, 'scholarships360');
    assert.equal(first.sourceUrl, PAGE_URL);

    const description = first.description ?? '';
    assert.ok(description.startsWith(OPENING));
    // Guards against the bug where the excerpt AND the full text were both captured.
    assert.equal(description.split(OPENING).length - 1, 1);
  });

  it('parses a card with a "Rolling" deadline', () => {
    const card = results.find((r) => r.title === 'Choose Ohio First Scholarship');

    assert.ok(card);
    assert.equal(card.compensation, '$6,000');
    assert.equal(card.deadline, 'Rolling');
  });

  it('does not read an open date as the deadline', () => {
    // This card's second info box is "Open Date: Nov 1, 2026", not a deadline.
    const card = results.find((r) => r.title.startsWith('Beck'));

    assert.ok(card);
    assert.equal(card.deadline, undefined);
    // Only three cards on this page are labelled Deadline.
    assert.equal(results.filter((r) => r.deadline !== undefined).length, 3);
  });

  it('returns well-formed records', () => {
    for (const r of results) {
      assert.ok(r.title, 'title');
      assert.match(r.applicationUrl, /^https:\/\//, r.title);
      assert.match(r.externalId, /^[0-9a-f]{64}$/, r.title);
    }
  });

  it('cleans up descriptions', () => {
    for (const r of results) {
      if (r.description === undefined) continue;
      assert.ok(!r.description.includes('Show More'), r.title);
      assert.doesNotMatch(r.description, /\n/, r.title);
    }
  });

  it('produces stable, unique IDs', () => {
    const idsFirstRun = results.map((r) => r.externalId);
    const idsSecondRun = parseScholarships360(html, PAGE_URL).map((r) => r.externalId);

    // Same input, same IDs (idempotency).
    assert.deepEqual(idsSecondRun, idsFirstRun);
    // No two records share an ID (uniqueness).
    assert.equal(new Set(idsFirstRun).size, 30);
  });
});
