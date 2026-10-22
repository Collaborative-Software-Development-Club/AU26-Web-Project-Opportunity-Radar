import { and, eq, lt, sql } from 'drizzle-orm';
import type { NormalizedOpportunity } from './normalize';

export type LoadCounts = { inserted: number; updated: number; failed: number };

export type OpportunityStore = {
	upsert(opportunity: NormalizedOpportunity, now: Date): Promise<{ id: string; inserted: boolean }>;
	attachCategory(opportunityId: string, category: NormalizedOpportunity['category']): Promise<void>;
	setCompensationText(opportunityId: string, text: string, now: Date): Promise<void>;
	expireOverdue(sourceName: string, now: Date): Promise<number>;
};

async function createDatabaseStore(): Promise<OpportunityStore> {
	const { db, categories, opportunityCategories, opportunityCompensation, opportunities } = await import('@radar/database');
	return {
		async upsert({ category: _category, compensationText: _compensationText, ...opportunity }, now) {
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

		async attachCategory(opportunityId, { slug, name }) {
			const [category] = await db.insert(categories).values({ name, slug })
				.onConflictDoNothing({ target: categories.slug })
				.returning({ id: categories.id });
			const categoryId = category?.id ?? (await db.select({ id: categories.id }).from(categories)
				.where(eq(categories.slug, slug)).limit(1))[0]?.id;
			if (categoryId === undefined) throw new Error(`Could not ensure the ${slug} category lookup row.`);

			await db.insert(opportunityCategories).values({ opportunityId, categoryId }).onConflictDoNothing();
		},

		async setCompensationText(opportunityId, rawText, now) {
			await db.insert(opportunityCompensation).values({ opportunityId, rawText })
				.onConflictDoUpdate({ target: opportunityCompensation.opportunityId, set: { rawText, updatedAt: now } });
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

// Shared by every source: upsert on (sourceName, externalId), link the category, keep pay text, expire overdue rows.
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
			const result = await persistence.upsert(record, now);
			await persistence.attachCategory(result.id, record.category);
			if (record.compensationText) await persistence.setCompensationText(result.id, record.compensationText, now);
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
