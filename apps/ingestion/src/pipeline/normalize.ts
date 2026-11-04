import { GRANTS_GOV_SOURCE_NAME, type GrantsGovSearchHit } from '../sources/grants-gov';
import type { RawOpportunity } from '../sources/types';

// The one shape every source hands to the loader: an opportunities row plus its category and pay text.
export type NormalizedOpportunity = {
	title: string;
	slug: string;
	summary: string | null;
	description: string | null;
	applicationUrl: string;
	sourceUrl: string;
	applicationDeadline: Date | null;
	externalId: string;
	sourceType: 'api' | 'scrape';
	sourceName: string;
	postedAt: Date | null;
	status: 'active' | 'closed' | 'expired';
	category: { slug: string; name: string };
	compensationText: string | null;
};

// Date-only deadlines stay open through the whole day.
function endOfUtcDay(year: number, monthIndex: number, day: number): Date | null {
	const date = new Date(Date.UTC(year, monthIndex, day, 23, 59, 59, 999));
	return date.getUTCMonth() === monthIndex && date.getUTCDate() === day ? date : null;
}

const statusFor = (deadline: Date | null, now: Date): 'active' | 'expired' =>
	deadline && deadline.getTime() < now.getTime() ? 'expired' : 'active';

function parseGrantsGovDate(value: unknown, field: string): Date | null {
	if (value === undefined || value === null || value === '') return null;
	if (typeof value !== 'string') throw new Error(`Grants.gov ${field} must be a date string.`);

	const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
	if (!match) throw new Error(`Grants.gov ${field} has an invalid date: ${value}.`);
	const [, month, day, year] = match;
	const date = endOfUtcDay(Number(year), Number(month) - 1, Number(day));
	if (!date) throw new Error(`Grants.gov ${field} has an invalid calendar date: ${value}.`);
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

	const applicationDeadline = parseGrantsGovDate(record.closeDate, 'closeDate');
	const rawStatus = typeof record.oppStatus === 'string' ? record.oppStatus.toLowerCase() : '';
	const status = rawStatus === 'closed' || rawStatus === 'archived' ? 'closed' : statusFor(applicationDeadline, now);
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
		category: { slug: 'grant', name: 'Grant' },
		compensationText: null,
	};
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Scholarships360 shows deadlines like "Jul 31, 2027"; anything else ("Rolling") has no fixed deadline.
function parseScholarships360Deadline(value: string | undefined): Date | null {
	const match = /^([a-z]{3})[a-z]* (\d{1,2}), (\d{4})$/i.exec(value ?? '');
	if (!match) return null;
	const month = MONTHS.indexOf(match[1]!.toLowerCase());
	return month < 0 ? null : endOfUtcDay(Number(match[3]), month, Number(match[2]));
}

export function normalizeScholarships360(raw: RawOpportunity, now = new Date()): NormalizedOpportunity {
	const applicationDeadline = parseScholarships360Deadline(raw.deadline);
	return {
		title: raw.title.trim(),
		// The external ID is a SHA-256 hex digest, so its prefix is already slug-safe and unique.
		slug: `${raw.sourceName}-${raw.externalId.slice(0, 16)}`,
		summary: null,
		description: raw.description?.trim() || null,
		applicationUrl: raw.applicationUrl,
		sourceUrl: raw.sourceUrl,
		applicationDeadline,
		externalId: raw.externalId,
		sourceType: raw.sourceType,
		sourceName: raw.sourceName,
		postedAt: null,
		status: statusFor(applicationDeadline, now),
		category: { slug: 'scholarship', name: 'Scholarship' },
		compensationText: raw.compensation?.trim() || null,
	};
}

// Devpost shows submission windows like "Oct 20 - Nov 25, 2026", "Dec 30, 2026 - Jan 02, 2027",
// "Nov 04 - 06, 2026", or a single "Nov 04, 2026". The deadline is the end of the window.
function parseDevpostDeadline(value: string | undefined): Date | null {
	if (!value) return null;
	const parts = value.split(/\s+[-–]\s+/);
	const start = parts[0]!.trim();
	const end = parts[parts.length - 1]!.trim();

	const full = /^([a-z]{3})[a-z]* (\d{1,2}), (\d{4})$/i.exec(end);
	if (full) {
		const month = MONTHS.indexOf(full[1]!.toLowerCase());
		return month < 0 ? null : endOfUtcDay(Number(full[3]), month, Number(full[2]));
	}

	// End has no month ("06, 2026"), so borrow the month from the start.
	const dayOnly = /^(\d{1,2}), (\d{4})$/.exec(end);
	const startMonth = /^([a-z]{3})/i.exec(start);
	if (!dayOnly || !startMonth) return null;
	const month = MONTHS.indexOf(startMonth[1]!.toLowerCase());
	return month < 0 ? null : endOfUtcDay(Number(dayOnly[2]), month, Number(dayOnly[1]));
}

export function normalizeDevpost(raw: RawOpportunity, now = new Date()): NormalizedOpportunity {
	const applicationDeadline = parseDevpostDeadline(raw.deadline);
	return {
		title: raw.title.trim(),
		slug: `devpost-${raw.externalId.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}`,
		summary: null,
		description: raw.description?.trim() || null,
		applicationUrl: raw.applicationUrl,
		sourceUrl: raw.sourceUrl,
		applicationDeadline,
		externalId: raw.externalId,
		sourceType: raw.sourceType,
		sourceName: raw.sourceName,
		postedAt: null,
		status: statusFor(applicationDeadline, now),
		category: { slug: 'hackathon', name: 'Hackathon' },
		compensationText: raw.compensation?.trim() || null,
	};
}
