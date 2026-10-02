import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { Scraper, RawOpportunity } from './types';

export class Scholarships360Scraper implements Scraper {
    readonly sourceName = 'scholarships360';
    private readonly sourceUrl = 'https://scholarships360.org/scholarships/top-ohio-scholarships/?sidebar_sort=relevant&current_page=1&filter=college_and_grad';

    async fetch(): Promise<RawOpportunity[]> {
        const opportunities: RawOpportunity[] = [];
        for (let page = 1; page <= 3; page++) {
            const pageUrl = `${this.sourceUrl}?sidebar_sort=relevant&current_page=${page}&filter=college_and_grad`;
            if (page > 1) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            const response = await fetch(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch ${pageUrl}: ${response.status} ${response.statusText}`);
            }
            const html = await response.text();
            const pageOpportunities = parseScholarships360(html, pageUrl);
            if (pageOpportunities.length === 0) {
                break;
            }
            opportunities.push(...pageOpportunities);
        }
        return opportunities;
    }
}

export function parseScholarships360(html: string, url: string): RawOpportunity[] {
    const $ = cheerio.load(html);
    const scholarships: RawOpportunity[] = [];
    $('.re-scholarship-card').each((index, element) => {
        const $card = $(element);
        $card.find('.re-verified_title-tooltip').remove();
        const title = $card.find('h4 a').text().trim();
        let appURL = $card.find('h4 a').attr('href');
        if(!title || !appURL) {
            return;
        }
        if(!appURL.startsWith('http')) {
            appURL = new URL(appURL, url).toString();
        }   
        const $info = $card.find('.re-scholarship-card-info_mob');
        const amount = $info.eq(0).find('.re-scholarship-card-info_mob-value').text().trim() || undefined;
        const deadline = $info.eq(1).find('.re-scholarship-card-info_mob-value').text().trim() || undefined;
        scholarships.push({
            sourceType: 'scrape',
            sourceName: 'scholarships360',
            sourceUrl: url,
            externalId: generateExternalId('scholarships360', title, appURL),
            title,
            applicationUrl: appURL,
            amount,
            deadline
        });
    });
    return scholarships;
}

function generateExternalId(sourceName: string, title: string, appUrl: string): string {
    return crypto
    .createHash('sha256')
    .update(`${sourceName}:${appUrl.toLowerCase()}:${title.toLowerCase().trim()}`)
    .digest('hex');
}
