import { GRANTS_GOV_SOURCE_NAME, type GrantsGovSearchHit } from '../sources/grants-gov';

export type NormalizedOpportunity = {
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	applicationUrl: string;
	sourceUrl: string;
	applicationDeadline: Date | null;
	externalId: string;
	sourceType: 'api';
	sourceName: string;
	postedAt: Date | null;
	status: 'active' | 'closed' | 'expired';
};

function parseGrantsGovDate(value: unknown, field: string, endOfDay = false): Date | null {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value !== 'string') throw new Error(`Grants.gov ${field} must be a date string.`);

	const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
	if (!match) throw new Error(`Grants.gov ${field} has an invalid date: ${value}.`);
	const [, monthText, dayText, yearText] = match;
	const month = Number(monthText);
	const day = Number(dayText);
	const year = Number(yearText);
	const date = new Date(Date.UTC(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		throw new Error(`Grants.gov ${field} has an invalid calendar date: ${value}.`);
	}
	return date;
}

export function normalizeGrantsGovOpportunity(
	record: GrantsGovSearchHit,
	now = new Date(),
): NormalizedOpportunity {
	const externalId = typeof record.id === 'string' ? record.id.trim() : '';
	const title = typeof record.title === 'string' ? record.title.trim() : '';
	if (!externalId) throw new Error('Grants.gov opportunity is missing its ID.');
	if (!title) throw new Error(`Grants.gov opportunity ${externalId} is missing its title.`);

	const applicationDeadline = parseGrantsGovDate(record.closeDate, 'closeDate', true);
	const rawStatus = typeof record.oppStatus === 'string' ? record.oppStatus.toLowerCase() : '';
	let status: NormalizedOpportunity['status'] = 'active';
	if (rawStatus === 'closed' || rawStatus === 'archived') status = 'closed';
	else if (applicationDeadline && applicationDeadline.getTime() < now.getTime()) status = 'expired';
	const detailUrl = `https://www.grants.gov/search-results-detail/${encodeURIComponent(externalId)}`;

	return {
		title,
		slug: `grants-gov-${externalId.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}`,
		summary: null,
		description: null,
		applicationUrl: detailUrl,
		sourceUrl: detailUrl,
		applicationDeadline,
		externalId,
		sourceType: 'api',
		sourceName: GRANTS_GOV_SOURCE_NAME,
		postedAt: null,
		status,
	};
}
