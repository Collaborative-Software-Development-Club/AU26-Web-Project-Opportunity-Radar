# Architecture

This repository contains runnable web/mobile placeholder screens and an Express process health endpoint. Product features and data integrations remain placeholders.

- `apps/web`: React web interface with Clerk authentication.
- `apps/mobile`: React Native / Expo interface with Clerk authentication.
- `apps/api`: Express HTTP API; verifies Clerk sessions and authorizes data access.
- `apps/ingestion`: background imports and targeted scrapers.
- `packages/database`: server-only Neon connection, Drizzle schema, migrations, and seeds.
- `packages/contracts`: public request/response types and validation schemas.
- `packages/api-client`: shared HTTP requests; each frontend supplies its Clerk token getter.
- `packages/config`: shared TypeScript configuration.

Web and mobile call Express. Only Express and ingestion access Neon.
Clerk owns credentials and sessions; application data references Clerk user IDs.
Sponsor organizations are product entities, independent of Clerk Organizations.
Optional Clerk webhooks are reserved for lifecycle synchronization; they are not implemented.
Keep eligibility decisions separate from relevance ranking when adding recommendations.

## Environment configuration

Local backend tools share the repository-root `.env` (template: `.env.example`). The API uses database, Clerk, port, and origin settings; ingestion and Drizzle tooling need only DATABASE_URL. Web uses `apps/web/.env`; mobile uses `apps/mobile/.env`, both containing public configuration only. See the README for the complete variable map. The API loads the root file and validates its port and origins. Root-file loading for ingestion and Drizzle remains a TODO. Clerk and database credentials are not used by the startup scaffolds.
