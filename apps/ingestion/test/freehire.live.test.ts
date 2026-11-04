import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeFreehire } from '../src/pipeline/normalize';
import { fetchFreehirePage, FREEHIRE_QUERIES, type FreehireKind } from '../src/sources/freehire';

// Hits the real API (one request per query), so it only runs with FREEHIRE_LIVE=1.
const skip = process.env.FREEHIRE_LIVE !== '1' && 'set FREEHIRE_LIVE=1 to call the real Freehire API';

// Looser than the queries themselves: Freehire matches quoted words in any order ("New PhD Graduate").
const RELEVANT: Record<FreehireKind, RegExp> = {
	internship: /\bintern|\bco[-\s]?op\b/i,
	'new-grad': /\bgrad|early[-\s]career/i,
};

for (const kind of Object.keys(FREEHIRE_QUERIES) as FreehireKind[]) {
	test(`live Freehire ${kind} search returns relevant, loadable jobs`, { skip }, async t => {
		let page;
		try {
			page = await fetchFreehirePage(FREEHIRE_QUERIES[kind], 0, 20, 7);
		} catch (error) {
			// politeFetch says "Giving up" only after retrying 429/5xx/network errors: an outage, not a bug.
			if (error instanceof Error && error.message.startsWith('Giving up')) return t.skip(`Freehire unavailable: ${error.message}`);
			throw error;
		}

		assert.ok(page.total > 0, 'expected at least one US posting in the last 7 days');
		assert.ok(page.jobs.length > 0);
		const opportunities = page.jobs.map(job => normalizeFreehire({ kind, job }));

		const relevant = opportunities.filter(o => RELEVANT[kind].test(o.title));
		const irrelevant = opportunities.filter(o => !RELEVANT[kind].test(o.title)).map(o => o.title);
		assert.ok(relevant.length / opportunities.length >= 0.9, `too many off-target titles: ${JSON.stringify(irrelevant)}`);
		// Live coverage was 100% company and 98% location; a big drop means Freehire renamed a field.
		const share = (has: (o: typeof opportunities[number]) => boolean) => opportunities.filter(has).length / opportunities.length;
		assert.ok(share(o => Boolean(o.organization)) >= 0.9, 'most jobs should map to an organization');
		assert.ok(share(o => Boolean(o.locations?.length)) >= 0.8, 'most jobs should map to a location');
	});
}
