import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, test } from 'node:test';
import express from 'express';
import { HttpError } from '../src/lib/http-error';
import { errorHandler } from '../src/middleware/error-handler';
import {
  parseCreateOpportunity, parseListQuery, parseUpdateOpportunity,
} from '../src/modules/opportunities/opportunities.schema';
import { toView, type OpportunityRow } from '../src/modules/opportunities/opportunities.view';
import type {
  CompensationWrite, CreateOpportunityInput, ListOpportunitiesQuery, OpportunityView, RelationIdsWrite,
} from '../src/modules/opportunities/opportunities.types';


process.env.CLERK_PUBLISHABLE_KEY ||= `pk_test_${Buffer.from('opportunities-test.clerk.accounts.dev$').toString('base64')}`;
process.env.CLERK_SECRET_KEY ||= 'sk_test_local_fixture_only';
const { createOpportunitiesRouter } = await import('../src/modules/opportunities/opportunities.routes');

const NOW = new Date('2026-01-15T12:00:00.000Z');
const MISSING = '44444444-4444-4444-8444-444444444444';
const ORGANIZATION = {
  id: '11111111-1111-4111-8111-111111111111', name: 'Demo Campus Lab', slug: 'demo-campus-lab',
  websiteUrl: 'https://example.invalid', logoUrl: null, createdAt: NOW, updatedAt: NOW,
};

const COLUMBUS = {
  id: '22222222-2222-4222-8222-222222222222', city: 'Columbus', stateRegion: 'Ohio',
  country: 'United States', countryCode: 'US', latitude: '39.961176', longitude: '-82.998794',
};
const BERLIN = {
  id: '33333333-3333-4333-8333-333333333333', city: 'Berlin', stateRegion: null,
  country: 'Germany', countryCode: 'DE', latitude: null, longitude: null,
};
// Two rows share a city name, so an opportunity linked to both must still be returned once.
const COLUMBUS_GA = {
  id: '55555555-5555-4555-8555-555555555555', city: 'Columbus', stateRegion: 'Georgia',
  country: 'United States', countryCode: 'US', latitude: null, longitude: null,
};
const LOCATIONS = { [COLUMBUS.id]: COLUMBUS, [BERLIN.id]: BERLIN, [COLUMBUS_GA.id]: COLUMBUS_GA };
const FIELDS = { 1: { id: 1, name: 'Computer Science', slug: 'computer-science' }, 2: { id: 2, name: 'Business', slug: 'business' } };
const CATEGORIES = { 1: { id: 1, name: 'Internship', slug: 'internship' }, 2: { id: 2, name: 'Scholarship', slug: 'scholarship' } };
const LEVELS = { 1: { id: 1, name: 'Undergraduate', sortOrder: 2 }, 2: { id: 2, name: 'High School', sortOrder: 1 } };

type Stored = { base: OpportunityRow; compensation: CompensationWrite | null; relations: Required<RelationIdsWrite> };
const NONE: Required<RelationIdsWrite> = { locationIds: [], educationLevelIds: [], fieldIds: [], categoryIds: [] };
const ROW_DEFAULTS = {
  organizationId: null, summary: null, description: null, applicationDeadline: null,
  workMode: null, workAuthorization: null, externalId: null, sourceType: null, sourceName: null,
  postedAt: null, firstSeenAt: NOW, lastVerifiedAt: null, status: 'active', createdAt: NOW, updatedAt: NOW,
};
const rows = new Map<string, Stored>();
let lastListQuery: ListOpportunitiesQuery | undefined;

function store({ compensation, relations, ...fields }: CreateOpportunityInput): string {
  const id = randomUUID();
  rows.set(id, {
    base: { ...ROW_DEFAULTS, ...fields, id },
    compensation: compensation ?? null,
    relations: { ...NONE, ...relations },
  });
  return id;
}

// Stored IDs resolve through the production mapping, so the fake aggregates exactly as Drizzle does.
const view = ({ base, compensation, relations }: Stored): OpportunityView => toView({
  ...base,
  organization: base.organizationId === ORGANIZATION.id ? ORGANIZATION : null,
  compensation: compensation && { id: base.id, opportunityId: base.id, ...compensation, createdAt: NOW, updatedAt: NOW },
  locations: relations.locationIds.map(id => ({ location: LOCATIONS[id as keyof typeof LOCATIONS] })),
  educationLevels: relations.educationLevelIds.map(id => ({ educationLevel: LEVELS[id as keyof typeof LEVELS] })),
  fields: relations.fieldIds.map(id => ({ field: FIELDS[id as keyof typeof FIELDS] })),
  categories: relations.categoryIds.map(id => ({ category: CATEGORIES[id as keyof typeof CATEGORIES] })),
});

