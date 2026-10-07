import { and, eq, lt, sql } from 'drizzle-orm';
import type { NormalizedOpportunity } from './normalize';

export type PersistenceCounts = { inserted: number; updated: number; failed: number };

export type OpportunityPersistence = {
	upsert(opportunity: NormalizedOpportunity, now: Date): Promise<{ id: string; inserted: boolean }>;
	attachGrantCategory(opportunityId: string): Promise<void>;
	expireOverdue(now: Date): Promise<number>;
};

async function createDatabasePersistence(): Promise<OpportunityPersistence> {
	const { db, categories, opportunityCategories, opportunities } = await import('@radar/database');
	return {
		async upsert(opportunity, now) {
			const existing = await db.select({ id: opportunities.id }).from(opportunities)
				.where(and(
					eq(opportunities.sourceName, opportunity.sourceName),
					eq(opportunities.externalId, opportunity.externalId),
				)).limit(1);

			const [row] = await db.insert(opportunities).values({
				...opportunity,
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
					lastVerifiedAt: now,
					updatedAt: now,
				},
			}).returning({ id: opportunities.id });

			if (!row) throw new Error('Database did not return the persisted opportunity.');
			return { id: row.id, inserted: existing.length === 0 };
		},

		async attachGrantCategory(opportunityId) {
			const [category] = await db.insert(categories).values({ name: 'Grant', slug: 'grant' })
				.onConflictDoNothing({ target: categories.slug })
				.returning({ id: categories.id });
			const categoryId = category?.id ?? (await db.select({ id: categories.id }).from(categories)
				.where(eq(categories.slug, 'grant')).limit(1))[0]?.id;
			if (categoryId === undefined) throw new Error('Could not ensure the Grant category lookup row.');

			await db.insert(opportunityCategories).values({ opportunityId, categoryId }).onConflictDoNothing();
		},

		async expireOverdue(now) {
			const rows = await db.update(opportunities).set({ status: 'expired', updatedAt: now })
				.where(and(
					eq(opportunities.sourceName, 'grants-gov'),
					eq(opportunities.status, 'active'),
					lt(opportunities.applicationDeadline, now),
				)).returning({ id: opportunities.id });
			return rows.length;
		},
	};
}

export async function persistGrantsGov(
	records: NormalizedOpportunity[],
	store?: OpportunityPersistence,
	now = new Date(),
	onFailure?: (record: NormalizedOpportunity | null, error: unknown) => void,
): Promise<PersistenceCounts> {
	const persistence = store ?? await createDatabasePersistence();
	const counts: PersistenceCounts = { inserted: 0, updated: 0, failed: 0 };

	for (const record of records) {
		try {
			const result = await persistence.upsert(record, now);
			await persistence.attachGrantCategory(result.id);
			if (result.inserted) counts.inserted += 1;
			else counts.updated += 1;
		} catch (error) {
			counts.failed += 1;
			onFailure?.(record, error);
		}
	}

	try {
		counts.updated += await persistence.expireOverdue(now);
	} catch (error) {
		counts.failed += 1;
		onFailure?.(null, error);
	}

	return counts;
}
