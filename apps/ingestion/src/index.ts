import { fileURLToPath } from 'node:url';
import { grantsGovKeywords, requireDatabaseUrl } from './config/env';
import { extractGrantsGov } from './pipeline/extract';
import { normalizeGrantsGovOpportunity, normalizeScholarships360, type NormalizedOpportunity } from './pipeline/normalize';
import { loadOpportunities } from './pipeline/persist';
import { GRANTS_GOV_SOURCE_NAME } from './sources/grants-gov';
import { Scholarships360Scraper } from './sources/static-scrapers';

const USAGE = 'Usage: npm run ingest -w @radar/ingestion -- grants-gov [--keywords=health,education | --no-keyword] [--rows=100] [--max-results=10]\n'
	+ '       npm run ingest -w @radar/ingestion -- scholarships360';

type GrantsGovOptions = { keywords?: string; rows: number; maxResults?: number; noKeyword: boolean };

// Adding a source is one entry here plus its line in USAGE.
const JOBS: Record<string, (args: string[]) => Promise<void>> = {
	[GRANTS_GOV_SOURCE_NAME]: runGrantsGov,
	scholarships360: runScholarships360,
};

export async function runIngestion(argv = process.argv.slice(2)): Promise<void> {
	const [source, ...args] = argv;
	if (source === '--help' || source === '-h') return console.log(USAGE);
	// Object.hasOwn keeps names like "toString" from matching inherited properties.
	const run = source !== undefined && Object.hasOwn(JOBS, source) ? JOBS[source] : undefined;
	if (!run) throw new Error(USAGE);
	requireDatabaseUrl();
	await run(args);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	try {
		await runIngestion();
	} catch (error) {
		console.error(`Ingestion failed: ${error instanceof Error ? error.message : 'unknown error'}`);
		process.exitCode = 1;
	}
}

function parseGrantsGovArgs(args: string[]): GrantsGovOptions {
	const options: GrantsGovOptions = { rows: 100, noKeyword: false };
	for (const arg of args) {
		if (arg.startsWith('--keywords=')) options.keywords = arg.slice('--keywords='.length);
		else if (arg.startsWith('--rows=')) options.rows = Number(arg.slice('--rows='.length));
		else if (arg.startsWith('--max-results=')) options.maxResults = Number(arg.slice('--max-results='.length));
		else if (arg === '--no-keyword') options.noKeyword = true;
		else throw new Error(USAGE);
	}
	if (!Number.isInteger(options.rows) || options.rows < 1 || options.rows > 100) {
		throw new Error('--rows must be an integer between 1 and 100.');
	}
	if (options.maxResults !== undefined && (!Number.isSafeInteger(options.maxResults) || options.maxResults < 1)) {
		throw new Error('--max-results must be a positive safe integer.');
	}
	if (options.noKeyword && options.keywords !== undefined) {
		throw new Error('--no-keyword cannot be combined with --keywords.');
	}
	if (options.noKeyword && options.maxResults === undefined) {
		throw new Error('--max-results is required with --no-keyword to cap broad searches.');
	}
	return options;
}

// Normalizes each record, loads the good ones, and prints one summary line; any failure sets a non-zero exit code.
async function normalizeAndLoad<Raw>(
	sourceName: string,
	records: Raw[],
	normalize: (record: Raw) => NormalizedOpportunity,
	describe: (record: Raw) => string,
	failedBefore = 0,
): Promise<void> {
	let failed = failedBefore;
	const normalized: NormalizedOpportunity[] = [];
	for (const record of records) {
		try {
			normalized.push(normalize(record));
		} catch (error) {
			failed += 1;
			console.error(`Skipped ${sourceName} opportunity ${describe(record)}: ${error instanceof Error ? error.message : 'normalization failed'}`);
		}
	}

	const loaded = await loadOpportunities(sourceName, normalized, undefined, new Date(), (record, error) => {
		const message = error instanceof Error ? error.message : 'database write failed';
		if (record) console.error(`Failed to load ${sourceName} opportunity ${record.externalId}: ${message}`);
		else console.error(`Failed to expire overdue ${sourceName} opportunities: ${message}`);
	});
	failed += loaded.failed;

	console.log(JSON.stringify({ source: sourceName, fetched: records.length, inserted: loaded.inserted, updated: loaded.updated, failed }));
	if (failed) process.exitCode = 1;
}

async function runGrantsGov(args: string[]): Promise<void> {
	const options = parseGrantsGovArgs(args);
	const keywords = options.noKeyword ? [] : grantsGovKeywords(options.keywords);
	if (!options.noKeyword && !keywords.length) throw new Error('Set GRANTS_GOV_KEYWORDS or pass --keywords=keyword1,keyword2 (or use --no-keyword --max-results=N).');

	let skipped = 0;
	const extraction = await extractGrantsGov({
		keywords,
		noKeyword: options.noKeyword,
		rows: options.rows,
		maxResults: options.maxResults,
		onInvalidHit: (_hit, keyword) => {
			skipped += 1;
			console.error(`Skipped malformed Grants.gov result for keyword "${keyword}".`);
		},
	});

	await normalizeAndLoad(GRANTS_GOV_SOURCE_NAME, extraction.records, record => normalizeGrantsGovOpportunity(record),
		record => (typeof record.id === 'string' ? record.id : 'unknown'), skipped);
}

async function runScholarships360(args: string[]): Promise<void> {
	if (args.length) throw new Error(USAGE);
	const scraper = new Scholarships360Scraper();
	await normalizeAndLoad(scraper.sourceName, await scraper.fetch(), record => normalizeScholarships360(record),
		record => record.title);
}