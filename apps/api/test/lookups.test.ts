import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, test } from 'node:test';
import express from 'express';
import { errorHandler } from '../src/middleware/error-handler';
import { createLookupsRouter } from '../src/modules/lookups/lookups.routes';
import type { LookupsRepository } from '../src/modules/lookups/lookups.types';

const fixtures = {
  categories: [{ id: 2, name: 'Fellowship', slug: 'fellowship' }, { id: 1, name: 'Internship', slug: 'internship' }],
  fields: [{ id: 1, name: 'Computer Science', slug: 'computer-science' }],
  educationLevels: [{ id: 3, name: 'Undergraduate', sortOrder: 1 }, { id: 4, name: 'Graduate', sortOrder: 2 }],
  locations: [{
    id: '5b0f2a8e-3c1d-4e6f-9a7b-1c2d3e4f5a6b', city: 'Austin', stateRegion: 'Texas',
    country: 'United States', countryCode: 'US',
  }],
};

let failing = false;
const repository: LookupsRepository = {
  listAll: async () => failing ? Promise.reject(new Error('database down')) : fixtures,
};

const app = express();
app.use('/api/lookups', createLookupsRouter({ resolveRepository: async () => repository }));
app.use(errorHandler);

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const url = `http://127.0.0.1:${address.port}/api/lookups`;

test('GET /api/lookups returns every lookup list and is cacheable', async () => {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
  assert.deepEqual(await response.json(), { data: fixtures });
});

test('GET /api/lookups rejects unknown query parameters', async () => {
  const response = await fetch(`${url}?limit=5`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Query parameters are invalid.',
    details: [{ field: 'limit', message: 'is not a recognized field' }],
  });
});

test('repository failures surface as a JSON 500', async t => {
  failing = true;
  t.after(() => { failing = false; });
  t.mock.method(console, 'error', () => {});
  const response = await fetch(url);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Internal server error' });
});
