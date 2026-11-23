import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { parseDevpost, DevpostScraper } from '../src/sources/devpost-scraper';
import { loadOpportunities, type OpportunityStore } from '../src/pipeline/persist';
import type { NormalizedOpportunity } from '../src/pipeline/normalize';
import { normalizeDevpost } from '../src/pipeline/normalize';

const PAGE_URL =
  'https://devpost.com/api/hackathons?page=1&status[]=upcoming&status[]=open&order_by=deadline';

const FIXTURE_PATH = fileURLToPath(new URL('./fixtures/devpost-page1.json', import.meta.url));

// Parse once; the fixture tests read from the same saved JSON (no network).
const body = readFileSync(FIXTURE_PATH, 'utf8');
const results = parseDevpost(body, PAGE_URL);
const rawHackathons: { id?: number; title?: string; url?: string; open_state?: string }[] =
  JSON.parse(body).hackathons;

// Small helper for edge cases that the saved page may not contain.
const make = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    hackathons: [{ id: 1, title: 'Test Hack', url: 'https://test.devpost.com/', open_state: 'open', ...overrides }],
  });

describe('parseDevpost (saved page 1)', () => {
  it('returns a record for every valid, non-ended hackathon', () => {
    const expected = rawHackathons.filter(
      (h) => h.id && h.title?.trim() && h.url && h.open_state !== 'ended',
    ).length;
    assert.ok(expected > 0, 'fixture should contain hackathons');
    assert.equal(results.length, expected);
  });

  it('parses the first record against the raw JSON', () => {
    const raw = rawHackathons.find((h) => h.id && h.title?.trim() && h.url && h.open_state !== 'ended')!;
    const first = results[0]!;

    assert.equal(first.title, raw.title!.trim());
    assert.equal(first.applicationUrl, raw.url);
    assert.equal(first.externalId, String(raw.id));
    assert.equal(first.sourceType, 'api');
    assert.equal(first.sourceName, 'devpost');
    assert.equal(first.sourceUrl, PAGE_URL);
  });

  it('returns well-formed records', () => {
    for (const r of results) {
      assert.ok(r.title, 'title');
      assert.match(r.applicationUrl, /^https?:\/\//, r.title);
      assert.match(r.externalId, /^\d+$/, r.title);
    }
  });

  it('strips HTML from prize amounts', () => {
    for (const r of results) {
      if (r.compensation === undefined) continue;
      assert.doesNotMatch(r.compensation, /[<>]/, r.title);
      assert.match(r.compensation, / in prizes$/, r.title);
    }
  });

  it('cleans up descriptions', () => {
    for (const r of results) {
      if (r.description === undefined) continue;
      assert.doesNotMatch(r.description, /\n/, r.title);
      assert.ok(!r.description.includes('undefined'), r.title);
    }
  });

  it('produces stable, unique IDs', () => {
    const idsFirstRun = results.map((r) => r.externalId);
    const idsSecondRun = parseDevpost(body, PAGE_URL).map((r) => r.externalId);

    assert.deepEqual(idsSecondRun, idsFirstRun);
    assert.equal(new Set(idsFirstRun).size, results.length);
  });
});

describe('parseDevpost (edge cases)', () => {
  it('skips ended hackathons', () => {
    assert.equal(parseDevpost(make({ open_state: 'ended' }), PAGE_URL).length, 0);
  });

  it('skips records missing an id, title, or url', () => {
    assert.equal(parseDevpost(make({ id: undefined }), PAGE_URL).length, 0);
    assert.equal(parseDevpost(make({ title: '   ' }), PAGE_URL).length, 0);
    assert.equal(parseDevpost(make({ url: undefined }), PAGE_URL).length, 0);
  });

  it('returns [] for malformed JSON or a missing hackathons key', () => {
    assert.deepEqual(parseDevpost('not json', PAGE_URL), []);
    assert.deepEqual(parseDevpost('{}', PAGE_URL), []);
  });

  it('extracts the prize from its HTML wrapper', () => {
    const [r] = parseDevpost(
      make({ prize_amount: '$<span data-currency-value>10,000</span>' }),
      PAGE_URL,
    );
    assert.equal(r!.compensation, '$10,000 in prizes');
  });

  it('omits compensation for a zero prize', () => {
    const [r] = parseDevpost(make({ prize_amount: '$<span data-currency-value>0</span>' }), PAGE_URL);
    assert.equal(r!.compensation, undefined);
  });

  it('builds the description from the available parts', () => {
    const [r] = parseDevpost(
      make({
        organization_name: 'OSU',
        displayed_location: { location: 'Columbus, OH' },
        invite_only: true,
        themes: [{ name: 'Web' }, { name: 'AI' }],
      }),
      PAGE_URL,
    );
    assert.equal(r!.description, 'Hosted by OSU · Columbus, OH · Invite only · Themes: Web, AI');
  });

  it('leaves description undefined when there is nothing to say', () => {
    const [r] = parseDevpost(make(), PAGE_URL);
    assert.equal(r!.description, undefined);
  });

  it('passes the raw submission window through as the deadline', () => {
    const [r] = parseDevpost(make({ submission_period_dates: 'Oct 20 - Nov 25, 2026' }), PAGE_URL);
    assert.equal(r!.deadline, 'Oct 20 - Nov 25, 2026');
  });
});

describe('normalizeDevpost deadlines', () => {
  const NOW = new Date('2026-11-23T12:00:00Z');
  const deadlineFor = (dates: string | undefined) => {
    const [raw] = parseDevpost(make({ submission_period_dates: dates }), PAGE_URL);
    return normalizeDevpost(raw!, NOW).applicationDeadline;
  };

  it('uses the end of a same-year window', () => {
    assert.equal(deadlineFor('Oct 20 - Nov 25, 2026')?.toISOString(), '2026-11-25T23:59:59.999Z');
  });

  it('uses the end of a window that crosses years', () => {
    assert.equal(deadlineFor('Dec 30, 2026 - Jan 02, 2027')?.toISOString(), '2027-01-02T23:59:59.999Z');
  });

  it('borrows the month when the end has only a day', () => {
    assert.equal(deadlineFor('Nov 04 - 06, 2026')?.toISOString(), '2026-11-06T23:59:59.999Z');
  });

  it('handles a single date', () => {
    assert.equal(deadlineFor('Nov 04, 2026')?.toISOString(), '2026-11-04T23:59:59.999Z');
  });

  it('returns null for missing or unparseable dates', () => {
    assert.equal(deadlineFor(undefined), null);
    assert.equal(deadlineFor('TBD'), null);
  });

  it('marks past windows expired and future ones active', () => {
    const past = parseDevpost(make({ submission_period_dates: 'Oct 01 - 05, 2026' }), PAGE_URL)[0]!;
    const future = parseDevpost(make({ submission_period_dates: 'Dec 01 - 05, 2026' }), PAGE_URL)[0]!;
    assert.equal(normalizeDevpost(past, NOW).status, 'expired');
    assert.equal(normalizeDevpost(future, NOW).status, 'active');
  });

  it('builds a slug-safe slug and the hackathon category', () => {
    const [raw] = parseDevpost(make({ id: 12345 }), PAGE_URL);
    const n = normalizeDevpost(raw!, NOW);
    assert.equal(n.slug, 'devpost-12345');
    assert.deepEqual(n.category, { slug: 'hackathon', name: 'Hackathon' });
  });
});

const hackathon = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Hack ${id}`,
  url: `https://hack${id}.devpost.com/`,
  open_state: 'open',
  submission_period_dates: 'Dec 01 - 05, 2026',
  ...extra,
});
const pageBody = (...items: object[]) => JSON.stringify({ hackathons: items });

