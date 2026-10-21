import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { Scraper, RawOpportunity } from './types';
import { politeFetch } from './politeFetch';

/**
 * Scraper that extracts scholarship opportunities from Scholarships360.
 */
export class Scholarships360Scraper implements Scraper {
    readonly sourceName = 'scholarships360';
    private readonly sourceUrl = 'https://scholarships360.org/scholarships/top-ohio-scholarships/';

    /**
     * Scrapes scholarship opportunities across multiple (up to 3) pages.
     * @returns an array of RawOpportunity objects representing the scraped scholarships.
     */
    async fetch(): Promise<RawOpportunity[]> {
        // Array to hold all scraped opportunities
        const opportunities: RawOpportunity[] = [];
        for (let page = 1; page <= 3; page++) {
            const pageUrl = `${this.sourceUrl}?sidebar_sort=relevant&current_page=${page}&filter=college_and_grad`;
            // Fetch the HTML content of the page
            const html = await politeFetch(pageUrl);
            // Find the scholarship cards in the fetched HTML
            const pageOpportunities = parseScholarships360(html, pageUrl);
            if (pageOpportunities.length === 0) {
                break;
            }
            // Add the scraped opportunities from this page to the main array
            opportunities.push(...pageOpportunities);
        }
        return opportunities;
    }
}

/**
 * Parses the HTML content of a Scholarships360 page to extract scholarship opportunities.
 * @param html The HTML content of the page.
 * @param url The URL of the page.
 * @returns An array of RawOpportunity objects representing the scraped scholarships.
 */
export function parseScholarships360(html: string, url: string): RawOpportunity[] {
    // Load the HTML content into Cheerio for parsing
    const $ = cheerio.load(html);
    const scholarships: RawOpportunity[] = [];
    // Iterate over each scholarship card found in the HTML
    $('.re-scholarship-card').each((index, element) => {
        const $card = $(element);
        // Remove any tooltip elements that might interfere with extracting the title
        $card.find('.re-verified_title-tooltip').remove();
        // Extract the title and application URL from the card
        const title = $card.find('h4 a').text().trim();
        let appURL = $card.find('h4 a').attr('href');
        // Skip invalid cards
        if(!title || !appURL) {
            return;
        }
        // Ensure the application URL is absolute; if not, construct it relative to the page URL
        if(!appURL.startsWith('http')) {
            appURL = new URL(appURL, url).toString();
        }   
        // Extract the amount and deadline information from the card
        const $info = $card.find('.re-scholarship-card-info');
        const amount = $info.eq(0).find('.re-scholarship-card-info-value').text().trim() || undefined;
        const deadline = $info.eq(1).find('.re-scholarship-card-info-value').text().trim() || undefined;
        // Extract the description from the card
        const $d = $card.find('.re-scholarship-card-main-hidden .re-text p').clone();
        const description = $d.text().replace(/\s+/g, ' ').trim() || undefined;
        // Create a RawOpportunity object and add it to the scholarships array
        scholarships.push({
            sourceType: 'scrape',
            sourceName: 'scholarships360',
            sourceUrl: url,
            externalId: generateExternalId('scholarships360', appURL),
            title,
            description,
            deadline,
            compensation: amount,
            applicationUrl: appURL
        });
    });
    return scholarships;
}

/**
 * Generates a unique external ID for a scholarship based on its source and application URL.
 * @param sourceName The name of the source.
 * @param appUrl The application URL of the scholarship.
 * @returns A unique external ID.
 */
function generateExternalId(sourceName: string, appUrl: string): string {
    return crypto
    .createHash('sha256')
    .update(`${sourceName}:${appUrl.toLowerCase()}`)
    .digest('hex');
}
