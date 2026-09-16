# Planned data model

No Drizzle tables or migrations exist yet; schema files are placeholders.

| Table | Purpose |
| --- | --- |
| users | Internal user ID, unique Clerk user ID, application metadata |
| organizations | Opportunity sponsors |
| opportunities | Titles, descriptions, links, deadlines, locations, organization/source references |
| categories | Supported opportunity categories |
| opportunity_categories | Many-to-many classification |
| saved_opportunities | User/opportunity pairs; enforce uniqueness |
| sources | Source URLs and provenance |

Plan foreign keys and deletion behavior explicitly. Use a unique source/external-ID pair to support repeatable imports. Unknown eligibility or deadlines should remain unknown rather than be inferred.