// Serves canned bodies by page number; any page past the list is empty, like Devpost.
function fakeFetcher(pages: string[]) {
  const calls: string[] = [];
  const fetchPage = async (url: string) => {
    calls.push(url);
    const page = Number(new URL(url).searchParams.get('page'));
    return pages[page - 1] ?? pageBody();
  };
  return { fetchPage, calls };
}

describe('DevpostScraper.fetch', () => {
  it('walks pages until Devpost returns an empty one', async () => {
    const { fetchPage, calls } = fakeFetcher([pageBody(hackathon(1), hackathon(2)), pageBody(hackathon(3))]);
    const records = await new DevpostScraper(fetchPage).fetch();
    assert.deepEqual(records.map((r) => r.externalId), ['1', '2', '3']);
    assert.equal(calls.length, 3);
  });

  it('keeps going past a page where every hackathon was filtered out', async () => {
    const { fetchPage } = fakeFetcher([pageBody(hackathon(1, { open_state: 'ended' })), pageBody(hackathon(2))]);
    const records = await new DevpostScraper(fetchPage).fetch();
    assert.deepEqual(records.map((r) => r.externalId), ['2']);
  });

  it('dedupes a hackathon that shifts onto two pages', async () => {
    const { fetchPage } = fakeFetcher([pageBody(hackathon(1), hackathon(2)), pageBody(hackathon(2), hackathon(3))]);
    const records = await new DevpostScraper(fetchPage).fetch();
    assert.deepEqual(records.map((r) => r.externalId), ['1', '2', '3']);
  });

  it('fails loudly on a block page instead of returning nothing', async () => {
    const { fetchPage } = fakeFetcher(['<html>Just a moment...</html>']);
    await assert.rejects(new DevpostScraper(fetchPage).fetch(), /not JSON/);
  });

  it('fails loudly when the hackathons array is missing', async () => {
    const { fetchPage } = fakeFetcher(['{"error":"rate limited"}']);
    await assert.rejects(new DevpostScraper(fetchPage).fetch(), /no "hackathons" array/);
  });
});

