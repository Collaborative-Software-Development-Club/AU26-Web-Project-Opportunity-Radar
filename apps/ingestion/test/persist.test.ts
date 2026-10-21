import assert from 'node:assert/strict';
import test from 'node:test';
import { loadOpportunities, type OpportunityStore } from '../src/pipeline/persist';
import { normalizeGrantsGovOpportunity, normalizeScholarships360 } from '../src/pipeline/normalize';

test('loadOpportunities is repeatable, preserves first-seen time, and isolates failures', async () => {
  const rows = new Map<string, { id: string; firstSeenAt: Date; verifiedAt: Date }>();
  let nextId = 0;
  const store: OpportunityStore = {
    async upsert(record, now) {
      const existing = rows.get(record.externalId);
      if (existing) {
        existing.verifiedAt = now;
        return { id: existing.id, inserted: false };
      }
      const id = String(++nextId);
      rows.set(record.externalId, { id, firstSeenAt: now, verifiedAt: now });
      return { id, inserted: true };
    },
    async attachCategory(opportunityId) {
      if (opportunityId === '2') throw new Error('simulated category failure');
    },
    async setCompensationText() {},
    async expireOverdue() { return 0; },
  };
  const valid = normalizeGrantsGovOpportunity({ id: 'a', title: 'A' });
  const fails = normalizeGrantsGovOpportunity({ id: 'b', title: 'B' });
  const firstSeen = new Date('2026-09-01T00:00:00.000Z');
  const lastSeen = new Date('2026-09-30T00:00:00.000Z');

  const first = await loadOpportunities('grants-gov', [valid, fails], store, firstSeen);
  const second = await loadOpportunities('grants-gov', [valid], store, lastSeen);

  assert.deepEqual(first, { inserted: 1, updated: 0, failed: 1 });
  assert.deepEqual(second, { inserted: 0, updated: 1, failed: 0 });
  assert.equal(rows.size, 2);
  assert.equal(rows.get('a')?.firstSeenAt, firstSeen);
  assert.equal(rows.get('a')?.verifiedAt, lastSeen);
});

test('loadOpportunities expires overdue rows for its source even when there are no records', async () => {
  const expiredSources: string[] = [];
  const store: OpportunityStore = {
    async upsert() { throw new Error('upsert should not run'); },
    async attachCategory() {},
    async setCompensationText() {},
    async expireOverdue(sourceName) {
      expiredSources.push(sourceName);
      return 3;
    },
  };

  const result = await loadOpportunities('scholarships360', [], store);

  assert.deepEqual(expiredSources, ['scholarships360']);
  assert.deepEqual(result, { inserted: 0, updated: 3, failed: 0 });
});

test('loadOpportunities links each record to its own category and keeps pay text', async () => {
  const calls: string[] = [];
  const store: OpportunityStore = {
    async upsert(record) { return { id: record.externalId, inserted: true }; },
    async attachCategory(id, category) { calls.push(`${id}:category:${category.slug}`); },
    async setCompensationText(id, text) { calls.push(`${id}:pay:${text}`); },
    async expireOverdue() { return 0; },
  };
  const grant = normalizeGrantsGovOpportunity({ id: 'g1', title: 'Grant' });
  const scholarship = normalizeScholarships360({
    sourceType: 'scrape', sourceName: 'scholarships360', sourceUrl: 'https://example.test/list',
    externalId: 'a'.repeat(64), title: 'Scholarship', applicationUrl: 'https://example.test/s', compensation: '$500',
  });

  await loadOpportunities('mixed', [grant, scholarship], store);

  assert.deepEqual(calls, ['g1:category:grant', `${'a'.repeat(64)}:category:scholarship`, `${'a'.repeat(64)}:pay:$500`]);
});
