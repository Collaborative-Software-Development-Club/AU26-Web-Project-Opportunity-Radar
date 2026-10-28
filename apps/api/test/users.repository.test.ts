import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { neonConfig } from '@neondatabase/serverless';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { userLocations, userEducationLevels, userFields, userCategories, users } from '@radar/database/schema';

// Exercise the real Drizzle/Neon query generation without a database or network access.
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/users_test';
const repository = await import('../src/modules/users/users.repository');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const LOCATION_ID = 'abcdefab-cdef-4abc-8def-abcdefabcdef';
const CREATED_AT = '2026-10-21T12:00:00.000Z';
type Query = { query: string; params: unknown[] };
type Request = Query | { queries: Query[] };
const requests: Request[] = [];
const replies: { status?: number; body: unknown }[] = [];
const result = (rows: unknown[][], names = ['id']) => ({
  fields: names.map((name, index) => ({ name, dataTypeID: typeof rows[0]?.[index] === 'number' ? 23 : 25 })), rows,
  rowCount: rows.length, command: 'SELECT',
});
const userResult = () => result([
  [USER_ID, 'user_known', 'ada@example.invalid', 'Grace', 'Lovelace', CREATED_AT, CREATED_AT,
    JSON.stringify([[USER_ID, LOCATION_ID, [LOCATION_ID, 'Columbus', 'Ohio', 'United States', 'US', null, null]]]),
    '[]', '[]', JSON.stringify([
      [USER_ID, 1, [1, 'Internship', 'internship']], [USER_ID, 3, [3, 'Scholarship', 'scholarship']],
    ])],
], ['id', 'clerk_user_id', 'email', 'first_name', 'last_name', 'created_at', 'updated_at',
  'locations', 'educationLevels', 'fields', 'categories']);

const previousFetch = neonConfig.fetchFunction;
afterEach(() => { neonConfig.fetchFunction = previousFetch; });
beforeEach(() => {
  requests.length = 0;
  replies.length = 0;
  neonConfig.fetchFunction = async (_url: RequestInfo | URL, init?: RequestInit) => {
    requests.push(JSON.parse(init!.body as string) as Request);
    const reply = replies.shift();
    assert.ok(reply, 'Unexpected database request');
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200 });
  };
});

test('profile reads filter by Clerk identity and load all four join relations', async () => {
  replies.push({ body: userResult() });
  const profile = await repository.getUserByClerkId('user_known');
  assert.equal(profile?.id, USER_ID);
  assert.equal(profile?.createdAt, CREATED_AT);
  assert.equal(profile?.preferences.locations[0].id, LOCATION_ID);
  assert.deepEqual(profile?.preferences.categories.map(row => row.id), [1, 3]);
  assert.deepEqual(profile?.preferences.educationLevels, []);
  assert.deepEqual(profile?.preferences.fields, []);
  assert.ok(!Object.hasOwn(profile!, 'clerkUserId'));
  assert.ok(!Object.hasOwn(profile!, 'updatedAt'));
  const query = requests[0];
  assert.ok('query' in query);
  const identity = query.query.match(/where "users"\."clerk_user_id" = \$(\d+)/);
  assert.ok(identity);
  assert.equal(query.params[Number(identity[1]) - 1], 'user_known');
  for (const name of ['user_locations', 'user_education_levels', 'user_fields', 'user_categories']) {
    assert.ok(query.query.includes(`"${name}"`), name);
  }
});

