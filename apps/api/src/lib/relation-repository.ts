import { eq, inArray } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import { categories, db, educationLevels, fields, locations } from '@radar/database';
import { RELATION_KEYS, type MissingReferences, type RelationIdsWrite, type RelationKey } from './relation-ids';

export type Statement = BatchItem<'pg'>;

// Each module supplies its own join tables; the replacement rules are shared.
type JoinTable = {
  table: PgTable;
  ownerColumn: AnyPgColumn<{ data: string }>;
  ownerKey: string;
  lookupKey: string;
};
export type RelationTables = Record<RelationKey, JoinTable>;

export function relationDeletes(id: string, relations: RelationIdsWrite, tables: RelationTables): Statement[] {
  return RELATION_KEYS.filter(key => relations[key] !== undefined).map(key => {
    const { table, ownerColumn } = tables[key];
    return db.delete(table).where(eq(ownerColumn, id));
  });
}

export function relationInserts(id: string, relations: RelationIdsWrite, tables: RelationTables): Statement[] {
  const statements: Statement[] = [];
  for (const key of RELATION_KEYS) {
    const ids = relations[key];
    if (!ids?.length) continue;
    const { table, ownerKey, lookupKey } = tables[key];
    statements.push(db.insert(table).values(ids.map(lookupId => ({ [ownerKey]: id, [lookupKey]: lookupId }))));
  }
  return statements;
}

async function missingFrom<T extends string | number>(
  ids: T[] | undefined,
  present: (values: T[]) => Promise<{ id: T }[]>,
): Promise<T[] | undefined> {
  if (!ids?.length) return undefined;
  const found = new Set((await present(ids)).map(row => row.id));
  return ids.filter(id => !found.has(id));
}

// Query only the lookup sets named by the caller, before any writes happen.
export async function findMissingReferences(relations: RelationIdsWrite): Promise<MissingReferences> {
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
}
