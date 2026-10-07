import {
	createGrantsGovAdapter,
	DEFAULT_GRANTS_GOV_PAGE_SIZE,
	type OpportunitySourceAdapter,
	type GrantsGovSearchHit,
} from '../sources/grants-gov';

export type ExtractionResult = {
	records: GrantsGovSearchHit[];
	skipped: number;
};

function collectPageHits(
	hits: GrantsGovSearchHit[],
	keyword: string,
	records: Map<string, GrantsGovSearchHit>,
	maxResults: number,
	onInvalidHit?: (hit: unknown, keyword: string) => void,
): number {
	let skipped = 0;
	for (const hit of hits) {
		if (records.size >= maxResults) break;
	if (!hit || typeof hit !== 'object' || typeof hit.id !== 'string' || !hit.id.trim()) {
			skipped += 1;
			onInvalidHit?.(hit, keyword);
			continue;
		}
		records.set(hit.id.trim(), hit);
	}
	return skipped;
}

async function collectKeyword(
	keyword: string,
	rows: number,
	maxResults: number,
	adapter: OpportunitySourceAdapter<GrantsGovSearchHit>,
	records: Map<string, GrantsGovSearchHit>,
	onInvalidHit?: (hit: unknown, keyword: string) => void,
): Promise<number> {
	let startRecordNum = 0;
	let hitCount = Number.POSITIVE_INFINITY;
	let skipped = 0;

	while (startRecordNum < hitCount && records.size < maxResults) {
		const page = await adapter.searchPage({ keyword, startRecordNum, rows });
		hitCount = page.hitCount;
		skipped += collectPageHits(page.hits, keyword, records, maxResults, onInvalidHit);
		if (page.hits.length === 0) break;
		startRecordNum += page.hits.length;
	}

	return skipped;
}

export async function extractGrantsGov(options: {
	keywords: string[];
	rows?: number;
	maxResults?: number;
	adapter?: OpportunitySourceAdapter<GrantsGovSearchHit>;
	onInvalidHit?: (hit: unknown, keyword: string) => void;
}): Promise<ExtractionResult> {
	const { keywords, onInvalidHit } = options;
	const rows = options.rows ?? DEFAULT_GRANTS_GOV_PAGE_SIZE;
	const maxResults = options.maxResults ?? Number.POSITIVE_INFINITY;
	const adapter = options.adapter ?? createGrantsGovAdapter();
	const records = new Map<string, GrantsGovSearchHit>();
	const visitedKeywords = new Set<string>();
	let skipped = 0;
	let keywordWork = Promise.resolve();

	for (const rawKeyword of keywords) {
		keywordWork = keywordWork.then(async () => {
			if (records.size >= maxResults) return;
		const keyword = rawKeyword.trim();
		if (!keyword || visitedKeywords.has(keyword)) return;
		visitedKeywords.add(keyword);
			skipped += await collectKeyword(keyword, rows, maxResults, adapter, records, onInvalidHit);
		});
	}
	await keywordWork;

	return { records: [...records.values()], skipped };
}

