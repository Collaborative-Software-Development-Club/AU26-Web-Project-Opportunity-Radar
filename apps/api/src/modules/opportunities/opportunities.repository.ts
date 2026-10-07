

import { randomUUID } from 'node:crypto';
import { and, asc, count, eq, exists, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import {
  categories, db, educationLevels, fields, locations, opportunities, opportunityCategories,
  opportunityCompensation, opportunityEducationLevels, opportunityFields, opportunityLocations,
} from '@radar/database';
import type {
  CompensationWrite, ListOpportunitiesQuery, MissingReferences, OpportunitiesRepository,
  OpportunityView, RelationIdsWrite,
} from './opportunities.types';
import { toView } from './opportunities.view';

type Statement = BatchItem<'pg'>;


const WITH_RELATIONS = {
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

// Field and education-level filters slot in here the same way.
function filtersFor(
  { status, organizationId, sourceName, q, category, location, workMode }: ListOpportunitiesQuery,
): SQL | undefined {
  // and() drops undefined entries, so an or() that collapses cannot widen the result set.
  const filters: (SQL | undefined)[] = [];
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

function relationDeletes(id: string, relations: RelationIdsWrite): Statement[] {
  const statements: Statement[] = [];
  if (relations.locationIds) {
    statements.push(db.delete(opportunityLocations).where(eq(opportunityLocations.opportunityId, id)));
  }
  if (relations.educationLevelIds) {
    statements.push(db.delete(opportunityEducationLevels).where(eq(opportunityEducationLevels.opportunityId, id)));
  }
  if (relations.fieldIds) {
    statements.push(db.delete(opportunityFields).where(eq(opportunityFields.opportunityId, id)));
  }
  if (relations.categoryIds) {
    statements.push(db.delete(opportunityCategories).where(eq(opportunityCategories.opportunityId, id)));
  }
  return statements;
}

function relationInserts(id: string, relations: RelationIdsWrite): Statement[] {
  const statements: Statement[] = [];
  if (relations.locationIds?.length) {
    statements.push(db.insert(opportunityLocations)
      .values(relations.locationIds.map(locationId => ({ opportunityId: id, locationId }))));
  }
  if (relations.educationLevelIds?.length) {
    statements.push(db.insert(opportunityEducationLevels)
      .values(relations.educationLevelIds.map(educationLevelId => ({ opportunityId: id, educationLevelId }))));
  }
  if (relations.fieldIds?.length) {
    statements.push(db.insert(opportunityFields)
      .values(relations.fieldIds.map(fieldId => ({ opportunityId: id, fieldId }))));
  }
  if (relations.categoryIds?.length) {
    statements.push(db.insert(opportunityCategories)
      .values(relations.categoryIds.map(categoryId => ({ opportunityId: id, categoryId }))));
  }
  return statements;
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

async function missingFrom<T extends string | number>(
  ids: T[] | undefined,
  present: (values: T[]) => Promise<{ id: T }[]>,
): Promise<T[] | undefined> {
  if (!ids?.length) return undefined;
  const found = new Set((await present(ids)).map(row => row.id));
  return ids.filter(id => !found.has(id));
}

export const opportunitiesRepository: OpportunitiesRepository = {
  async list(query) {
    const where = filtersFor(query);
    const [rows, totals] = await Promise.all([
      db.query.opportunities.findMany({
        where,
        with: WITH_RELATIONS,
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

  // One query per relation the caller named, so a bad ID is reported instead of a foreign-key error.
  async findMissingReferences(relations) {
    const [locationIds, educationLevelIds, fieldIds, categoryIds] = await Promise.all([
      missingFrom(relations.locationIds, values =>
        db.select({ id: locations.id }).from(locations).where(inArray(locations.id, values))),
      missingFrom(relations.educationLevelIds, values =>
        db.select({ id: educationLevels.id }).from(educationLevels).where(inArray(educationLevels.id, values))),
      missingFrom(relations.fieldIds, values =>
        db.select({ id: fields.id }).from(fields).where(inArray(fields.id, values))),
      missingFrom(relations.categoryIds, values =>
        db.select({ id: categories.id }).from(categories).where(inArray(categories.id, values))),
    ]);

    const missing: MissingReferences = {};
    if (locationIds?.length) missing.locationIds = locationIds;
    if (educationLevelIds?.length) missing.educationLevelIds = educationLevelIds;
    if (fieldIds?.length) missing.fieldIds = fieldIds;
    if (categoryIds?.length) missing.categoryIds = categoryIds;
    return missing;
  },

  async create({ compensation, relations, ...fields }) {
    // Generate the ID here so every dependent row can be written in the same batch.
    const id = randomUUID();
    const statements: [Statement, ...Statement[]] = [db.insert(opportunities).values({ ...fields, id })];
    if (compensation) statements.push(compensationWrite(id, compensation));
    statements.push(...relationInserts(id, relations));

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
    statements.push(...relationDeletes(id, relations), ...relationInserts(id, relations));

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