test('name and named preference replacements are sent as one transaction scoped to the internal user ID', async () => {
  replies.push(
    { body: result([[USER_ID]]) },
    { body: { results: [result([[USER_ID]]), result([]), result([]), result([]), result([])] } },
    { body: userResult() },
  );
  const profile = await repository.updateUser('user_known', {
    firstName: 'Grace', categoryIds: [1, 3], locationIds: [LOCATION_ID],
  });
  assert.equal(profile?.firstName, 'Grace');
  assert.equal(requests.length, 3);
  const resolveId = requests[0];
  assert.ok('query' in resolveId);
  assert.match(resolveId.query, /"users"\."clerk_user_id" = \$1/);
  assert.deepEqual(resolveId.params, ['user_known', '1']);
  const batch = requests[1];
  assert.ok('queries' in batch);
  const [name, deleteLocations, deleteCategories, insertLocations, insertCategories] = batch.queries;
  assert.equal(batch.queries.length, 5);
  assert.match(name.query, /^update "users" set "first_name" = \$1, "updated_at" = \$2 where "users"\."id" = \$3/);
  assert.equal(name.params[0], 'Grace');
  assert.equal(name.params[2], USER_ID);
  assert.match(deleteLocations.query, /^delete from "user_locations" where "user_locations"\."user_id" = \$1/);
  assert.match(deleteCategories.query, /^delete from "user_categories" where "user_categories"\."user_id" = \$1/);
  assert.deepEqual(deleteLocations.params, [USER_ID]);
  assert.deepEqual(deleteCategories.params, [USER_ID]);
  assert.match(insertLocations.query, /^insert into "user_locations" \("user_id", "location_id"\)/);
  assert.deepEqual(insertLocations.params, [USER_ID, LOCATION_ID]);
  assert.match(insertCategories.query, /^insert into "user_categories" \("user_id", "category_id"\)/);
  assert.deepEqual(insertCategories.params, [USER_ID, '1', USER_ID, '3']);
});

test('clearing fields emits only the timestamp update and the caller-scoped field deletion', async () => {
  replies.push(
    { body: result([[USER_ID]]) },
    { body: { results: [result([[USER_ID]]), result([])] } },
    { body: userResult() },
  );
  await repository.updateUser('user_known', { fieldIds: [] });
  const batch = requests[1];
  assert.ok('queries' in batch);
  assert.equal(batch.queries.length, 2);
  assert.match(batch.queries[0].query, /^update "users" set "updated_at"/);
  assert.match(batch.queries[1].query, /^delete from "user_fields" where "user_fields"\."user_id" = \$1/);
  assert.deepEqual(batch.queries[1].params, [USER_ID]);
});

test('a failed transaction propagates the database error without a readback or separate writes', async () => {
  replies.push(
    { body: result([[USER_ID]]) },
    { status: 400, body: { message: 'fixture foreign key violation', code: '23503' } },
  );
  await assert.rejects(repository.updateUser('user_known', { firstName: 'Grace', fieldIds: [1] }),
    (error: unknown) => error instanceof Error && 'code' in error && error.code === '23503');
  assert.equal(requests.length, 2);
  assert.ok('queries' in requests[1]);
});

test('a missing user never reaches the write batch', async () => {
  replies.push({ body: result([]) });
  assert.equal(await repository.updateUser('user_missing', { categoryIds: [1] }), undefined);
  assert.equal(requests.length, 1);
});

test('shared reference validation reports missing IDs and skips empty or omitted sets', async () => {
  const { findMissingReferences } = await import('../src/lib/relation-repository');
  replies.push({ body: result([[1]]) });
  assert.deepEqual(await findMissingReferences({ fieldIds: [1, 99], locationIds: [] }), { fieldIds: [99] });
  assert.equal(requests.length, 1);
  const query = requests[0];
  assert.ok('query' in query);
  assert.match(query.query, /from "fields"/);
  assert.deepEqual(query.params, ['1', '99']);
});

test('deletion targets the session identity and every preference FK cascades on user delete', async () => {
  replies.push({ body: result([[USER_ID]]) });
  await repository.deleteUser('user_known');
  const query = requests[0];
  assert.ok('query' in query);
  assert.match(query.query, /^delete from "users" where "users"\."clerk_user_id" = \$1/);
  assert.deepEqual(query.params, ['user_known']);
  for (const table of [userLocations, userEducationLevels, userFields, userCategories]) {
    const fk = getTableConfig(table).foreignKeys.find(key => key.reference().foreignTable === users);
    assert.ok(fk);
    assert.equal(fk.onDelete, 'cascade');
  }
});
