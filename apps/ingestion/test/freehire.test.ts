import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeFreehire } from '../src/pipeline/normalize';
import { extractFreehire, FREEHIRE_QUERIES, type FreehireJob } from '../src/sources/freehire';
import { resetPoliteFetchState } from '../src/sources/politeFetch';

// Four real search hits (descriptions trimmed): two co-ops, then two early-career roles.
const jobs = JSON.parse(readFileSync(new URL('./fixtures/freehire-jobs.json', import.meta.url), 'utf8')) as FreehireJob[];

// Serves pages per query from `pages`, recording every requested URL.
function fakeApi(pages: Record<string, Array<{ data: unknown[]; total: number; meta?: object }>>) {
	const requested: URL[] = [];
	const fetchImpl = (async (input: string | URL | Request) => {
		const url = new URL(String(input));
		requested.push(url);
		const page = pages[url.searchParams.get('q')!]?.[Number(url.searchParams.get('offset')) / 100];
		if (!page) return Response.json({ data: [], meta: { total: 0 } });
		return Response.json({ data: page.data, meta: { total: page.total, limit: 100, offset: 0, ...page.meta } });
	}) as typeof fetch;
	resetPoliteFetchState();
	return { requested, fetchOptions: { fetchImpl, sleepImpl: async () => {} } };
}

test('runs both title searches with the US + recency filters', async () => {
	const api = fakeApi({});
	await extractFreehire({ postedWithinDays: 7, fetchOptions: api.fetchOptions });

	assert.deepEqual(api.requested.map(url => url.searchParams.get('q')), [FREEHIRE_QUERIES.internship, FREEHIRE_QUERIES['new-grad']]);
	for (const url of api.requested) {
		assert.equal(url.origin + url.pathname, 'https://freehire.me/api/v1/jobs/search');
		assert.equal(url.searchParams.get('q_fields'), 'title');
		assert.equal(url.searchParams.get('countries'), 'us');
		assert.equal(url.searchParams.get('posted_within_days'), '7');
		assert.equal(url.searchParams.get('limit'), '100');
	}
});

test('pages until total, de-duplicates by slug, and files overlaps as internships', async () => {
	const fullPage = [jobs[0], jobs[1], ...Array.from({ length: 98 }, (_, i) => ({ ...jobs[0], public_slug: `filler-${i}` }))];
	const api = fakeApi({
		[FREEHIRE_QUERIES.internship]: [{ data: fullPage, total: 101 }, { data: [jobs[2]], total: 101 }],
		[FREEHIRE_QUERIES['new-grad']]: [{ data: [jobs[2], jobs[3]], total: 2 }],
	});
	const { records, skipped } = await extractFreehire({ postedWithinDays: 7, fetchOptions: api.fetchOptions });

	assert.equal(skipped, 0);
	assert.deepEqual(api.requested.map(url => url.searchParams.get('offset')), ['0', '100', '0']);
	assert.equal(records.length, 102);
	assert.deepEqual(records.filter(r => !String(r.job.public_slug).startsWith('filler-')).map(r => [r.job.public_slug, r.kind]), [
		[jobs[0]!.public_slug, 'internship'],
		[jobs[1]!.public_slug, 'internship'],
		[jobs[2]!.public_slug, 'internship'],
		[jobs[3]!.public_slug, 'new-grad'],
	]);
});

test('caps each query separately and skips hits without a slug', async () => {
	const invalid: unknown[] = [];
	const api = fakeApi({
		[FREEHIRE_QUERIES.internship]: [{ data: [{ title: 'No slug' }, jobs[0], jobs[1]], total: 3 }],
		[FREEHIRE_QUERIES['new-grad']]: [{ data: [jobs[2], jobs[3]], total: 2 }],
	});
	const { records, skipped } = await extractFreehire({
		postedWithinDays: 7, maxResults: 1, fetchOptions: api.fetchOptions, onInvalidJob: job => invalid.push(job),
	});

	assert.equal(skipped, 1);
	assert.deepEqual(invalid, [{ title: 'No slug' }]);
	assert.deepEqual(records.map(r => r.kind), ['internship', 'new-grad']);
});

test('refuses a response where Freehire ignored part of the query', async () => {
	const api = fakeApi({
		[FREEHIRE_QUERIES.internship]: [{ data: [jobs[0]], total: 7_000_000, meta: { ignored_params: [{ param: 'q_fields' }] } }],
	});
	await assert.rejects(extractFreehire({ postedWithinDays: 7, fetchOptions: api.fetchOptions }), /ignored part of the query/);
});

test('normalizes a real hit into an active opportunity with plain-text description', () => {
	const job = jobs[0]!;
	const opportunity = normalizeFreehire({ kind: 'internship', job });

	assert.equal(opportunity.title, 'Co-Op, AI Nucleic Acid Design');
	assert.equal(opportunity.externalId, job.public_slug);
	assert.equal(opportunity.slug, `freehire-${job.public_slug}`);
	assert.equal(opportunity.applicationUrl, job.url);
	assert.equal(opportunity.sourceUrl, `https://freehire.me/jobs/${job.public_slug}`);
	assert.equal(opportunity.sourceName, 'freehire');
	assert.equal(opportunity.sourceType, 'api');
	assert.equal(opportunity.status, 'active');
	assert.equal(opportunity.postedAt?.toISOString(), '2026-11-03T15:42:46.000Z');
	assert.equal(opportunity.applicationDeadline, null);
	assert.deepEqual(opportunity.category, { slug: 'internship', name: 'Internship' });
	assert.ok(opportunity.description?.startsWith('Your Impact at LILA'));
	assert.doesNotMatch(opportunity.description ?? '', /<[a-z]/i);
});

