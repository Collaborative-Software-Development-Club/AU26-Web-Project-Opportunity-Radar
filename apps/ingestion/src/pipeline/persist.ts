import { and, eq, isNull, lt, sql } from 'drizzle-orm';
import type { NormalizedCompensation, NormalizedLocation, NormalizedOpportunity, NormalizedOrganization } from './normalize';

export type LoadCounts = { inserted: number; updated: number; failed: number };

export type CompensationWrite = Partial<NormalizedCompensation> & { rawText: string | null };

export type OpportunityStore = {
	ensureOrganization(organization: NormalizedOrganization): Promise<string>;
	upsert(opportunity: NormalizedOpportunity, now: Date, organizationId?: string): Promise<{ id: string; inserted: boolean }>;
	attachCategory(opportunityId: string, category: NormalizedOpportunity['category']): Promise<void>;
	replaceLocations(opportunityId: string, locations: NormalizedLocation[]): Promise<void>;
	setCompensation(opportunityId: string, compensation: CompensationWrite, now: Date): Promise<void>;
	expireOverdue(sourceName: string, now: Date): Promise<number>;
};

async function createDatabaseStore(): Promise<OpportunityStore> {
	const {
		db, categories, locations, opportunityCategories, opportunityCompensation, opportunityLocations, opportunities, organizations,
	} = await import('@radar/database');
	return {
		async ensureOrganization({ name, slug }) {
			const findId = async () => (await db.select({ id: organizations.id }).from(organizations)
				.where(eq(organizations.slug, slug)).limit(1))[0]?.id;
			const id = await findId()
				?? (await db.insert(organizations).values({ name, slug }).onConflictDoNothing({ target: organizations.slug })
					.returning({ id: organizations.id }))[0]?.id
				?? await findId();
			if (!id) throw new Error(`Could not ensure the ${slug} organization row.`);
			return id;
		},

		async upsert({
			category: _category, compensationText: _compensationText, organization: _organization, locations: _locations,
			compensation: _compensation, ...opportunity
		}, now, organizationId) {
			const existing = await db.select({ id: opportunities.id }).from(opportunities)
				.where(and(
					eq(opportunities.sourceName, opportunity.sourceName),
					eq(opportunities.externalId, opportunity.externalId),
				)).limit(1);

			const [row] = await db.insert(opportunities).values({
				...opportunity,
				organizationId,
				firstSeenAt: now,
				lastVerifiedAt: now,
				updatedAt: now,
			}).onConflictDoUpdate({
				target: [opportunities.sourceName, opportunities.externalId],
				targetWhere: sql`${opportunities.sourceName} IS NOT NULL AND ${opportunities.externalId} IS NOT NULL`,
				set: {
					title: opportunity.title,
					slug: opportunity.slug,
					summary: opportunity.summary,
					description: opportunity.description,
					applicationUrl: opportunity.applicationUrl,
					sourceUrl: opportunity.sourceUrl,
					applicationDeadline: opportunity.applicationDeadline,
					sourceType: opportunity.sourceType,
					postedAt: opportunity.postedAt,
					status: opportunity.status,
					// Only sources that supply these overwrite them; undefined keeps what is stored.
					...(organizationId === undefined ? {} : { organizationId }),
					...(opportunity.workMode === undefined ? {} : { workMode: opportunity.workMode }),
					lastVerifiedAt: now,
					updatedAt: now,
				},
			}).returning({ id: opportunities.id });

			if (!row) throw new Error('Database did not return the persisted opportunity.');
			return { id: row.id, inserted: existing.length === 0 };
		},

		async attachCategory(opportunityId, { slug, name }) {
			const findId = async () => (await db.select({ id: categories.id }).from(categories)
				.where(eq(categories.slug, slug)).limit(1))[0]?.id;
			// Look up before inserting: a conflicting INSERT still burns a smallserial id, so inserting per record ran ids into the thousands.
			// The second lookup covers another run creating the category between our lookup and insert.
			const categoryId = await findId()
				?? (await db.insert(categories).values({ name, slug })
					.onConflictDoNothing({ target: categories.slug })
					.returning({ id: categories.id }))[0]?.id
				?? await findId();
			if (categoryId === undefined) throw new Error(`Could not ensure the ${slug} category lookup row.`);

			await db.insert(opportunityCategories).values({ opportunityId, categoryId }).onConflictDoNothing();
		},

		async replaceLocations(opportunityId, wanted) {
			const ids = new Set<string>();
			for (const location of wanted) {
				const match = (column: typeof locations.city | typeof locations.stateRegion | typeof locations.countryCode, value: string | null) =>
					value === null ? isNull(column) : eq(column, value);
				// shortcut: locations has no unique key, so two concurrent runs could each insert the same place; add one if ingest runs in parallel.
				const existing = (await db.select({ id: locations.id }).from(locations).where(and(
					match(locations.city, location.city),
					match(locations.stateRegion, location.stateRegion),
					match(locations.countryCode, location.countryCode),
					eq(locations.country, location.country),
				)).limit(1))[0]?.id;
				ids.add(existing ?? (await db.insert(locations).values(location).returning({ id: locations.id }))[0]!.id);
			}
			// Replace rather than append, so a posting that drops a city stops matching it.
			await db.delete(opportunityLocations).where(eq(opportunityLocations.opportunityId, opportunityId));
			if (ids.size) {
				await db.insert(opportunityLocations).values([...ids].map(locationId => ({ opportunityId, locationId })))
					.onConflictDoNothing();
			}
		},

		async setCompensation(opportunityId, compensation, now) {
			await db.insert(opportunityCompensation).values({ opportunityId, ...compensation })
				.onConflictDoUpdate({ target: opportunityCompensation.opportunityId, set: { ...compensation, updatedAt: now } });
		},

		async expireOverdue(sourceName, now) {
			const rows = await db.update(opportunities).set({ status: 'expired', updatedAt: now })
				.where(and(
					eq(opportunities.sourceName, sourceName),
					eq(opportunities.status, 'active'),
					lt(opportunities.applicationDeadline, now),
				)).returning({ id: opportunities.id });
			return rows.length;
		},
	};
}

// Shared by every source: upsert on (sourceName, externalId), link organization/category/locations, keep pay, expire overdue rows.
export async function loadOpportunities(
	sourceName: string,
	records: NormalizedOpportunity[],
	store?: OpportunityStore,
	now = new Date(),
	onFailure?: (record: NormalizedOpportunity | null, error: unknown) => void,
): Promise<LoadCounts> {
	const persistence = store ?? await createDatabaseStore();
	const counts: LoadCounts = { inserted: 0, updated: 0, failed: 0 };

	for (const record of records) {
		try {
			const organizationId = record.organization ? await persistence.ensureOrganization(record.organization) : undefined;
			const result = await persistence.upsert(record, now, organizationId);
			await persistence.attachCategory(result.id, record.category);
			if (record.locations) await persistence.replaceLocations(result.id, record.locations);
			if (record.compensation || record.compensationText) {
				await persistence.setCompensation(result.id, { ...record.compensation, rawText: record.compensationText }, now);
			}
			if (result.inserted) counts.inserted += 1;
			else counts.updated += 1;
		} catch (error) {
			counts.failed += 1;
			onFailure?.(record, error);
		}
	}

	try {
		counts.updated += await persistence.expireOverdue(sourceName, now);
	} catch (error) {
		counts.failed += 1;
		onFailure?.(null, error);
	}

	return counts;
}
