import assert from 'node:assert/strict';
import test from 'node:test';
import { loadOpportunities, type OpportunityStore } from '../src/pipeline/persist';
import { normalizeFreehire, normalizeGrantsGovOpportunity, normalizeScholarships360 } from '../src/pipeline/normalize';
import type { FreehireJob } from '../src/sources/freehire';
import { readFileSync } from 'node:fs';

test('loadOpportunities is repeatable, preserves first-seen time, and isolates failures', async () => {
  const rows = new Map<string, { id: string; firstSeenAt: Date; verifiedAt: Date }>();
  let nextId = 0;
  const store: OpportunityStore = {
    async ensureOrganization() { throw new Error('grants have no organization'); },
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
    async replaceLocations() {},
    async setCompensation() {},
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
    async ensureOrganization() { throw new Error('ensureOrganization should not run'); },
    async upsert() { throw new Error('upsert should not run'); },
    async attachCategory() {},
    async replaceLocations() {},
    async setCompensation() {},
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
    async ensureOrganization() { throw new Error('these sources have no organization'); },
    async upsert(record) { return { id: record.externalId, inserted: true }; },
    async attachCategory(id, category) { calls.push(`${id}:category:${category.slug}`); },
    async replaceLocations() { throw new Error('these sources have no locations'); },
    async setCompensation(id, compensation) { calls.push(`${id}:pay:${JSON.stringify(compensation)}`); },
    async expireOverdue() { return 0; },
  };
  const grant = normalizeGrantsGovOpportunity({ id: 'g1', title: 'Grant' });
  const scholarship = normalizeScholarships360({
    sourceType: 'scrape', sourceName: 'scholarships360', sourceUrl: 'https://example.test/list',
    externalId: 'a'.repeat(64), title: 'Scholarship', applicationUrl: 'https://example.test/s', compensation: '$500',
  });

  await loadOpportunities('mixed', [grant, scholarship], store);

  assert.deepEqual(calls, ['g1:category:grant', `${'a'.repeat(64)}:category:scholarship`, `${'a'.repeat(64)}:pay:{"rawText":"$500"}`]);
});

test('loadOpportunities links a Freehire job to its organization, locations and structured pay', async () => {
  const jobs = JSON.parse(readFileSync(new URL('./fixtures/freehire-jobs.json', import.meta.url), 'utf8')) as FreehireJob[];
  const calls: unknown[] = [];
  const store: OpportunityStore = {
    async ensureOrganization(organization) { calls.push(['org', organization]); return 'org-1'; },
    async upsert(record, _now, organizationId) { calls.push(['upsert', record.workMode, organizationId]); return { id: 'opp-1', inserted: true }; },
    async attachCategory(id, category) { calls.push(['category', id, category.slug]); },
    async replaceLocations(id, locations) { calls.push(['locations', id, locations]); },
    async setCompensation(id, compensation) { calls.push(['pay', id, compensation]); },
    async expireOverdue() { return 0; },
  };

  await loadOpportunities('freehire', [normalizeFreehire({ kind: 'internship', job: jobs[4]! })], store);

  assert.deepEqual(calls, [
    ['org', { name: 'SharkNinja', slug: 'sharkninja' }],
    ['upsert', 'hybrid', 'org-1'],
    ['category', 'opp-1', 'internship'],
    ['locations', 'opp-1', [{ city: 'Needham', stateRegion: 'Massachusetts', country: 'United States', countryCode: 'US' }]],
    ['pay', 'opp-1', {
      compensationType: 'pay', isPaid: true, minAmount: '26.00', maxAmount: '35.00', currency: 'USD', period: 'hour', rawText: '$26–$35/hour',
    }],
  ]);
});