test('files new-grad hits under their own category and marks closed postings', () => {
	const opportunity = normalizeFreehire({ kind: 'new-grad', job: { ...jobs[2]!, closed_at: '2026-11-04T00:00:00Z' } });
	assert.deepEqual(opportunity.category, { slug: 'new-grad', name: 'New Grad' });
	assert.equal(opportunity.status, 'closed');
});

test('rejects hits missing required fields or with a non-http url', () => {
	const job = jobs[0]!;
	assert.throws(() => normalizeFreehire({ kind: 'internship', job: { ...job, public_slug: '' } }), /missing its public_slug/);
	assert.throws(() => normalizeFreehire({ kind: 'internship', job: { ...job, title: ' ' } }), /missing its title/);
	assert.throws(() => normalizeFreehire({ kind: 'internship', job: { ...job, url: 'javascript:alert(1)' } }), /invalid url/);
	assert.throws(() => normalizeFreehire({ kind: 'internship', job: { ...job, url: undefined } }), /invalid url/);
});

test('maps company, work mode, every city with its full state name, and structured pay', () => {
	const pay = normalizeFreehire({ kind: 'internship', job: jobs[4]! });
	assert.deepEqual(pay.organization, { name: 'SharkNinja', slug: 'sharkninja' });
	assert.equal(pay.workMode, 'hybrid');
	assert.deepEqual(pay.locations, [{ city: 'Needham', stateRegion: 'Massachusetts', country: 'United States', countryCode: 'US' }]);
	assert.deepEqual(pay.compensation, { compensationType: 'pay', isPaid: true, minAmount: '26.00', maxAmount: '35.00', currency: 'USD', period: 'hour' });
	assert.equal(pay.compensationText, '$26–$35/hour');

	// "Cambridge, MA USA; San Francisco, CA USA" and "Chattanooga, TN, US" both resolve the state.
	assert.deepEqual(normalizeFreehire({ kind: 'internship', job: jobs[1]! }).locations?.map(l => [l.city, l.stateRegion]),
		[['Cambridge', 'Massachusetts'], ['San Francisco', 'California']]);
	assert.equal(normalizeFreehire({ kind: 'new-grad', job: jobs[2]! }).locations?.[0]?.stateRegion, 'Tennessee');
	const fullName = { ...jobs[0]!, cities: ['Miami', 'Wichita'], location: 'Miami, Florida, United States; Wichita' };
	assert.deepEqual(normalizeFreehire({ kind: 'internship', job: fullName }).locations?.map(l => l.stateRegion), ['Florida', null]);
	const noPay = normalizeFreehire({ kind: 'internship', job: jobs[0]! });
	assert.equal(noPay.compensation, null);
	assert.equal(noPay.compensationText, null);
	assert.equal(noPay.workMode, null);
});

test('drops malformed pay, work mode and company slugs without failing the job', () => {
	const job = jobs[4]!;
	const withPay = (salary: Record<string, unknown>) => normalizeFreehire({ kind: 'internship', job: { ...job, enrichment: { ...(job.enrichment as object), ...salary } } });
	assert.equal(withPay({ salary_min: 40, salary_max: 30 }).compensation, null);
	assert.equal(withPay({ salary_period: 'week' }).compensation, null);
	assert.equal(withPay({ salary_currency: 'dollars' }).compensation, null);
	assert.equal(withPay({ salary_min: '26' }).compensation?.minAmount, null);
	assert.equal(withPay({ salary_max: null, salary_min: 120000, salary_period: 'year' }).compensationText, 'From $120,000/year');

	const odd = normalizeFreehire({ kind: 'internship', job: { ...job, work_mode: 'office', company: 'Acme Labs, Inc.', company_slug: 'Bad Slug!' } });
	assert.equal(odd.workMode, null);
	assert.deepEqual(odd.organization, { name: 'Acme Labs, Inc.', slug: 'acme-labs-inc' });
	assert.equal(normalizeFreehire({ kind: 'internship', job: { ...job, company: ' ' } }).organization, null);
});

test('falls back to country-only locations when cities are missing or span countries', () => {
	const job = jobs[0]!;
	const countriesOnly = [
		{ city: null, stateRegion: null, country: 'United States', countryCode: 'US' },
		{ city: null, stateRegion: null, country: 'Canada', countryCode: 'CA' },
	];
	assert.deepEqual(normalizeFreehire({ kind: 'internship', job: { ...job, cities: [], countries: ['us', 'ca'] } }).locations, countriesOnly);
	assert.deepEqual(normalizeFreehire({ kind: 'internship', job: { ...job, countries: ['us', 'ca'] } }).locations, countriesOnly);
	assert.deepEqual(normalizeFreehire({ kind: 'internship', job: { ...job, cities: [], countries: [] } }).locations, []);
});
