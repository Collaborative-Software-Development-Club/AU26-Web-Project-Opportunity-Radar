# V1 data model

The implemented schema lives in `packages/database/src/schema/`, with generated
SQL migrations in `packages/database/drizzle/`. See the root README for setup and
migration commands.

| Tables | Relationship / purpose |
| --- | --- |
| users | Internal UUID, unique Clerk ID and email |
| organizations → opportunities | One-to-many; organization optional; no delete cascade |
| opportunities → opportunity_compensation | Zero or one compensation row; unique opportunity ID; cascade delete |
| categories / opportunity_categories | Many-to-many opportunity classification |
| locations / opportunity_locations | Many-to-many geographic associations |
| fields / opportunity_fields | Many-to-many academic/professional fields |
| education_levels / opportunity_education_levels | Many-to-many education eligibility; no education slug |
| saved_opportunities | User bookmarks; composite user/opportunity primary key |

All junctions have composite primary keys and cascade when the opportunity is
deleted; bookmarks also cascade when their user is deleted. Referenced lookup rows
cannot be deleted. Opportunities store source URLs and provenance directly; there
is no separate V1 sources table. Non-null source-name/external-ID pairs are unique.
Compensation is stored only in its own table. Unknown values stay nullable.

Drizzle relations are defined in `src/schema/relations.ts`. `updated_at` has an
insert default only; updates must set it explicitly. Repeatable seeds live in `packages/database/seeds/index.ts`; see README for development fixtures and reference-only mode.
