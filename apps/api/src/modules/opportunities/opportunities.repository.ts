

import { randomUUID } from 'node:crypto';
import { and, asc, count, eq, exists, ilike, or, sql, type SQL } from 'drizzle-orm';
import {
  categories, db, locations, opportunities, opportunityCategories,
  opportunityCompensation, opportunityEducationLevels, opportunityFields, opportunityLocations,
} from '@radar/database';
import {
  findMissingReferences, relationDeletes, relationInserts, type RelationTables, type Statement,
} from '../../lib/relation-repository';
import type {
  CompensationWrite, ListOpportunitiesQuery, OpportunitiesRepository,
  OpportunitySort, OpportunityView,
} from './opportunities.types';
import { toView } from './opportunities.view';

const RELATION_TABLES = {
  locationIds: {
    table: opportunityLocations, ownerColumn: opportunityLocations.opportunityId,
    ownerKey: 'opportunityId', lookupKey: 'locationId',
  },
  educationLevelIds: {
    table: opportunityEducationLevels, ownerColumn: opportunityEducationLevels.opportunityId,
    ownerKey: 'opportunityId', lookupKey: 'educationLevelId',
  },
  fieldIds: {
    table: opportunityFields, ownerColumn: opportunityFields.opportunityId,
    ownerKey: 'opportunityId', lookupKey: 'fieldId',
  },
  categoryIds: {
    table: opportunityCategories, ownerColumn: opportunityCategories.opportunityId,
    ownerKey: 'opportunityId', lookupKey: 'categoryId',
  },
} satisfies RelationTables;


export const WITH_RELATIONS = {
  organization: true,
  compensation: true,
  locations: { with: { location: true } },
  educationLevels: { with: { educationLevel: true } },
  fields: { with: { field: true } },
  categories: { with: { category: true } },
} as const;

// Escape LIKE metacharacters so a search term matches literally: q=100% looks for a percent sign.
const likeLiteral = (value: string): string => value.replace(/[\\%_]/g, character => `\\${character}`);

// Relation filters use EXISTS rather than a join: an opportunity in two matching locations is
// still one row, so results are not duplicated and the count query stays truthful. The same
// predicate feeds list() and its count, and drizzle aliases the root table to its own name,
// so "opportunities"."id" correlates in both.
function categoryFilter(categorySlug: string): SQL {
  return exists(db.select({ matched: sql`1` }).from(opportunityCategories)
    .innerJoin(categories, eq(opportunityCategories.categoryId, categories.id))
    .where(and(
      eq(opportunityCategories.opportunityId, opportunities.id),
      eq(categories.slug, categorySlug),
    )));
}

function locationFilter(place: string): SQL {
  const pattern = likeLiteral(place);
  return exists(db.select({ matched: sql`1` }).from(opportunityLocations)
    .innerJoin(locations, eq(opportunityLocations.locationId, locations.id))
    .where(and(
      eq(opportunityLocations.opportunityId, opportunities.id),
      or(ilike(locations.city, pattern), ilike(locations.stateRegion, pattern)),
    )));
}


function unexpiredFilter(): SQL {
  const deadline = opportunities.applicationDeadline;
  return sql`(${deadline} is null or ${deadline} >= now())`;
}

function orderFor(sort: OpportunitySort): SQL[] {
  
  if (sort === 'deadline') {
    return [sql`${opportunities.applicationDeadline} asc nulls last`, asc(opportunities.id)];
  }
  return [
    sql`${opportunities.postedAt} desc nulls last`,
    sql`${opportunities.createdAt} desc`,
    asc(opportunities.id),
  ];
}

// Field and education-level filters slot in here the same way.
function filtersFor(
  { status, organizationId, sourceName, q, category, location, workMode, includeExpired }: ListOpportunitiesQuery,
): SQL | undefined {
  // and() drops undefined entries, so an or() that collapses cannot widen the result set.
  const filters: (SQL | undefined)[] = [];
  // Asking for expired rows by status implies wanting passed deadlines.
  if (!includeExpired && status !== 'expired') filters.push(unexpiredFilter());
  if (status) filters.push(eq(opportunities.status, status));
  if (organizationId) filters.push(eq(opportunities.organizationId, organizationId));
  if (sourceName) filters.push(eq(opportunities.sourceName, sourceName));
  if (workMode) filters.push(eq(opportunities.workMode, workMode));
  if (q) {
    const pattern = `%${likeLiteral(q)}%`;
    // summary is nullable; a NULL summary simply fails to match instead of excluding the row.
    filters.push(or(ilike(opportunities.title, pattern), ilike(opportunities.summary, pattern)));
  }
  if (category) filters.push(categoryFilter(category));
  if (location) filters.push(locationFilter(location));
  return filters.length ? and(...filters) : undefined;
}

async function findById(id: string): Promise<OpportunityView | null> {
  const row = await db.query.opportunities.findFirst({
    where: eq(opportunities.id, id),
    with: WITH_RELATIONS,
  });
  return row ? toView(row) : null;
}

async function readBack(id: string): Promise<OpportunityView> {
  const view = await findById(id);
  if (!view) throw new Error(`Opportunity ${id} disappeared immediately after being written.`);
  return view;
}

function compensationWrite(id: string, compensation: CompensationWrite | null): Statement {
  return compensation === null
    ? db.delete(opportunityCompensation).where(eq(opportunityCompensation.opportunityId, id))
    // Every column is supplied, so the upsert replaces the row rather than merging into it.
    : db.insert(opportunityCompensation).values({ ...compensation, opportunityId: id })
        .onConflictDoUpdate({
          target: opportunityCompensation.opportunityId,
          set: { ...compensation, updatedAt: new Date() },
        });
}

export const opportunitiesRepository: OpportunitiesRepository = {
  async list(query) {
    const where = filtersFor(query);
    const [rows, totals] = await Promise.all([
      db.query.opportunities.findMany({
        where,
        with: WITH_RELATIONS,
        orderBy: orderFor(query.sort),
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

  findMissingReferences,

  async create({ compensation, relations, ...fields }) {
    // Generate the ID here so every dependent row can be written in the same batch.
    const id = randomUUID();
    const statements: [Statement, ...Statement[]] = [db.insert(opportunities).values({ ...fields, id })];
    if (compensation) statements.push(compensationWrite(id, compensation));
    statements.push(...relationInserts(id, relations, RELATION_TABLES));

    // Neon's HTTP driver runs a batch inside one transaction, so the rows cannot half-apply.
    await db.batch(statements);
    return readBack(id);
  },

  async update(id, { fields, compensation, relations }) {
    // updated_at carries an insert default only, so every update sets it explicitly.
    const setOpportunity = db.update(opportunities).set({ ...fields, updatedAt: new Date() })
      .where(eq(opportunities.id, id)).returning({ id: opportunities.id });

    const statements: [Statement, ...Statement[]] = [setOpportunity];
    if (compensation !== undefined) statements.push(compensationWrite(id, compensation));
    // Deleting before inserting replaces each named relation without leaving a gap outside the batch.
    statements.push(
      ...relationDeletes(id, relations, RELATION_TABLES),
      ...relationInserts(id, relations, RELATION_TABLES),
    );

    const [changed] = await db.batch(statements);
    return changed.length ? findById(id) : null;
  },

  async remove(id) {
    // opportunity_compensation and the junction tables cascade; lookup rows are untouched.
    const deleted = await db.delete(opportunities).where(eq(opportunities.id, id))
      .returning({ id: opportunities.id });
    return deleted.length > 0;
  },
};
