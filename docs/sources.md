# Opportunity sources

For each future source, document its URL, access method (API or scraping), terms and rate limits, source identifier, refresh schedule, field mapping, and deduplication strategy. Preserve the original opportunity URL and retrieval timestamp.

Run a source with `npm run ingest -w @radar/ingestion -- <source> [options]`. Every source normalizes into one `NormalizedOpportunity` shape (`src/pipeline/normalize.ts`) and is written by the shared loader `loadOpportunities` (`src/pipeline/persist.ts`). The loader upserts on `(source_name, external_id)`, keeps `first_seen_at`, refreshes `last_verified_at`, links the source's category, stores pay text in `opportunity_compensation.raw_text`, and marks that source's past-deadline rows `expired`. Date-only deadlines are stored as the end of that day (UTC).

## Grants.gov

- **Source name:** `grants-gov`
- **Access Method:** Grants.gov `search2` API (`POST https://api.grants.gov/v1/api/search2`), posted and forecasted opportunities only.
- **Run:** `npm run ingest -w @radar/ingestion -- grants-gov --keywords=health,education` (or `GRANTS_GOV_KEYWORDS`), or `--no-keyword --max-results=N`.
- **Category:** Grant.
- **Category:** Scholarship.

- **Dedup Strategy:** Grants.gov opportunity ID as `external_id`.

## Scholarships360

- **Source name:** `scholarships360`

- **Run:** `npm run ingest -w @radar/ingestion -- scholarships360`

- **URL:** <https://scholarships360.org/scholarships/top-ohio-scholarships/?sidebar_sort=relevant&current_page=1&filter=college_and_grad>

- **Access Method:** Node's fetch to get HTML content, then Cheerio on the HTML

- **Rate Limit:** 1-second wait for pages after the first, limit of 3 pages.

- **Field Mapping:**

| Field | Source |
| -------------- | -------------- |
| title | `h4 a` text |
| description | `.re-scholarship-card-main .re-text p` text, removed show more dropdown |
| deadline | value of the `.re-scholarship-card-info` box whose name is `Deadline`; `Open Date`/`Expected Open Date` are ignored and `Rolling` means no deadline |
| location | N/A |
| workMode | N/A |
| applicationUrl | `h4 a` href, made absolute |
| compensation | first value of `.re-scholarship-card-info-value` |

- **Dedup Strategy:** SHA-256 hash of scholarships360 plus the scholarships application url lowercased

## Devpost

- **Source name:** `devpost`

- **Run:** `npm run ingest -w @radar/ingestion -- devpost`

- **URL:** <https://devpost.com/api/hackathons?page=1&status[]=upcoming&status[]=open&order_by=deadline>

- **Access Method:** Node's fetch to get JSON from Devpost's public hackathons API (not the HTML page at <https://devpost.com/hackathons>), then `JSON.parse`. Cheerio is only used to strip the HTML wrapper from the prize amount.

- **Rate Limit:** 1-second wait for pages after the first, limit of 5 pages. Paging stops early when Devpost returns an empty page. A response that isn't Devpost's JSON throws, so a blocked run fails instead of looking empty.

- **Field Mapping:**

| Field | Source |
| -------------- | -------------- |
| title | `title`, trimmed |
| description | `organization_name` ("Hosted by ..."), `displayed_location.location`, "Invite only" when `invite_only` is true, and `themes[].name` ("Themes: ..."), joined with ` · ` |
| deadline | `submission_period_dates` passed through as raw text (e.g. `Oct 20 - Nov 25, 2026`); normalization uses the end of the window as the deadline |
| location | N/A (only appears in the description text) |
| workMode | N/A |
| applicationUrl | `url` |
| compensation | `prize_amount` with the HTML stripped, plus ` in prizes`; left empty when the amount has no non-zero digit |

- **Filtering:** Hackathons with `open_state` of `ended` are skipped, as are records missing an `id`, `title`, or `url`. Duplicates across pages are collapsed by ID.

- **Dedup Strategy:** Devpost's hackathon `id` as a string, so repeated runs update existing rows instead of inserting new ones