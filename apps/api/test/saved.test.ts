import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, beforeEach, test } from 'node:test';
import express, { type RequestHandler } from 'express';
import { errorHandler } from '../src/middleware/error-handler';
import type { SavedOpportunityView, SavedRepository } from '../src/modules/saved/saved.types';

process.env.CLERK_PUBLISHABLE_KEY ||= `pk_test_${Buffer.from('saved-test.clerk.accounts.dev$').toString('base64')}`;
process.env.CLERK_SECRET_KEY ||= 'sk_test_local_fixture_only';
const { createSavedRouter } = await import('../src/modules/saved/saved.routes');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OPPORTUNITY_ID = '33333333-3333-4333-8333-333333333333';
const MISSING_ID = '99999999-9999-4999-8999-999999999999';

// Keyed "userId:opportunityId" like the composite primary key.
let store: Map<string, SavedOpportunityView>;
beforeEach(() => { store = new Map(); });

const view = (opportunityId: string) => ({ opportunity: { id: opportunityId }, savedAt: '2026-10-21T00:00:00.000Z' }) as SavedOpportunityView;

const repository: SavedRepository = {
  async findUserId(clerkUserId) {
    return clerkUserId === 'user_known' ? USER_ID : null;
  },
  async list(userId, { limit, offset }) {
    const items = [...store].filter(([key]) => key.startsWith(userId)).map(([, value]) => value);
    return { items: items.slice(offset, offset + limit), total: items.length };
  },
  async listIds(userId) {
    return [...store.keys()].filter(key => key.startsWith(userId)).map(key => key.split(':')[1]!);
  },
  async save(userId, opportunityId) {
    if (opportunityId === MISSING_ID) throw Object.assign(new Error('fk'), { code: '23503' });
    const key = `${userId}:${opportunityId}`;
    if (!store.has(key)) store.set(key, view(opportunityId));
  },
  async remove(userId, opportunityId) {
    store.delete(`${userId}:${opportunityId}`);
  },
};

// The bearer token stands in for the Clerk user ID.
const authenticate: RequestHandler = (req, res, next) => {
  if (req.headers.authorization) return next();
  res.status(401).json({ error: 'Unauthorized' });
};
const clerkUserIdOf = (req: express.Request) => req.headers.authorization!.slice('Bearer '.length);

const app = express();
app.use('/api/saved', createSavedRouter({ resolveRepository: async () => repository, authenticate, clerkUserIdOf }));
app.use(errorHandler);

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api/saved`;

const send = (method: string, path = '', user: string | null = 'user_known') => fetch(`${base}${path}`, {
  method,
  headers: user ? { Authorization: `Bearer ${user}` } : {},
});

test('requires a session', async () => {
  assert.equal((await send('GET', '', null)).status, 401);
  assert.equal((await send('POST', `/${OPPORTUNITY_ID}`, null)).status, 401);
});

test('save, list, and remove round-trip and are idempotent', async () => {
  assert.equal((await send('POST', `/${OPPORTUNITY_ID}`)).status, 204);
  assert.equal((await send('POST', `/${OPPORTUNITY_ID}`)).status, 204);

  const listed = await send('GET');
  assert.equal(listed.status, 200);
  assert.equal(listed.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await listed.json(), {
    data: [view(OPPORTUNITY_ID)],
    pagination: { total: 1, limit: 20, offset: 0 },
  });

  const ids = await send('GET', '/ids');
  assert.equal(ids.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await ids.json(), { data: [OPPORTUNITY_ID] });

  assert.equal((await send('DELETE', `/${OPPORTUNITY_ID}`)).status, 204);
  assert.equal((await send('DELETE', `/${OPPORTUNITY_ID}`)).status, 204);
  assert.deepEqual(await (await send('GET', '/ids')).json(), { data: [] });
  assert.equal(((await (await send('GET')).json()) as { data: unknown[] }).data.length, 0);
});

test('saving a missing opportunity is 404', async () => {
  const response = await send('POST', `/${MISSING_ID}`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Opportunity not found.' });
});

test('a signed-in user without a database row is 404', async () => {
  const response = await send('GET', '', 'user_unknown');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'User not found.' });
});

test('rejects a bad opportunity ID and bad pagination', async () => {
  assert.equal((await send('POST', '/not-a-uuid')).status, 400);
  assert.equal((await send('GET', '?limit=0')).status, 400);
  assert.equal((await send('GET', '?sort=savedAt')).status, 400);
});
