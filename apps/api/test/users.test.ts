import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, beforeEach, test } from 'node:test';
import express, { type RequestHandler } from 'express';
import type { UserProfileView } from '@radar/contracts';
import { MAX_RELATION_IDS, RELATION_KEYS } from '../src/lib/relation-ids';
import { errorHandler } from '../src/middleware/error-handler';
import type { UsersRepository } from '../src/modules/users/users.types';
import { toUserProfileView, type UserProfileRow } from '../src/modules/users/users.view';

process.env.CLERK_PUBLISHABLE_KEY ||= `pk_test_${Buffer.from('users-test.clerk.accounts.dev$').toString('base64')}`;
process.env.CLERK_SECRET_KEY ||= 'sk_test_local_fixture_only';
const { createUsersRouter } = await import('../src/modules/users/users.routes');

const NOW = new Date('2026-10-21T12:00:00.000Z');
const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '22222222-2222-4222-8222-222222222222';
const MISSING_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const LOCATION = {
  id: 'abcdefab-cdef-4abc-8def-abcdefabcdef', city: 'Columbus', stateRegion: 'Ohio',
  country: 'United States', countryCode: 'US', latitude: '39.961176', longitude: '-82.998794',
};
const OTHER_LOCATION = { ...LOCATION, id: OTHER_ID, city: 'Berlin', stateRegion: null, country: 'Germany' };
const LEVELS = [{ id: 1, name: 'Undergraduate', sortOrder: 2 }, { id: 2, name: 'High School', sortOrder: 1 }];
const FIELDS = [{ id: 1, name: 'Computer Science', slug: 'computer-science' }, { id: 2, name: 'Business', slug: 'business' }];
const CATEGORIES = [{ id: 1, name: 'Internship', slug: 'internship' }, { id: 3, name: 'Scholarship', slug: 'scholarship' }];
const LOCATIONS = [LOCATION, OTHER_LOCATION];

function newUser(id = USER_ID, clerkUserId = 'user_known'): UserProfileRow {
  return {
    id, clerkUserId, email: `${clerkUserId}@example.invalid`, firstName: 'Ada', lastName: 'Lovelace',
    createdAt: NOW, updatedAt: NOW, locations: [], educationLevels: [], fields: [], categories: [],
  };
}

const rows = new Map<string, UserProfileRow>();
let writes = 0;
beforeEach(() => {
  rows.clear();
  rows.set('user_known', newUser());
  rows.set('user_other', newUser(OTHER_ID, 'user_other'));
  writes = 0;
});

function populate(): UserProfileView {
  const row = rows.get('user_known')!;
  row.locations = LOCATIONS.map(location => ({ location }));
  row.educationLevels = LEVELS.map(educationLevel => ({ educationLevel }));
  row.fields = FIELDS.map(field => ({ field }));
  row.categories = CATEGORIES.map(category => ({ category }));
  return toUserProfileView(row);
}

const unknown = <T extends string | number>(ids: T[] | undefined, known: { id: T }[]) =>
  (ids ?? []).filter(id => !known.some(row => row.id === id));

const repository: UsersRepository = {
  async getUserByClerkId(clerkUserId) {
    const row = rows.get(clerkUserId);
    return row ? toUserProfileView(row) : undefined;
  },
  async findMissingReferences(relations) {
    return {
      locationIds: unknown(relations.locationIds, LOCATIONS),
      educationLevelIds: unknown(relations.educationLevelIds, LEVELS),
      fieldIds: unknown(relations.fieldIds, FIELDS),
      categoryIds: unknown(relations.categoryIds, CATEGORIES),
    };
  },
  async updateUser(clerkUserId, changes) {
    const row = rows.get(clerkUserId);
    if (!row) return undefined;
    writes++;
    if (changes.firstName !== undefined) row.firstName = changes.firstName;
    if (changes.lastName !== undefined) row.lastName = changes.lastName;
    if (changes.locationIds !== undefined) row.locations = LOCATIONS
      .filter(location => changes.locationIds!.includes(location.id)).map(location => ({ location }));
    if (changes.educationLevelIds !== undefined) row.educationLevels = LEVELS
      .filter(educationLevel => changes.educationLevelIds!.includes(educationLevel.id)).map(educationLevel => ({ educationLevel }));
    if (changes.fieldIds !== undefined) row.fields = FIELDS
      .filter(field => changes.fieldIds!.includes(field.id)).map(field => ({ field }));
    if (changes.categoryIds !== undefined) row.categories = CATEGORIES
      .filter(category => changes.categoryIds!.includes(category.id)).map(category => ({ category }));
    return toUserProfileView(row);
  },
  async deleteUser(clerkUserId) {
    const row = rows.get(clerkUserId);
    rows.delete(clerkUserId);
    return row;
  },
};

