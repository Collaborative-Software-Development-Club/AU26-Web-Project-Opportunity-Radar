import * as cheerio from 'cheerio';
import { Scraper, RawOpportunity } from './types';
import { politeFetch } from './politeFetch';

const SOURCE_NAME = 'devpost';
const API_URL = 'https://devpost.com/api/hackathons';
const MAX_PAGES = 5;

/** The subset of Devpost's hackathon JSON that we use. */
type DevpostHackathon = {
    id?: number;
    title?: string;
    url?: string;
    open_state?: string;               // "open" | "upcoming" | "ended"
    submission_period_dates?: string;  // e.g. "Oct 20 - Nov 25, 2026"
    prize_amount?: string;             // e.g. "$<span data-currency-value>10,000</span>"
    organization_name?: string;
    displayed_location?: { location?: string };
    themes?: { name?: string }[];
    invite_only?: boolean;
};

type PageFetcher = (url: string) => Promise<string>;

/**
 * Returns how many hackathons Devpost listed on this page, before any filtering.
 * Throws if the body isn't Devpost's JSON, so a block page fails the run instead of looking like "no results".
 */
function countHackathons(body: string): number {
    let parsed: { hackathons?: unknown };
    try {
        parsed = JSON.parse(body);
    } catch {
        throw new Error(`Devpost response was not JSON (starts with: ${body.slice(0, 80)})`);
    }
    if (!Array.isArray(parsed.hackathons)) {
        throw new Error('Devpost response had no "hackathons" array');
    }
    return parsed.hackathons.length;
}

/**
 * Scraper that extracts hackathons from Devpost's public JSON endpoint.
 */
export class DevpostScraper implements Scraper {
    readonly sourceName = SOURCE_NAME;
    private readonly fetchPage: PageFetcher;

    // The fetcher is injectable so tests can feed pages without touching the network.
    constructor(fetchPage: PageFetcher = politeFetch) {
        this.fetchPage = fetchPage;
    }

    async fetch(): Promise<RawOpportunity[]> {
        // Keyed by ID because the list shifts between page requests and can repeat a hackathon.
        const byId = new Map<string, RawOpportunity>();
        for (let page = 1; page <= MAX_PAGES; page++) {
            const pageUrl = `${API_URL}?page=${page}&status[]=upcoming&status[]=open&order_by=deadline`;
            const body = await this.fetchPage(pageUrl);
            // Stop on Devpost's own empty page, not on a page that filtered down to nothing.
            if (countHackathons(body) === 0) {
                break;
            }
            for (const opportunity of parseDevpost(body, pageUrl)) {
                byId.set(opportunity.externalId, opportunity);
            }
        }
        return [...byId.values()];
    }
}

/**
 * Parses a Devpost API response body into RawOpportunity objects.
 * @param body The JSON response text.
 * @param url The URL that was requested.
 */
export function parseDevpost(body: string, url: string): RawOpportunity[] {
    let hackathons: DevpostHackathon[];
    try {
        hackathons = JSON.parse(body).hackathons ?? [];
    } catch {
        return [];
    }

    const results: RawOpportunity[] = [];
    for (const h of hackathons) {
        const title = h.title?.trim();
        if (!h.id || !title || !h.url) continue;
        if (h.open_state === 'ended') continue;

        // Devpost API wraps the amount in HTML; strip it down to text like "$10,000".
        const prizeText = h.prize_amount
            ? cheerio.load(`<p>${h.prize_amount}</p>`)('p').text().trim()
            : '';
        const hasPrize = /[1-9]/.test(prizeText);

        const themes = (h.themes ?? []).map(t => t.name).filter(Boolean).join(', ');
        const description = [
            h.organization_name && `Hosted by ${h.organization_name}`,
            h.displayed_location?.location,
            h.invite_only && 'Invite only',
            themes && `Themes: ${themes}`,
        ].filter(Boolean).join(' · ') || undefined;

        results.push({
            sourceType: 'api',
            sourceName: SOURCE_NAME,
            sourceUrl: url,
            externalId: String(h.id),
            title,
            description,
            deadline: h.submission_period_dates,
            compensation: hasPrize ? `${prizeText} in prizes` : undefined,
            applicationUrl: h.url,
        });
    }
    return results;
}