// Minimal in-memory stand-in for the database, keyed the same way the real upsert is.
function memoryStore() {
  const rows = new Map<string, NormalizedOpportunity>();
  const store: OpportunityStore = {
    async upsert(o) {
      const key = `${o.sourceName}:${o.externalId}`;
      const inserted = !rows.has(key);
      rows.set(key, o);
      return { id: key, inserted };
    },
    async attachCategory() {},
    async setCompensationText() {},
    async expireOverdue(sourceName, now) {
      let count = 0;
      for (const [key, row] of rows) {
        if (row.sourceName === sourceName && row.status === 'active' && row.applicationDeadline && row.applicationDeadline < now) {
          rows.set(key, { ...row, status: 'expired' });
          count += 1;
        }
      }
      return count;
    },
  };
  return { store, rows };
}

describe('repeated scheduled runs', () => {
  const runAt = async (store: OpportunityStore, now: Date, ...items: object[]) => {
    const raw = parseDevpost(pageBody(...items), PAGE_URL);
    return loadOpportunities('devpost', raw.map((r) => normalizeDevpost(r, now)), store, now);
  };

  it('inserts new hackathons, updates returning ones, and expires ones that ended', async () => {
    const { store, rows } = memoryStore();

    const run1 = await runAt(store, new Date('2026-11-23T12:00:00Z'), hackathon(1), hackathon(2));
    assert.deepEqual(run1, { inserted: 2, updated: 0, failed: 0 });

    // Three days later: #2 extended its deadline, #3 is new, #1 is still listed.
    const run2 = await runAt(
      store,
      new Date('2026-11-26T12:00:00Z'),
      hackathon(1),
      hackathon(2, { submission_period_dates: 'Dec 01 - 20, 2026' }),
      hackathon(3),
    );
    assert.deepEqual(run2, { inserted: 1, updated: 2, failed: 0 });
    assert.equal(rows.size, 3);
    assert.equal(rows.get('devpost:2')!.applicationDeadline?.toISOString(), '2026-12-20T23:59:59.999Z');

    // After #1's window closes it drops off the listing, and the expiry pass retires it.
    const run3 = await runAt(store, new Date('2026-12-10T12:00:00Z'), hackathon(2, { submission_period_dates: 'Dec 01 - 20, 2026' }), hackathon(3));
    assert.equal(run3.failed, 0);
    assert.equal(rows.get('devpost:1')!.status, 'expired');
    assert.equal(rows.get('devpost:2')!.status, 'active');
  });
});

describe('fixture deadlines', () => {
  it('every record in the saved page produces a deadline', () => {
    // Strict on purpose: a hackathon with no parseable deadline never expires, so a new date format should fail here.
    const missing = results.filter((r) => normalizeDevpost(r).applicationDeadline === null).map((r) => `${r.title}: ${r.deadline}`);
    assert.deepEqual(missing, []);
  });
});