const unknownIds = <T extends string | number>(ids: T[] | undefined, known: object): T[] =>
  (ids ?? []).filter(id => !Object.hasOwn(known, String(id)));

const app = express();
app.use('/api/opportunities', createOpportunitiesRouter({
  authenticate: (_req, _res, next) => next(),
  resolveRepository: async () => ({
    async list(query) {
      lastListQuery = query;
      const term = query.q?.toLowerCase();
      const place = query.location?.toLowerCase();
      const matches = [...rows.values()].filter(({ base, relations }) =>
        (!query.status || base.status === query.status)
        && (!query.organizationId || base.organizationId === query.organizationId)
        && (!query.sourceName || base.sourceName === query.sourceName)
        && (!query.workMode || base.workMode === query.workMode)
        // Mirrors the ILIKE '%q%' pair, including a null summary failing to match rather than excluding.
        && (!term || base.title.toLowerCase().includes(term)
          || (base.summary?.toLowerCase().includes(term) ?? false))
        && (!query.category || relations.categoryIds
          .some(id => CATEGORIES[id as keyof typeof CATEGORIES]?.slug === query.category))
        && (!place || relations.locationIds.some(id => {
          const found = LOCATIONS[id as keyof typeof LOCATIONS];
          return found?.city?.toLowerCase() === place || found?.stateRegion?.toLowerCase() === place;
        })));
      return { items: matches.slice(query.offset, query.offset + query.limit).map(view), total: matches.length };
    },
    async findById(id) {
      const found = rows.get(id);
      return found ? view(found) : null;
    },
    async findBySlug(slug) {
      const found = [...rows.values()].find(({ base }) => base.slug === slug);
      return found ? { id: found.base.id } : null;
    },
    async findBySourceIdentity(sourceName, externalId) {
      const found = [...rows.values()].find(({ base }) =>
        base.sourceName === sourceName && base.externalId === externalId);
      return found ? { id: found.base.id } : null;
    },
    async findMissingReferences(relations) {
      return Object.fromEntries([
        ['locationIds', unknownIds(relations.locationIds, LOCATIONS)],
        ['educationLevelIds', unknownIds(relations.educationLevelIds, LEVELS)],
        ['fieldIds', unknownIds(relations.fieldIds, FIELDS)],
        ['categoryIds', unknownIds(relations.categoryIds, CATEGORIES)],
      ].filter(([, ids]) => (ids as unknown[]).length));
    },
    async create(input) {
      return view(rows.get(store(input))!);
    },
    async update(id, { fields, compensation, relations }) {
      const found = rows.get(id);
      if (!found) return null;
      Object.assign(found.base, fields, { updatedAt: new Date(NOW.getTime() + 1_000) });
      if (compensation !== undefined) found.compensation = compensation;
      found.relations = { ...found.relations, ...relations };
      return view(found);
    },
    async remove(id) {
      return rows.delete(id);
    },
  }),
}));
app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}/api/opportunities`;

const relations = { locationIds: [COLUMBUS.id, BERLIN.id], educationLevelIds: [1, 2], fieldIds: [1, 2], categoryIds: [2, 1] };
const payload = (overrides: Record<string, unknown> = {}) => ({
  title: 'Software Engineering Internship', slug: `internship-${randomUUID()}`,
  applicationUrl: 'https://example.invalid/apply', sourceUrl: 'https://example.invalid/listing', ...overrides,
});
const seed = (overrides: Partial<CreateOpportunityInput> = {}) => store({
  ...payload() as unknown as CreateOpportunityInput, organizationId: ORGANIZATION.id, relations, ...overrides,
});
const send = (method: string, url: string, body?: unknown) => fetch(url, {
  method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});
const detail = (id: string) => send('GET', `${base}/${id}`).then(response => response.json() as Promise<OpportunityView>);

test('detail aggregates the organization and every relation in a stable order', async () => {
  const body = await detail(seed());
  assert.deepEqual(body.organization, {
    id: ORGANIZATION.id, name: 'Demo Campus Lab', slug: 'demo-campus-lab',
    websiteUrl: 'https://example.invalid', logoUrl: null,
  });
  assert.deepEqual(body.locations, [BERLIN, COLUMBUS]);
  assert.deepEqual(body.educationLevels.map(level => level.name), ['High School', 'Undergraduate']);
  assert.deepEqual(body.fields.map(field => field.slug), ['business', 'computer-science']);
  assert.deepEqual(body.categories.map(category => category.slug), ['internship', 'scholarship']);
});

test('listing carries the relations on every row', async () => {
  const sourceName = `listing-${randomUUID()}`;
  seed({ sourceName });
  const response = await send('GET', `${base}?sourceName=${sourceName}`);
  assert.equal(response.status, 200);
  const { data, pagination } = await response.json() as { data: OpportunityView[]; pagination: { total: number } };
  assert.equal(pagination.total, 1);
  assert.equal(data[0].organization?.slug, 'demo-campus-lab');
  assert.equal(data[0].locations.length, 2);
  assert.deepEqual(data[0].fields.map(field => field.name), ['Business', 'Computer Science']);
  assert.deepEqual(data[0].educationLevels.map(level => level.id), [2, 1]);
});

test('create persists the referenced relations and omitting them stores none', async () => {
  const created = await send('POST', base, payload({
    organizationId: ORGANIZATION.id, locationIds: [BERLIN.id], educationLevelIds: [1], fieldIds: [2, 1], categoryIds: [1],
  }));
  assert.equal(created.status, 201);
  const body = await created.json() as OpportunityView;
  assert.deepEqual(body.locations.map(location => location.id), [BERLIN.id]);
  assert.deepEqual(body.fields.map(field => field.name), ['Business', 'Computer Science']);
  assert.deepEqual(rows.get(body.id)?.relations, { ...NONE, locationIds: [BERLIN.id], educationLevelIds: [1], fieldIds: [2, 1], categoryIds: [1] });

  const bare = await send('POST', base, payload());
  const { id } = await bare.json() as OpportunityView;
  assert.deepEqual(rows.get(id)?.relations, NONE);
});

test('update replaces only the relations it names and an empty array clears one', async () => {
  const id = seed();
  const replaced = await send('PATCH', `${base}/${id}`, { fieldIds: [2] });
  assert.equal(replaced.status, 200);
  const body = await replaced.json() as OpportunityView;
  assert.deepEqual(body.fields.map(field => field.id), [2]);
  assert.deepEqual(body.categories.map(category => category.id), [1, 2]);
  assert.equal(body.locations.length, 2);

  const cleared = await send('PATCH', `${base}/${id}`, { locationIds: [], categoryIds: [] });
  const after = await cleared.json() as OpportunityView;
  assert.deepEqual(after.locations, []);
  assert.deepEqual(after.categories, []);
  assert.deepEqual(rows.get(id)?.relations.educationLevelIds, [1, 2]);
});

test('unknown lookup IDs are rejected on create and update without writing', async () => {
  const before = rows.size;
  const created = await send('POST', base, payload({ locationIds: [MISSING], fieldIds: [1, 99] }));
  assert.equal(created.status, 400);
  const failure = await created.json() as { error: string; details: { field: string; message: string }[] };
  assert.equal(failure.error, 'Referenced records do not exist.');
  assert.deepEqual(failure.details.map(entry => entry.field), ['locationIds', 'fieldIds']);
  assert.match(failure.details[1].message, /unknown field IDs: 99/);
  assert.equal(rows.size, before);

  const id = seed();
  assert.equal((await send('PATCH', `${base}/${id}`, { educationLevelIds: [7] })).status, 400);
  assert.deepEqual(rows.get(id)?.relations.educationLevelIds, [1, 2]);
  assert.equal((await send('PATCH', `${base}/${MISSING}`, { fieldIds: [1] })).status, 404);
});

for (const [body, field, expectation] of [
  [{ fieldIds: 1 }, 'fieldIds', /must be an array/],
  [{ locationIds: ['not-a-uuid'] }, 'locationIds', /at index 0: must be a UUID/],
  [{ categoryIds: [0] }, 'categoryIds', /at index 0: must be between 1 and 32767/],
  [{ educationLevelIds: [1.5] }, 'educationLevelIds', /at index 0: must be an integer/],
  [{ fieldIds: null }, 'fieldIds', /must not be null/],
] as const) {
  test(`create rejects a malformed ${field} payload: ${JSON.stringify(body)}`, async () => {
    const response = await send('POST', base, payload(body));
    assert.equal(response.status, 400);
    const failure = await response.json() as { details: { field: string; message: string }[] };
    assert.deepEqual(failure.details.map(entry => entry.field), [field]);
    assert.match(failure.details[0].message, expectation);
  });
}

test('mapping reports empty relations rather than omitting them', () => {
  const bare = toView({ ...ROW_DEFAULTS, id: MISSING, title: 'Bare', slug: 'bare',
    applicationUrl: 'https://example.invalid/apply', sourceUrl: 'https://example.invalid/listing' });
  assert.deepEqual([bare.locations, bare.educationLevels, bare.fields, bare.categories], [[], [], [], []]);
  assert.equal(bare.organization, null);
});

test('parsing collapses repeated IDs, accepts relation-only updates, and caps the list', () => {
  assert.deepEqual(parseCreateOpportunity(payload({ fieldIds: [1, 1, 2], categoryIds: [] })).relations,
    { fieldIds: [1, 2], categoryIds: [] });
  assert.deepEqual(parseUpdateOpportunity({ locationIds: [COLUMBUS.id] }),
    { fields: {}, compensation: undefined, relations: { locationIds: [COLUMBUS.id] } });
  assert.throws(() => parseUpdateOpportunity({}), /Provide at least one field to update/);
  assert.throws(
    () => parseCreateOpportunity(payload({ fieldIds: Array.from({ length: 51 }, (_, index) => index + 1) })),
    (error: unknown) => error instanceof HttpError && error.details.some(entry =>
      entry.field === 'fieldIds' && /must contain at most 50 items/.test(entry.message)),
  );
});

// Rows accumulate across tests, so every listing assertion is scoped by a unique sourceName.
const storeFor = (sourceName: string, overrides: Record<string, unknown>, ids: Partial<RelationIdsWrite> = {}) =>
  store({ ...payload({ sourceName, ...overrides }), relations: { ...NONE, ...ids } } as unknown as CreateOpportunityInput);

const listing = async (query: string) => {
  const response = await send('GET', `${base}?${query}`);
  assert.equal(response.status, 200);
  return await response.json() as { data: OpportunityView[]; pagination: { total: number } };
};

test('listing query parsing accepts each search and filter key', () => {
  assert.deepEqual(parseListQuery({
    q: '  Software Intern  ', category: 'internship', location: 'Columbus', workMode: 'remote',
    status: 'active', limit: '5', offset: '10',
  }), {
    limit: 5, offset: 10, status: 'active', q: 'Software Intern',
    category: 'internship', location: 'Columbus', workMode: 'remote',
  });
  // A cleared search box sends q=; that is not a filter.
  assert.deepEqual(parseListQuery({ q: '' }), { limit: 20, offset: 0 });
  assert.deepEqual(parseListQuery({ q: '   ' }), { limit: 20, offset: 0 });
  assert.deepEqual(parseListQuery({}), { limit: 20, offset: 0 });
  // LIKE metacharacters stay part of the term; escaping happens in the repository.
  assert.equal(parseListQuery({ q: '100%' }).q, '100%');
  assert.equal(parseListQuery({ q: 'a_b' }).q, 'a_b');
});

test('listing query parsing reports every malformed search and filter value', () => {
  const badFields = (query: Record<string, unknown>) => {
    try {
      parseListQuery(query);
    } catch (error) {
      if (error instanceof HttpError) return error.details.map(detail => detail.field).sort();
      throw error;
    }
    return [];
  };
  assert.deepEqual(badFields({ workMode: 'hybrid-ish' }), ['workMode']);
  assert.deepEqual(badFields({ q: 'x'.repeat(201) }), ['q']);
  assert.deepEqual(badFields({ category: 'Not A Slug' }), ['category']);
  assert.deepEqual(badFields({ location: 'x'.repeat(151) }), ['location']);
  assert.deepEqual(badFields({ q: ['one', 'two'] }), ['q']);
  assert.deepEqual(badFields({ sort: 'title' }), ['sort']);
  // One response carries every problem.
  assert.deepEqual(badFields({ workMode: 'nope', category: 'Bad Slug' }), ['category', 'workMode']);
});

test('search and filters combine with AND and the total matches the filtered rows', async () => {
  const sourceName = `filters-${randomUUID()}`;
  storeFor(sourceName, { title: 'Remote Software Intern', workMode: 'remote' },
    { categoryIds: [1], locationIds: [COLUMBUS.id] });
  storeFor(sourceName, { title: 'Onsite Software Intern', workMode: 'onsite' },
    { categoryIds: [1], locationIds: [COLUMBUS.id] });
  storeFor(sourceName, { title: 'Remote Scholarship', workMode: 'remote' }, { categoryIds: [2] });
  // Matches on summary rather than title, and carries no location.
  storeFor(sourceName, { title: 'Unrelated Fellowship', summary: 'Intern-adjacent research work', workMode: 'remote' },
    { categoryIds: [1] });

  const scoped = `sourceName=${sourceName}`;
  assert.equal((await listing(scoped)).pagination.total, 4);

  const filtered = await listing(`${scoped}&q=intern&category=internship&workMode=remote`);
  assert.deepEqual(filtered.data.map(row => row.title).sort(),
    ['Remote Software Intern', 'Unrelated Fellowship']);
  assert.equal(filtered.pagination.total, 2);
  assert.equal(filtered.data.length, filtered.pagination.total);

  // Adding the location narrows it again, case-insensitively.
  const located = await listing(`${scoped}&q=intern&category=internship&workMode=remote&location=columbus`);
  assert.deepEqual(located.data.map(row => row.title), ['Remote Software Intern']);
  assert.equal(located.pagination.total, 1);

  // state_region matches as well as city.
  assert.equal((await listing(`${scoped}&location=ohio`)).pagination.total, 2);
});

test('an unknown category slug or location returns an empty page, not an error', async () => {
  const sourceName = `unknown-${randomUUID()}`;
  storeFor(sourceName, { title: 'Campus Internship' }, { categoryIds: [1], locationIds: [COLUMBUS.id] });

  for (const filter of ['category=does-not-exist', 'location=Atlantis', 'q=nothing-matches-this']) {
    const body = await listing(`sourceName=${sourceName}&${filter}`);
    assert.deepEqual(body.data, [], filter);
    assert.equal(body.pagination.total, 0, filter);
  }
});

test('a row matching several locations or categories is returned once', async () => {
  const sourceName = `distinct-${randomUUID()}`;
  // Both locations are named Columbus and both categories are attached to the one row.
  storeFor(sourceName, { title: 'Dual Listing' },
    { locationIds: [COLUMBUS.id, COLUMBUS_GA.id], categoryIds: [1, 2] });

  const byLocation = await listing(`sourceName=${sourceName}&location=Columbus`);
  assert.deepEqual(byLocation.data.map(row => row.title), ['Dual Listing']);
  assert.equal(byLocation.pagination.total, 1);

  const byCategory = await listing(`sourceName=${sourceName}&category=internship`);
  assert.equal(byCategory.data.length, 1);
  assert.equal(byCategory.pagination.total, 1);
});

test('the route rejects unusable query parameters with field errors', async () => {
  for (const query of ['workMode=hybrid-ish', `q=${'x'.repeat(201)}`, 'sort=title', 'category=Bad%20Slug']) {
    const response = await send('GET', `${base}?${query}`);
    assert.equal(response.status, 400, query);
    const body = await response.json() as { error: string; details: { field: string; message: string }[] };
    assert.equal(body.error, 'Query parameters are invalid.');
    assert.ok(body.details.length >= 1, query);
  }
});

test('the parsed query reaches the repository exactly as validated', async () => {
  const sourceName = `forwarded-${randomUUID()}`;
  await listing(`sourceName=${sourceName}&q=%20intern%20&category=internship&location=Columbus&workMode=remote&limit=5&offset=2`);
  assert.deepEqual(lastListQuery, {
    limit: 5, offset: 2, sourceName, q: 'intern',
    category: 'internship', location: 'Columbus', workMode: 'remote',
  });
});
