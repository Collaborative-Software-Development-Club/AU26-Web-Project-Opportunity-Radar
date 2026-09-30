

import type * as schema from '@radar/database/schema';
import type {
  CategoryView, CompensationPeriod, CompensationType, EducationLevelView, FieldView,
  LocationView, OpportunityStatus, OpportunityView, SourceType, WorkMode,
} from './opportunities.types';

export type LocationRow = typeof schema.locations.$inferSelect;
type FieldRow = typeof schema.fields.$inferSelect;
type CategoryRow = typeof schema.categories.$inferSelect;
type EducationLevelRow = typeof schema.educationLevels.$inferSelect;

export type OpportunityRow = typeof schema.opportunities.$inferSelect & {
  organization?: typeof schema.organizations.$inferSelect | null;
  compensation?: typeof schema.opportunityCompensation.$inferSelect | null;
  locations?: { location: LocationRow }[];
  educationLevels?: { educationLevel: EducationLevelRow }[];
  fields?: { field: FieldRow }[];
  categories?: { category: CategoryRow }[];
};

const iso = (value: Date | null): string | null => value === null ? null : value.toISOString();

const byName = <T extends { name: string }>(rows: T[]): T[] =>
  rows.sort((first, second) => first.name.localeCompare(second.name));

const text = (value: string | null): string => value ?? '';

function toLocationView({ location }: { location: LocationRow }): LocationView {
  return {
    id: location.id,
    city: location.city,
    stateRegion: location.stateRegion,
    country: location.country,
    countryCode: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function toEducationLevelView({ educationLevel }: { educationLevel: EducationLevelRow }): EducationLevelView {
  return { id: educationLevel.id, name: educationLevel.name, sortOrder: educationLevel.sortOrder };
}

const toFieldView = ({ field }: { field: FieldRow }): FieldView =>
  ({ id: field.id, name: field.name, slug: field.slug });

const toCategoryView = ({ category }: { category: CategoryRow }): CategoryView =>
  ({ id: category.id, name: category.name, slug: category.slug });

export function toView(row: OpportunityRow): OpportunityView {
  return {
    id: row.id,
    organizationId: row.organizationId,
    organization: row.organization
      ? {
          id: row.organization.id,
          name: row.organization.name,
          slug: row.organization.slug,
          websiteUrl: row.organization.websiteUrl,
          logoUrl: row.organization.logoUrl,
        }
      : null,
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
    locations: (row.locations ?? []).map(toLocationView).sort((first, second) =>
      text(first.country).localeCompare(text(second.country))
      || text(first.stateRegion).localeCompare(text(second.stateRegion))
      || text(first.city).localeCompare(text(second.city))
      || first.id.localeCompare(second.id)),
    educationLevels: (row.educationLevels ?? []).map(toEducationLevelView).sort((first, second) =>
      (first.sortOrder ?? Number.MAX_SAFE_INTEGER) - (second.sortOrder ?? Number.MAX_SAFE_INTEGER)
      || first.name.localeCompare(second.name)),
    fields: byName((row.fields ?? []).map(toFieldView)),
    categories: byName((row.categories ?? []).map(toCategoryView)),
  };
}
