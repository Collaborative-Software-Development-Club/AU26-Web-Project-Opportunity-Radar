import * as cheerio from 'cheerio';
import { FREEHIRE_SOURCE_NAME, type FreehireRecord } from '../sources/freehire';
import { GRANTS_GOV_SOURCE_NAME, type GrantsGovSearchHit } from '../sources/grants-gov';
import type { RawOpportunity } from '../sources/types';

export type NormalizedOrganization = { name: string; slug: string };
export type NormalizedLocation = { city: string | null; stateRegion: string | null; country: string; countryCode: string | null };
export type NormalizedCompensation = {
	compensationType: 'pay';
	isPaid: boolean;
	minAmount: string | null;
	maxAmount: string | null;
	currency: string;
	period: 'hour' | 'day' | 'month' | 'year';
};

// The one shape every source hands to the loader: an opportunities row plus its category and pay text.
// The optional fields are left undefined by sources that cannot supply them, so the loader leaves existing values alone.
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
	organization?: NormalizedOrganization | null;
	workMode?: 'remote' | 'hybrid' | 'onsite' | null;
	locations?: NormalizedLocation[];
	compensation?: NormalizedCompensation | null;
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

const FREEHIRE_CATEGORIES = {
	internship: { slug: 'internship', name: 'Internship' },
	'new-grad': { slug: 'new-grad', name: 'New Grad' },
} as const;

const freehireText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const freehireStrings = (value: unknown): string[] =>
	Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map(item => item.trim()) : [];

// Stored locations use full state names ("Ohio"), and the API's location filter matches on them.
const US_STATES: Record<string, string> = {
	AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
	DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
	IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
	MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
	NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
	NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
	PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
	UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
const US_STATE_NAMES = new Map(Object.values(US_STATES).map(name => [name.toLowerCase(), name]));
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

// "Austin, TX USA", "Austin, TX, US" and "Austin, Texas, United States" all name the state right after the city.
function usState(display: string, city: string): string | null {
	const escaped = city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const after = new RegExp(`${escaped},\\s*([^,;]+)`).exec(display)?.[1]?.replace(/\s+(USA|US)$/, '').trim() ?? '';
	return US_STATES[after] ?? US_STATE_NAMES.get(after.toLowerCase()) ?? null;
}

// Freehire gives canonical cities and ISO countries; the state only appears in the display string ("Austin, TX USA").
function freehireLocations(job: FreehireRecord['job']): NormalizedLocation[] {
	const codes = freehireStrings(job.countries).map(code => code.toUpperCase()).filter(code => /^[A-Z]{2}$/.test(code));
	const country = (code: string) => countryNames.of(code) ?? code;
	const cities = freehireStrings(job.cities);
	// shortcut: a multi-country posting doesn't say which city is in which country, so it keeps countries only; match cities via `metros` if non-US searches are added.
	if (!cities.length || codes.length !== 1) return codes.map(code => ({ city: null, stateRegion: null, country: country(code), countryCode: code }));
	const code = codes[0]!;
	const display = freehireText(job.location);
	return cities.map(city => ({ city, stateRegion: code === 'US' ? usState(display, city) : null, country: country(code), countryCode: code }));
}

const FREEHIRE_PERIODS = new Set(['hour', 'day', 'month', 'year']);
// numeric(12, 2) holds up to 10 digits before the point.
const validAmount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1e10;

// Returns structured pay plus display text, or nulls when the enrichment is missing or malformed (the job still loads).
function freehireCompensation(enrichment: unknown): { compensation: NormalizedCompensation | null; text: string | null } {
	const none = { compensation: null, text: null };
	if (!enrichment || typeof enrichment !== 'object') return none;
	const { salary_min: min, salary_max: max, salary_currency: rawCurrency, salary_period: period } = enrichment as Record<string, unknown>;
	const currency = freehireText(rawCurrency).toUpperCase();
	const hasMin = validAmount(min);
	const hasMax = validAmount(max);
	if ((!hasMin && !hasMax) || (hasMin && hasMax && min > max)) return none;
	if (!/^[A-Z]{3}$/.test(currency) || typeof period !== 'string' || !FREEHIRE_PERIODS.has(period)) return none;

	const money = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2, minimumFractionDigits: 0 });
	const range = hasMin && hasMax ? (min === max ? money.format(min) : `${money.format(min)}–${money.format(max)}`)
		: hasMin ? `From ${money.format(min)}` : `Up to ${money.format(max as number)}`;
	return {
		compensation: {
			compensationType: 'pay',
			isPaid: true,
			minAmount: hasMin ? min.toFixed(2) : null,
			maxAmount: hasMax ? max.toFixed(2) : null,
			currency,
			period: period as NormalizedCompensation['period'],
		},
		text: `${range}/${period}`,
	};
}

function freehireOrganization(job: FreehireRecord['job']): NormalizedOrganization | null {
	const name = freehireText(job.company).slice(0, 255);
	if (!name) return null;
	const given = freehireText(job.company_slug).toLowerCase();
	const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(given) ? given : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	return slug ? { name, slug: slug.slice(0, 255) } : null;
}

export function normalizeFreehire({ kind, job }: FreehireRecord): NormalizedOpportunity {
	const publicSlug = freehireText(job.public_slug);
	const title = freehireText(job.title);
	const url = freehireText(job.url);
	if (!publicSlug) throw new Error('Freehire job is missing its public_slug.');
	if (!title) throw new Error(`Freehire job ${publicSlug} is missing its title.`);
	// The URL is rendered as a link for users, so only http(s) gets through.
	if (!/^https?:$/.test(URL.parse(url)?.protocol ?? '')) throw new Error(`Freehire job ${publicSlug} has an invalid url.`);

	const postedAt = typeof job.posted_at === 'string' ? new Date(job.posted_at) : null;
	// Search returns a truncated HTML preview; store it as plain text like the other sources.
	const description = typeof job.description === 'string' ? cheerio.load(job.description).text().trim() : '';
	const pay = freehireCompensation(job.enrichment);
	const workMode = job.work_mode === 'remote' || job.work_mode === 'hybrid' || job.work_mode === 'onsite' ? job.work_mode : null;

	return {
		title,
		slug: `${FREEHIRE_SOURCE_NAME}-${publicSlug.toLowerCase()}`,
		summary: null,
		description: description || null,
		applicationUrl: url,
		sourceUrl: `https://freehire.me/jobs/${encodeURIComponent(publicSlug)}`,
		applicationDeadline: null,
		externalId: publicSlug,
		sourceType: 'api',
		sourceName: FREEHIRE_SOURCE_NAME,
		postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
		status: job.closed_at ? 'closed' : 'active',
		category: FREEHIRE_CATEGORIES[kind],
		compensationText: pay.text,
		organization: freehireOrganization(job),
		workMode,
		locations: freehireLocations(job),
		compensation: pay.compensation,
	};
}
