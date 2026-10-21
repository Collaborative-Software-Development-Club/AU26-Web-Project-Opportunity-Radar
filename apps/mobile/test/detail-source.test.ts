import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApiClient, ApiError } from '@radar/api-client';
import { canApply, compensationLabel, createApiDetailSource, isHttpUrl } from '../src/features/opportunities/detail/detail-source';
import { createPreviewSource, designPreviewRecords, discoveryPreviewSource } from '../src/features/opportunities/detail/preview-source';

test('live detail uses the API ID and signal, and never falls back to preview data', async () => {
  const original = globalThis.fetch;
  const signal = new AbortController().signal;
  const calls: string[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    assert.equal(init?.signal, signal);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer session');
    return new Response('{"error":"not found"}', { status: 404 });
  };
  try {
    const source = createApiDetailSource(createApiClient({ baseUrl: 'https://api.test/', getToken: async () => 'session' }));
    await assert.rejects(source.get('missing/id', signal), (error: unknown) => error instanceof ApiError && error.status === 404);
    assert.deepEqual(calls, ['https://api.test/api/opportunities/missing%2Fid']);
  } finally { globalThis.fetch = original; }
});

test('related queries use supported API filters and exclude the selected opportunity', async () => {
  const original = globalThis.fetch;
  const record = designPreviewRecords[0];
  const signal = new AbortController().signal;
  const queries: URL[] = [];
  globalThis.fetch = async (url, init) => {
    queries.push(new URL(String(url)));
    assert.equal(init?.signal, signal);
    return Response.json({ data: [record.opportunity, designPreviewRecords[1].opportunity], pagination: { total: 2, limit: 20, offset: 0 } });
  };
  try {
    const source = createApiDetailSource(createApiClient({ baseUrl: 'https://api.test', getToken: async () => null }));
    const related = await source.related(record, 'organization', signal);
    assert.deepEqual(related.map(item => item.opportunity.id), ['preview:workshop']);
    assert.equal(queries[0].searchParams.get('organizationId'), record.opportunity.organizationId);
    await source.related(record, 'similar', signal);
    assert.equal(queries[1].searchParams.get('category'), 'event');
    assert.equal(queries[1].searchParams.get('status'), 'active');
    assert.equal(queries[1].searchParams.get('limit'), '20');
  } finally { globalThis.fetch = original; }
});

test('mock numeric identities are namespaced and never issue network requests', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Preview must not fetch'); };
  try {
    const record = await discoveryPreviewSource.get('preview:event:6', new AbortController().signal);
    assert.equal(record.opportunity.title, 'Design for Good Hackathon');
    assert.equal(record.opportunity.applicationUrl, '');
    assert.equal(record.opportunity.compensation, null, 'An unpaid flag on a mock event does not mean free admission');
    assert.equal(record.opportunity.applicationDeadline, null, 'A display date is not fabricated into an API timestamp');
    await assert.rejects(discoveryPreviewSource.get('6', new AbortController().signal));
    const source = createPreviewSource(designPreviewRecords);
    assert.equal((await source.related(designPreviewRecords[0], 'organization', new AbortController().signal)).length, 1);
  } finally { globalThis.fetch = original; }
});

test('application availability respects both status and deadline, and rejects unsafe schemes', () => {
  const item = { ...designPreviewRecords[0].opportunity, applicationUrl: 'https://example.test/apply' };
  const now = Date.parse('2026-10-21T00:00:00Z');
  assert.equal(canApply(item, now), true);
  assert.equal(canApply({ ...item, status: 'closed' }, now), false);
  assert.equal(canApply({ ...item, applicationDeadline: '2026-10-20T00:00:00Z' }, now), false);
  assert.equal(canApply({ ...item, applicationDeadline: 'invalid' }, now), false);
  assert.equal(canApply({ ...item, applicationUrl: 'javascript:alert(1)' }, now), false);
  assert.equal(isHttpUrl('file:///private/data'), false);
});

test('compensation supports currencies, maximum-only amounts, zero and source text', () => {
  const base = { compensationType: 'pay' as const, isPaid: true, minAmount: '0', maxAmount: '20', currency: 'EUR', period: 'hour' as const, rawText: null };
  assert.equal(compensationLabel(base), '€0.00–€20.00 / hour');
  assert.equal(compensationLabel({ ...base, minAmount: null }), 'Up to €20.00 / hour');
  assert.equal(compensationLabel({ ...base, rawText: 'Travel expenses covered' }), 'Travel expenses covered');
  assert.equal(compensationLabel({ ...base, isPaid: false }), 'Unpaid');
  assert.equal(compensationLabel(null), null);
});
