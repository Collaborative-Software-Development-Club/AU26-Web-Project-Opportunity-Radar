

import { randomUUID } from 'node:crypto';
import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';
import { db, opportunities, opportunityCompensation } from '@radar/database';
import type { Opportunity, OpportunityCompensation } from '@radar/database/schema';
import type {
  CompensationPeriod, CompensationType, ListOpportunitiesQuery, OpportunitiesRepository,
  OpportunityStatus, OpportunityView, SourceType, WorkMode,
} from './opportunities.types';

type OpportunityRow = Opportunity & { compensation?: OpportunityCompensation | null };

const iso = (value: Date | null): string | null => value === null ? null : value.toISOString();

function toView(row: OpportunityRow): OpportunityView {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    applicationUrl: row.applicationUrl,
    sourceUrl: row.sourceUrl,
    applicationDeadline: iso(row.applicationDeadline),
    workMode: row.workMode as WorkMode | null,
    workAuthorization: row.workAuthorization,
    externalId: row.externalId,
    sourceType: row.sourceType as SourceType | null,
    sourceName: row.sourceName,
    postedAt: iso(row.postedAt),
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastVerifiedAt: iso(row.lastVerifiedAt),
    status: row.status as OpportunityStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    compensation: row.compensation
      ? {
          compensationType: row.compensation.compensationType as CompensationType | null,
          isPaid: row.compensation.isPaid,
          minAmount: row.compensation.minAmount,
          maxAmount: row.compensation.maxAmount,
          currency: row.compensation.currency,
          period: row.compensation.period as CompensationPeriod | null,
          rawText: row.compensation.rawText,
        }
      : null,
  };
}

// Category, location, field and education-level filters slot in here as more joins.
function filtersFor({ status, organizationId, sourceName }: ListOpportunitiesQuery): SQL | undefined {
  const filters: SQL[] = [];
  if (status) filters.push(eq(opportunities.status, status));
  if (organizationId) filters.push(eq(opportunities.organizationId, organizationId));
  if (sourceName) filters.push(eq(opportunities.sourceName, sourceName));
  return filters.length ? and(...filters) : undefined;
}

async function findById(id: string): Promise<OpportunityView | null> {
  const row = await db.query.opportunities.findFirst({
    where: eq(opportunities.id, id),
    with: { compensation: true },
  });
  return row ? toView(row) : null;
}

export const opportunitiesRepository: OpportunitiesRepository = {
  async list(query) {
    const where = filtersFor(query);
    const [rows, totals] = await Promise.all([
      db.query.opportunities.findMany({
        where,
        with: { compensation: true },
        
        orderBy: [sql`${opportunities.postedAt} desc nulls last`, sql`${opportunities.createdAt} desc`, asc(opportunities.id)],
        limit: query.limit,
        offset: query.offset,
      }),
      db.select({ value: count() }).from(opportunities).where(where),
    ]);
    return { items: rows.map(toView), total: Number(totals[0]?.value ?? 0) };
  },

  findById,

  async findBySlug(slug) {
    const rows = await db.select({ id: opportunities.id }).from(opportunities)
      .where(eq(opportunities.slug, slug)).limit(1);
    return rows[0] ?? null;
  },

  async findBySourceIdentity(sourceName, externalId) {
    const rows = await db.select({ id: opportunities.id }).from(opportunities)
      .where(and(eq(opportunities.sourceName, sourceName), eq(opportunities.externalId, externalId))).limit(1);
    return rows[0] ?? null;
  },

  async create({ compensation, ...fields }) {
    // Generate the ID here so the compensation row can be written in the same batch.
    const id = randomUUID();
    const insertOpportunity = db.insert(opportunities).values({ ...fields, id }).returning();
    if (!compensation) {
      const [row] = await insertOpportunity;
      return toView({ ...row, compensation: null });
    }
    // Neon's HTTP driver runs a batch inside one transaction, so the pair cannot half-apply.
    const [[row], [money]] = await db.batch([
      insertOpportunity,
      db.insert(opportunityCompensation).values({ ...compensation, opportunityId: id }).returning(),
    ]);
    return toView({ ...row, compensation: money ?? null });
  },

  async update(id, { fields, compensation }) {
    // updated_at carries an insert default only, so every update sets it explicitly.
    const setOpportunity = db.update(opportunities).set({ ...fields, updatedAt: new Date() })
      .where(eq(opportunities.id, id)).returning({ id: opportunities.id });

    if (compensation === undefined) {
      const changed = await setOpportunity;
      return changed.length ? findById(id) : null;
    }

    const writeCompensation = compensation === null
      ? db.delete(opportunityCompensation).where(eq(opportunityCompensation.opportunityId, id))
          .returning({ id: opportunityCompensation.id })
      // Every column is supplied, so the upsert replaces the row rather than merging into it.
      : db.insert(opportunityCompensation).values({ ...compensation, opportunityId: id })
          .onConflictDoUpdate({
            target: opportunityCompensation.opportunityId,
            set: { ...compensation, updatedAt: new Date() },
          })
          .returning({ id: opportunityCompensation.id });

    const [changed] = await db.batch([setOpportunity, writeCompensation]);
    return changed.length ? findById(id) : null;
  },

  async remove(id) {
    // opportunity_compensation and the junction tables cascade; lookup rows are untouched.
    const deleted = await db.delete(opportunities).where(eq(opportunities.id, id))
      .returning({ id: opportunities.id });
    return deleted.length > 0;
  },
};
