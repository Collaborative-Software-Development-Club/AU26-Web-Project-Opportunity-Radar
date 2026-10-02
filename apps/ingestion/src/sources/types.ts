export interface RawOpportunity {
    sourceType: 'scrape' | 'api';
    sourceName: string;
    sourceUrl: string;
    externalId: string;
    title: string;
    applicationUrl: string;
    amount?: string;
    deadline?: string;
}

export interface Scraper {
    readonly sourceName: string;
    fetch(): Promise<RawOpportunity[]>;
}