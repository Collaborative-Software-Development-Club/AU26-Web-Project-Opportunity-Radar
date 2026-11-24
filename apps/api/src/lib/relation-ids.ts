import type { OpportunityRelationIdsPayload } from '@radar/contracts';
import { badRequest } from './http-error';
import {
  type Coercer, type ObjectReader, definedOnly, integer, uniqueList, uuid,
} from './validation';

export const MAX_RELATION_IDS = 50;
export const RELATION_KEYS = ['locationIds', 'educationLevelIds', 'fieldIds', 'categoryIds'] as const;
export type RelationKey = (typeof RELATION_KEYS)[number];
export type RelationIdsWrite = OpportunityRelationIdsPayload;
export type MissingReferences = Partial<Record<RelationKey, (string | number)[]>>;

const REFERENCE_LABELS: Record<RelationKey, string> = {
  locationIds: 'location',
  educationLevelIds: 'education level',
  fieldIds: 'field',
  categoryIds: 'category',
};

export function readRelations(
  body: ObjectReader,
  { rejectDuplicates = false }: { rejectDuplicates?: boolean } = {},
): RelationIdsWrite {
  const ids = <T>(key: string, item: Coercer<T>) =>
    body.field(key, uniqueList(item, { max: MAX_RELATION_IDS, rejectDuplicates }));
  const lookupId = () => integer({ min: 1, max: 32_767 });
  return definedOnly({
    // PostgreSQL UUIDs are case-insensitive; normalize before checking for duplicates.
    locationIds: ids('locationIds', raw => uuid()(raw).toLowerCase()),
    educationLevelIds: ids('educationLevelIds', lookupId()),
    fieldIds: ids('fieldIds', lookupId()),
    categoryIds: ids('categoryIds', lookupId()),
  });
}

export async function assertReferencesExist(
  repository: { findMissingReferences(relations: RelationIdsWrite): Promise<MissingReferences> },
  relations: RelationIdsWrite,
): Promise<void> {
  if (!RELATION_KEYS.some(key => relations[key]?.length)) return;
  const missing = await repository.findMissingReferences(relations);
  const details = RELATION_KEYS.flatMap(key => {
    const ids = missing[key];
    return ids?.length
      ? [{ field: key, message: `references unknown ${REFERENCE_LABELS[key]} IDs: ${ids.join(', ')}` }]
      : [];
  });
  if (details.length) throw badRequest('Referenced records do not exist.', details);
}