const authenticate: RequestHandler = (req, res, next) => {
  if (req.headers.authorization?.startsWith('Bearer user_')) return next();
  res.status(401).json({ error: 'Unauthorized' });
};
const app = express();
app.use('/api/users', createUsersRouter({
  resolveRepository: async () => repository,
  authenticate,
  clerkUserIdOf: req => req.headers.authorization!.slice('Bearer '.length),
}));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api/users/me`;

const send = (method: string, body?: unknown, user: string | null = 'user_known', path = '') => fetch(`${base}${path}`, {
  method,
  headers: {
    ...(user ? { Authorization: `Bearer ${user}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
  },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const profile = async (user = 'user_known') => (await (await send('GET', undefined, user)).json()) as UserProfileView;

test('GET returns the public profile with four empty preference lists for a new user', async () => {
  const response = await send('GET');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    id: USER_ID, email: 'user_known@example.invalid', firstName: 'Ada', lastName: 'Lovelace',
    createdAt: NOW.toISOString(), preferences: { locations: [], educationLevels: [], fields: [], categories: [] },
  });
});

test('GET maps all populated preferences to lookup views in a stable order', async () => {
  populate();
  assert.deepEqual((await profile()).preferences, {
    locations: [OTHER_LOCATION, LOCATION], educationLevels: [LEVELS[1], LEVELS[0]],
    fields: [FIELDS[1], FIELDS[0]], categories: CATEGORIES,
  });
});

