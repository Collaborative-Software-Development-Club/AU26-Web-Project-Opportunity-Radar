export interface RawOpportunity {
    sourceType: 'scrape' | 'api';
    sourceName: string;
    sourceUrl: string;
    externalId: string;
    title: string;
    organization?: string;
    description?: string;
    deadline?: string;
    location?: string;
    workMode?: string;
    applicationUrl: string;
    compensation?: string;
}

export interface Scraper {
    readonly sourceName: string;
    fetch(): Promise<RawOpportunity[]>;
}