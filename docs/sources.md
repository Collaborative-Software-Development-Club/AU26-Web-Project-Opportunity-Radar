# Opportunity sources

No live scrapers or import adapters are implemented.

For each future source, document its URL, access method (API or scraping), terms and rate limits, source identifier, refresh schedule, field mapping, and deduplication strategy. Preserve the original opportunity URL and retrieval timestamp.

## Scholarships360

- URL: <https://scholarships360.org/scholarships/top-ohio-scholarships/?sidebar_sort=relevant&current_page=1&filter=college_and_grad>

- Access Method: Node's fetch to get HTML content, then Cheerio on the HTML

- Rate Limit: 1-second wait for pages after the first, limit of 3 pages.

- Field Mapping:

| Field | Source |
| -------------- | -------------- |
| title | `h4 a` text |
| description | `.re-scholarship-card-main .re-text p` text, removed show more dropdown |
| deadline | second value of `.re-scholarship-card-info-value` |
| location | N/A |
| workMode | N/A |
| applicationUrl | `h4 a` href, made absolute |
| compensation | first value of `.re-scholarship-card-info-value` |

- Dedup Strategy: SHA-256 hash of scholarships360 plus the scholarships application url lowercased