test('name-only updates preserve preferences and return the public profile', async () => {
  const before = populate();
  const response = await send('PATCH', { firstName: '  Grace  ', lastName: 'Hopper' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { ...before, firstName: 'Grace', lastName: 'Hopper' });
  assert.deepEqual(await profile(), { ...before, firstName: 'Grace', lastName: 'Hopper' });
  assert.equal((await send('PATCH', { firstName: '' })).status, 200);
  assert.equal((await profile()).firstName, '');
  assert.equal((await profile()).lastName, 'Hopper');
});

test('PATCH replaces only the named preferences and preserves names and omitted sets', async () => {
  const before = populate();
  const response = await send('PATCH', { categoryIds: [1, 3], locationIds: [LOCATION.id] });
  assert.equal(response.status, 200);
  const expected = { ...before, preferences: { ...before.preferences, locations: [LOCATION] } };
  assert.deepEqual(await response.json(), expected);
  assert.deepEqual(await profile(), expected);

  const replaced = await send('PATCH', { firstName: 'Grace', educationLevelIds: [2], fieldIds: [2], categoryIds: [3] });
  assert.equal(replaced.status, 200);
  assert.deepEqual(await replaced.json(), {
    ...expected, firstName: 'Grace',
    preferences: { locations: [LOCATION], educationLevels: [LEVELS[1]], fields: [FIELDS[1]], categories: [CATEGORIES[1]] },
  });
});

for (const [key, preference] of [
  ['locationIds', 'locations'], ['educationLevelIds', 'educationLevels'],
  ['fieldIds', 'fields'], ['categoryIds', 'categories'],
] as const) {
  test(`an empty ${key} clears only ${preference}`, async () => {
    const before = populate();
    const response = await send('PATCH', { [key]: [] });
    assert.equal(response.status, 200);
    const expected = { ...before, preferences: { ...before.preferences, [preference]: [] } };
    assert.deepEqual(await response.json(), expected);
    assert.deepEqual(await profile(), expected);
  });
}

test('all unknown lookup IDs are reported by field and neither names nor preferences are written', async () => {
  const before = populate();
  const response = await send('PATCH', {
    firstName: 'Do not save', locationIds: [LOCATION.id, MISSING_ID], educationLevelIds: [99, 100],
    fieldIds: [1, 101], categoryIds: [102],
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'Referenced records do not exist.',
    details: [
      { field: 'locationIds', message: `references unknown location IDs: ${MISSING_ID}` },
      { field: 'educationLevelIds', message: 'references unknown education level IDs: 99, 100' },
      { field: 'fieldIds', message: 'references unknown field IDs: 101' },
      { field: 'categoryIds', message: 'references unknown category IDs: 102' },
    ],
  });
  assert.equal(writes, 0);
  assert.deepEqual(await profile(), before);
});

for (const [body, field] of [
  [{ email: 'other@example.invalid' }, 'email'], [{ clerkUserId: 'user_other' }, 'clerkUserId'],
  [{ id: OTHER_ID }, 'id'], [{ userId: OTHER_ID }, 'userId'],
  [{ preferences: {} }, 'preferences'], [{ firstName: null }, 'firstName'],
  [{ firstName: 1 }, 'firstName'], [{ lastName: 'x'.repeat(101) }, 'lastName'],
  [{ locationIds: ['not-a-uuid'] }, 'locationIds'], [{ categoryIds: [0] }, 'categoryIds'],
  [{ categoryIds: [32_768] }, 'categoryIds'], [{ fieldIds: [1.5] }, 'fieldIds'],
  [{ educationLevelIds: [true] }, 'educationLevelIds'],
] as const) {
  test(`PATCH rejects invalid ${field}: ${JSON.stringify(body)}`, async () => {
    const before = populate();
    const response = await send('PATCH', { firstName: 'Do not save', ...body });
    assert.equal(response.status, 400);
    const failure = await response.json() as { details: { field: string }[] };
    assert.ok(failure.details.some(entry => entry.field === field));
    assert.equal(writes, 0);
    assert.deepEqual(await profile(), before);
  });
}

for (const key of RELATION_KEYS) {
  const validId = key === 'locationIds' ? LOCATION.id : 1;
  for (const [label, value] of [
    ['duplicates', [validId, validId]], ['too many IDs', Array(MAX_RELATION_IDS + 1).fill(validId)],
    ['non-array', validId], ['null', null], ['invalid item', [{}]],
  ] as const) {
    test(`PATCH rejects ${label} in ${key}`, async () => {
      const response = await send('PATCH', { [key]: value });
      assert.equal(response.status, 400);
      const failure = await response.json() as { details: { field: string }[] };
      assert.ok(failure.details.some(entry => entry.field === key));
      assert.equal(writes, 0);
    });
  }
}

test('UUID casing and numeric strings cannot disguise duplicate IDs', async () => {
  for (const body of [
    { locationIds: [LOCATION.id, LOCATION.id.toUpperCase()] }, { fieldIds: [1, '1'] },
  ]) assert.equal((await send('PATCH', body)).status, 400);
  assert.equal((await send('PATCH', { locationIds: [LOCATION.id.toUpperCase()] })).status, 200);
  assert.deepEqual((await profile()).preferences.locations, [LOCATION]);
});

test('PATCH rejects an empty body, non-object JSON, and malformed JSON', async () => {
  for (const body of [{}, [], null, undefined, 'name']) assert.equal((await send('PATCH', body)).status, 400);
  const malformed = await fetch(base, {
    method: 'PATCH', headers: { Authorization: 'Bearer user_known', 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);
  assert.equal(writes, 0);
});

test('all routes require a session before parsing or accessing the repository', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const response = await send(method, method === 'PATCH' ? { fieldIds: [1] } : undefined, null);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
  }
  assert.equal(writes, 0);
  assert.equal(rows.size, 2);
});

test('the session controls which profile can be read, changed, or deleted', async () => {
  const other = await profile('user_other');
  const response = await send('PATCH', { firstName: 'Grace', categoryIds: [1] }, 'user_known', '?userId=user_other');
  assert.equal(response.status, 200);
  assert.equal((await profile()).firstName, 'Grace');
  assert.deepEqual(await profile('user_other'), other);
  assert.equal((await send('GET', undefined, 'user_known', '/user_other')).status, 404);
  assert.equal((await send('DELETE', undefined, 'user_known', '?clerkUserId=user_other')).status, 204);
  assert.equal((await send('GET')).status, 404);
  assert.deepEqual(await profile('user_other'), other);
});

test('a signed-in user without a local row gets 404 on every route', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const response = await send(method, method === 'PATCH' ? { firstName: 'Grace' } : undefined, 'user_unknown');
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'User not found.' });
  }
  assert.equal(writes, 0);
});

test('a lookup deleted during a write returns a retryable conflict', async t => {
  const before = populate();
  t.mock.method(repository, 'updateUser', async () => { throw Object.assign(new Error('fk'), { code: '23503' }); });
  const response = await send('PATCH', { fieldIds: [1] });
  assert.equal(response.status, 409);
  assert.deepEqual(await profile(), before);
});
