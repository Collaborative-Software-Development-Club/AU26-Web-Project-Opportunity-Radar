

import type * as schema from '@radar/database/schema';
import {
  toCategoryViews, toEducationLevelViews, toFieldViews, toLocationViews,
  type CategoryRow, type EducationLevelRow, type FieldRow, type LocationRow,
} from '../../lib/lookup-views';
import type {
  CompensationPeriod, CompensationType, OpportunityStatus, OpportunityView, SourceType, WorkMode,
} from './opportunities.types';

export type OpportunityRow = typeof schema.opportunities.$inferSelect & {
  organization?: typeof schema.organizations.$inferSelect | null;
  compensation?: typeof schema.opportunityCompensation.$inferSelect | null;
  locations?: { location: LocationRow }[];
  educationLevels?: { educationLevel: EducationLevelRow }[];
  fields?: { field: FieldRow }[];
  categories?: { category: CategoryRow }[];
};

const iso = (value: Date | null): string | null => value === null ? null : value.toISOString();

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
    locations: toLocationViews(row.locations ?? []),
    educationLevels: toEducationLevelViews(row.educationLevels ?? []),
    fields: toFieldViews(row.fields ?? []),
    categories: toCategoryViews(row.categories ?? []),
  };
}
