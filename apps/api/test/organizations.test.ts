import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, beforeEach, test } from 'node:test';
import express, { type RequestHandler } from 'express';
import { errorHandler } from '../src/middleware/error-handler';
import type {
  ListOrganizationsQuery, OrganizationDetail, OrganizationsRepository, OrganizationView,
} from '../src/modules/organizations/organizations.types';

process.env.CLERK_PUBLISHABLE_KEY ||= `pk_test_${Buffer.from('organizations-test.clerk.accounts.dev$').toString('base64')}`;
process.env.CLERK_SECRET_KEY ||= 'sk_test_local_fixture_only';
const { createOrganizationsRouter } = await import('../src/modules/organizations/organizations.routes');

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const MISSING_ID = '99999999-9999-4999-8999-999999999999';
const NOW = '2026-09-30T00:00:00.000Z';

const organization = (id: string, name: string, slug: string): OrganizationView =>
  ({ id, name, slug, websiteUrl: null, logoUrl: null, createdAt: NOW, updatedAt: NOW });

const opportunity: OrganizationDetail['opportunities'][number] = {
  id: '33333333-3333-4333-8333-333333333333', organizationId: ORG_ID,
  organization: { id: ORG_ID, name: 'Campus Lab', slug: 'campus-lab', websiteUrl: null, logoUrl: null }, title: 'Research Fellowship',
  slug: 'research-fellowship', summary: null, description: null, applicationUrl: 'https://example.com/apply',
  sourceUrl: 'https://example.com', applicationDeadline: null, workMode: 'remote', workAuthorization: null,
  externalId: null, sourceType: 'manual', sourceName: null, postedAt: NOW, firstSeenAt: NOW, lastVerifiedAt: null,
  status: 'active', createdAt: NOW, updatedAt: NOW, compensation: null,
  categories: [{ id: 5, name: 'Fellowship', slug: 'fellowship' }],
  fields: [{ id: 1, name: 'Computer Science', slug: 'computer-science' }],
  educationLevels: [{ id: 3, name: 'Graduate', sortOrder: 3 }],
  locations: [{ id: '44444444-4444-4444-8444-444444444444', city: 'Columbus', stateRegion: 'Ohio', country: 'United States', countryCode: 'US', latitude: null, longitude: null }],
};

const postgresError = (code: string) => Object.assign(new Error(`postgres ${code}`), { code });

let store: Map<string, OrganizationView>;
let lastListQuery: ListOrganizationsQuery | undefined;
let raceOnCreate = false;

beforeEach(() => {
  store = new Map([
    [ORG_ID, organization(ORG_ID, 'Campus Lab', 'campus-lab')],
    [OTHER_ID, organization(OTHER_ID, 'Community Foundation', 'community-foundation')],
  ]);
  lastListQuery = undefined;
  raceOnCreate = false;
});

// ORG_ID owns an opportunity, so deleting it trips the foreign key the way Postgres would.
const repository: OrganizationsRepository = {
  async list(query) {
    lastListQuery = query;
    const items = [...store.values()];
    return { items: items.slice(query.offset, query.offset + query.limit), total: items.length };
  },
  async findById(id) {
    const found = store.get(id);
    return found ? { ...found, opportunities: id === ORG_ID ? [opportunity] : [] } : null;
  },
  async findBySlug(slug) {
    return [...store.values()].find(item => item.slug === slug) ?? null;
  },
  async create(input) {
    if (raceOnCreate) throw postgresError('23505');
    const created = { ...organization('55555555-5555-4555-8555-555555555555', input.name, input.slug), ...input };
    store.set(created.id, created);
    return created;
  },
  async update(id, input) {
    const found = store.get(id);
    if (!found) return null;
    const updated = { ...found, ...input };
    store.set(id, updated);
    return updated;
  },
  async remove(id) {
    if (id === ORG_ID) throw postgresError('23503');
    return store.delete(id);
  },
};

const authenticate: RequestHandler = (req, res, next) => {
  if (req.headers.authorization === 'Bearer ok') return next();
  res.status(401).json({ error: 'Unauthorized' });
};

const app = express();
app.use('/api/organizations', createOrganizationsRouter({ resolveRepository: async () => repository, authenticate }));
app.use(errorHandler);

