import assert from 'node:assert/strict';
import test from 'node:test';
import { persistGrantsGov, type OpportunityPersistence } from '../src/pipeline/persist';
import { normalizeGrantsGovOpportunity } from '../src/pipeline/normalize';

test('persistGrantsGov is repeatable, preserves first-seen time, and isolates failures', async () => {
  const rows = new Map<string, { id: string; firstSeenAt: Date; verifiedAt: Date }>();
  let nextId = 0;
  const store: OpportunityPersistence = {
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
    async attachGrantCategory(opportunityId) {
      if (opportunityId === '2') throw new Error('simulated category failure');
    },
    async expireOverdue() { return 0; },
  };
  const valid = normalizeGrantsGovOpportunity({ id: 'a', title: 'A' });
  const fails = normalizeGrantsGovOpportunity({ id: 'b', title: 'B' });
  const firstSeen = new Date('2026-09-01T00:00:00.000Z');
  const lastSeen = new Date('2026-09-30T00:00:00.000Z');

  const first = await persistGrantsGov([valid, fails], store, firstSeen);
  const second = await persistGrantsGov([valid], store, lastSeen);

  assert.deepEqual(first, { inserted: 1, updated: 0, failed: 1 });
  assert.deepEqual(second, { inserted: 0, updated: 1, failed: 0 });
  assert.equal(rows.size, 2);
  assert.equal(rows.get('a')?.firstSeenAt, firstSeen);
  assert.equal(rows.get('a')?.verifiedAt, lastSeen);
});

test('persistGrantsGov expires overdue rows even when extraction returns no records', async () => {
  let expirationCalls = 0;
  const store: OpportunityPersistence = {
    async upsert() { throw new Error('upsert should not run'); },
    async attachGrantCategory() {},
    async expireOverdue() {
      expirationCalls += 1;
      return 3;
    },
  };

  const result = await persistGrantsGov([], store);

  assert.equal(expirationCalls, 1);
  assert.deepEqual(result, { inserted: 0, updated: 3, failed: 0 });
});