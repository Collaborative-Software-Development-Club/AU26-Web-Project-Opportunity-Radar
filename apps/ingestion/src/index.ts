import { fileURLToPath } from 'node:url';
import { grantsGovKeywords, requireDatabaseUrl } from './config/env';
import { extractGrantsGov } from './pipeline/extract';
import { normalizeGrantsGovOpportunity } from './pipeline/normalize';
import { persistGrantsGov } from './pipeline/persist';

type CliOptions = { keywords?: string; rows: number; maxResults?: number; noKeyword: boolean; help: boolean };

function parseArgs(args: string[]): CliOptions {
	const options: CliOptions = { rows: 100, noKeyword: false, help: false };
	for (const arg of args) {
		if (arg === '--help' || arg === '-h') options.help = true;
		else if (arg.startsWith('--keywords=')) options.keywords = arg.slice('--keywords='.length);
		else if (arg.startsWith('--rows=')) options.rows = Number(arg.slice('--rows='.length));
		else if (arg.startsWith('--max-results=')) options.maxResults = Number(arg.slice('--max-results='.length));
		else if (arg === '--no-keyword') options.noKeyword = true;
		else throw new Error('Usage: npm run ingest -w @radar/ingestion -- [--keywords=health,education | --no-keyword] [--rows=100] [--max-results=10]');
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

export async function runGrantsGovIngestion(args = process.argv.slice(2)): Promise<void> {
	const options = parseArgs(args);
	if (options.help) {
		console.log('Grants.gov ingestion: --keywords=health,education | --no-keyword --max-results=10 [--rows=100]');
		return;
	}

	requireDatabaseUrl();
	const keywords = options.noKeyword ? [] : grantsGovKeywords(options.keywords);
	if (!options.noKeyword && !keywords.length) throw new Error('Set GRANTS_GOV_KEYWORDS or pass --keywords=keyword1,keyword2 (or use --no-keyword --max-results=N).');

	let failed = 0;
	const extraction = await extractGrantsGov({
		keywords,
		noKeyword: options.noKeyword,
		rows: options.rows,
		maxResults: options.maxResults,
		onInvalidHit: (_hit, keyword) => {
			failed += 1;
			console.error(`Skipped malformed Grants.gov result for keyword "${keyword}".`);
		},
	});

	const normalized = [];
	for (const record of extraction.records) {
		try {
			normalized.push(normalizeGrantsGovOpportunity(record));
		} catch (error) {
			failed += 1;
			const recordId = typeof record.id === 'string' ? record.id : 'unknown';
			console.error(`Skipped Grants.gov opportunity ${recordId}: ${error instanceof Error ? error.message : 'normalization failed'}`);
		}
	}

	const persisted = await persistGrantsGov(normalized, undefined, new Date(), (record, error) => {
		const message = error instanceof Error ? error.message : 'database write failed';
		if (record) console.error(`Failed to persist Grants.gov opportunity ${record.externalId}: ${message}`);
		else console.error(`Failed to expire overdue Grants.gov opportunities: ${message}`);
	});
	failed += persisted.failed;

	console.log(JSON.stringify({
		source: 'grants-gov',
		fetched: extraction.records.length,
		inserted: persisted.inserted,
		updated: persisted.updated,
		failed,
	}));
	if (failed) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
	try {
		await runGrantsGovIngestion();
	} catch (error) {
		console.error(`Grants.gov ingestion failed: ${error instanceof Error ? error.message : 'unknown error'}`);
		process.exitCode = 1;
	}
}