const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api/organizations`;

const send = (method: string, path: string, body?: unknown, token: string | null = 'ok') => fetch(`${base}${path}`, {
  method,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});

test('GET / lists organizations with pagination', async () => {
  const response = await fetch(`${base}?limit=1&offset=1&q=Foundation`);
  assert.equal(response.status, 200);
  assert.deepEqual(lastListQuery, { limit: 1, offset: 1, q: 'Foundation' });
  assert.deepEqual(await response.json(), {
    data: [store.get(OTHER_ID)],
    pagination: { total: 2, limit: 1, offset: 1 },
  });
});

test('GET / applies default pagination', async () => {
  await fetch(base);
  assert.deepEqual(lastListQuery, { limit: 20, offset: 0 });
});

test('GET / rejects invalid and unknown query parameters', async () => {
  const response = await fetch(`${base}?limit=0&sort=name`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Query parameters are invalid.',
    details: [
      { field: 'sort', message: 'is not a recognized field' },
      { field: 'limit', message: 'must be between 1 and 100' },
    ],
  });
});

test('GET /:id returns the organization with every opportunity and its lookups', async () => {
  const response = await fetch(`${base}/${ORG_ID}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ...store.get(ORG_ID), opportunities: [opportunity] });
});

test('GET /:id returns 404 for an unknown organization', async () => {
  const response = await fetch(`${base}/${MISSING_ID}`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Organization not found.' });
});

test('GET /:id rejects a malformed ID', async () => {
  const response = await fetch(`${base}/not-a-uuid`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Organization ID is invalid.',
    details: [{ field: 'id', message: 'must be a UUID' }],
  });
});

test('POST / creates an organization', async () => {
  const response = await send('POST', '', { name: ' New Org ', slug: 'new-org', websiteUrl: 'https://new.example' });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(response.headers.get('location'), `/api/organizations/${body.id}`);
  assert.equal(body.name, 'New Org');
  assert.equal(body.websiteUrl, 'https://new.example');
});

test('POST / requires a session', async () => {
  const response = await send('POST', '', { name: 'New Org', slug: 'new-org' }, null);
  assert.equal(response.status, 401);
});

test('POST / reports every invalid field', async () => {
  const response = await send('POST', '', { slug: 'Bad Slug', logoUrl: 'ftp://x', extra: true });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Organization payload is invalid.',
    details: [
      { field: 'extra', message: 'is not a recognized field' },
      { field: 'name', message: 'is required' },
      { field: 'slug', message: 'must be lowercase letters and digits separated by single hyphens' },
      { field: 'logoUrl', message: 'must use http or https' },
    ],
  });
});

test('POST / rejects a taken slug', async () => {
  const response = await send('POST', '', { name: 'Copy', slug: 'campus-lab' });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'An organization with slug "campus-lab" already exists.' });
});

test('POST / maps a unique violation that wins the race to 409', async () => {
  raceOnCreate = true;
  const response = await send('POST', '', { name: 'Race', slug: 'race' });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'An organization with this slug already exists.' });
});

test('PATCH /:id updates the given fields', async () => {
  const response = await send('PATCH', `/${OTHER_ID}`, { name: 'Renamed', logoUrl: 'https://logo.example/a.png' });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ...organization(OTHER_ID, 'Renamed', 'community-foundation'), logoUrl: 'https://logo.example/a.png',
  });
});

test('PATCH /:id may keep its own slug', async () => {
  const response = await send('PATCH', `/${ORG_ID}`, { slug: 'campus-lab' });
  assert.equal(response.status, 200);
});

test('PATCH /:id rejects an empty body', async () => {
  const response = await send('PATCH', `/${ORG_ID}`, {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Provide at least one field to update.' });
});

test('PATCH /:id rejects a slug owned by another organization', async () => {
  const response = await send('PATCH', `/${OTHER_ID}`, { slug: 'campus-lab' });
  assert.equal(response.status, 409);
});

test('PATCH /:id returns 404 for an unknown organization', async () => {
  const response = await send('PATCH', `/${MISSING_ID}`, { name: 'Ghost' });
  assert.equal(response.status, 404);
});

test('PATCH /:id requires a session', async () => {
  const response = await send('PATCH', `/${ORG_ID}`, { name: 'Nope' }, null);
  assert.equal(response.status, 401);
});

test('DELETE /:id removes an organization without opportunities', async () => {
  const response = await send('DELETE', `/${OTHER_ID}`);
  assert.equal(response.status, 204);
  assert.equal(store.has(OTHER_ID), false);
});

test('DELETE /:id refuses while the organization still has opportunities', async () => {
  const response = await send('DELETE', `/${ORG_ID}`);
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'Organization still has opportunities; delete or reassign them first.' });
});

test('DELETE /:id returns 404 for an unknown organization', async () => {
  const response = await send('DELETE', `/${MISSING_ID}`);
  assert.equal(response.status, 404);
});

test('DELETE /:id requires a session', async () => {
  const response = await send('DELETE', `/${OTHER_ID}`, undefined, null);
  assert.equal(response.status, 401);
  assert.equal(store.has(OTHER_ID), true);
});
