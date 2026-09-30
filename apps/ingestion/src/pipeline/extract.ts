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

export async function extractGrantsGov(options: {
	keywords: string[];
	rows?: number;
	adapter?: OpportunitySourceAdapter<GrantsGovSearchHit>;
	onInvalidHit?: (hit: unknown, keyword: string) => void;
}): Promise<ExtractionResult> {
	const { keywords, onInvalidHit } = options;
	const rows = options.rows ?? DEFAULT_GRANTS_GOV_PAGE_SIZE;
	const adapter = options.adapter ?? createGrantsGovAdapter();
	const records = new Map<string, GrantsGovSearchHit>();
	const visitedKeywords = new Set<string>();
	let skipped = 0;

	for (const rawKeyword of keywords) {
		const keyword = rawKeyword.trim();
		if (!keyword || visitedKeywords.has(keyword)) continue;
		visitedKeywords.add(keyword);

		let startRecordNum = 0;
		let hitCount = Number.POSITIVE_INFINITY;

		while (startRecordNum < hitCount) {
			const page = await adapter.searchPage({ keyword, startRecordNum, rows });
			hitCount = page.hitCount;

			for (const hit of page.hits) {
				if (!hit || typeof hit !== 'object' || typeof hit.id !== 'string' || !hit.id.trim()) {
					skipped += 1;
					onInvalidHit?.(hit, keyword);
					continue;
				}
				records.set(hit.id.trim(), hit);
			}

			if (page.hits.length === 0) break;
			startRecordNum += page.hits.length;
		}
	}

	return { records: [...records.values()], skipped };
}

