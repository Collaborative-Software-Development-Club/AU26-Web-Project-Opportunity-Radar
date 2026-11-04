import { politeFetch, type PoliteFetchOptions } from './politeFetch';

export const FREEHIRE_SOURCE_NAME = 'freehire';
export const FREEHIRE_SEARCH_URL = 'https://freehire.me/api/v1/jobs/search';
const PAGE_SIZE = 100;
const MAX_DEPTH = 10_000;

export type FreehireKind = 'internship' | 'new-grad';

// Title-only searches: Freehire's employment_type/seniority facets are too noisy (sales reps tagged as internships)
// Internship runs first, so a posting matching both is filed as an internship
export const FREEHIRE_QUERIES: Record<FreehireKind, string> = {
	// "co-op" is quoted: unquoted it splits into co + op, and "co" matches every ", CO" (Colorado) title.
	internship: 'intern OR internship OR "co-op"',
	'new-grad': '"new grad" OR "new graduate" OR "university graduate" OR "recent graduate" OR "early career"',
};

export type FreehireJob = {
	public_slug?: unknown;
	title?: unknown;
	url?: unknown;
	description?: unknown;
	posted_at?: unknown;
	closed_at?: unknown;
	[key: string]: unknown;
};

export type FreehireRecord = { kind: FreehireKind; job: FreehireJob };

type FreehireSearchResponse = {
	data?: unknown;
	meta?: { total?: unknown; ignored_params?: unknown; ignored_values?: unknown };
};

export function freehireSearchUrl(q: string, offset: number, limit: number, postedWithinDays: number): string {
	const params = new URLSearchParams({
		q,
		q_fields: 'title',
		countries: 'us',
		posted_within_days: String(postedWithinDays),
		limit: String(limit),
		offset: String(offset),
	});
	return `${FREEHIRE_SEARCH_URL}?${params}`;
}

export async function fetchFreehirePage(
	q: string,
	offset: number,
	limit: number,
	postedWithinDays: number,
	fetchOptions: PoliteFetchOptions = {},
): Promise<{ jobs: FreehireJob[]; total: number }> {
	const body = await politeFetch(freehireSearchUrl(q, offset, limit, postedWithinDays), {
		...fetchOptions,
		headers: { Accept: 'application/json' },
	});

	let payload: FreehireSearchResponse;
	try {
		payload = JSON.parse(body) as FreehireSearchResponse;
	} catch {
		throw new Error('Freehire returned invalid JSON.');
	}

	// Freehire silently drops unknown filters, which would turn this into a whole-catalogue crawl.
	const { ignored_params: ignoredParams, ignored_values: ignoredValues } = payload.meta ?? {};
	if (ignoredParams || ignoredValues) {
		throw new Error(`Freehire ignored part of the query: ${JSON.stringify({ ignoredParams, ignoredValues })}`);
	}

	const total = Number(payload.meta?.total);
	if (!Array.isArray(payload.data) || !Number.isInteger(total) || total < 0) {
		throw new Error('Freehire search response was invalid.');
	}
	return { jobs: payload.data as FreehireJob[], total };
}

// Runs each query in turn, de-duplicating by public_slug; maxResults caps each query, not the whole run.
export async function extractFreehire(options: {
	postedWithinDays: number;
	maxResults?: number;
	fetchOptions?: PoliteFetchOptions;
	onInvalidJob?: (job: unknown, kind: FreehireKind) => void;
}): Promise<{ records: FreehireRecord[]; skipped: number }> {
	const maxResults = options.maxResults ?? Number.POSITIVE_INFINITY;
	const records = new Map<string, FreehireRecord>();
	let skipped = 0;

	for (const kind of Object.keys(FREEHIRE_QUERIES) as FreehireKind[]) {
		let taken = 0;
		for (let offset = 0; offset < MAX_DEPTH && taken < maxResults; offset += PAGE_SIZE) {
			const page = await fetchFreehirePage(FREEHIRE_QUERIES[kind], offset, PAGE_SIZE, options.postedWithinDays, options.fetchOptions);
			for (const job of page.jobs) {
				if (taken >= maxResults) break;
				const slug = job && typeof job.public_slug === 'string' ? job.public_slug.trim() : '';
				if (!slug) {
					skipped += 1;
					options.onInvalidJob?.(job, kind);
					continue;
				}
				if (records.has(slug)) continue;
				records.set(slug, { kind, job });
				taken += 1;
			}
			if (page.jobs.length < PAGE_SIZE || offset + PAGE_SIZE >= page.total) break;
		}
	}

	return { records: [...records.values()], skipped };
}
