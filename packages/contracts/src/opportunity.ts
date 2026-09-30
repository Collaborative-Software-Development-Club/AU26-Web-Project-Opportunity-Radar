// Public opportunity shapes: JSON as the API emits and accepts it, never database rows.
import type { OrganizationSummary } from './organization';
import type { Paginated } from './pagination';

export const OPPORTUNITY_STATUSES = ['active', 'closed', 'expired'] as const;
export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;
export const SOURCE_TYPES = ['api', 'scrape', 'manual', 'seed'] as const;
export const COMPENSATION_TYPES = ['pay', 'stipend', 'award', 'unpaid'] as const;
export const COMPENSATION_PERIODS = ['hour', 'day', 'week', 'month', 'year', 'one-time', 'total'] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type CompensationType = (typeof COMPENSATION_TYPES)[number];
export type CompensationPeriod = (typeof COMPENSATION_PERIODS)[number];

export type CompensationView = {
  compensationType: CompensationType | null;
  isPaid: boolean | null;
  minAmount: string | null;
  maxAmount: string | null;
  currency: string | null;
  period: CompensationPeriod | null;
  rawText: string | null;
};

export type LocationView = {
  id: string;
  city: string | null;
  stateRegion: string | null;
  country: string;
  countryCode: string | null;
  latitude: string | null;
  longitude: string | null;
};

export type FieldView = {
  id: number;
  name: string;
  slug: string;
};

export type CategoryView = {
  id: number;
  name: string;
  slug: string;
};

export type EducationLevelView = {
  id: number;
  name: string;
  sortOrder: number | null;
};

export type OpportunityView = {
  id: string;
  organizationId: string | null;
  organization: OrganizationSummary | null;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  applicationUrl: string;
  sourceUrl: string;
  applicationDeadline: string | null;
  workMode: WorkMode | null;
  workAuthorization: string | null;
  externalId: string | null;
  sourceType: SourceType | null;
  sourceName: string | null;
  postedAt: string | null;
  firstSeenAt: string;
  lastVerifiedAt: string | null;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
  compensation: CompensationView | null;
  locations: LocationView[];
  educationLevels: EducationLevelView[];
  fields: FieldView[];
  categories: CategoryView[];
};

export type OpportunityListResponse = Paginated<OpportunityView>;

export type CompensationPayload = {
  compensationType?: CompensationType | null;
  isPaid?: boolean | null;
  minAmount?: string | number | null;
  maxAmount?: string | number | null;
  currency?: string | null;
  period?: CompensationPeriod | null;
  rawText?: string | null;
};

// Lookup rows are referenced by ID; sending an array replaces that relation wholesale,
// and an empty array clears it. Omitting the key on PATCH leaves the relation untouched.
export type OpportunityRelationIdsPayload = {
  locationIds?: string[];
  educationLevelIds?: number[];
  fieldIds?: number[];
  categoryIds?: number[];
};

export type CreateOpportunityRequest = OpportunityRelationIdsPayload & {
  title: string;
  slug: string;
  applicationUrl: string;
  sourceUrl: string;
  organizationId?: string | null;
  summary?: string | null;
  description?: string | null;
  applicationDeadline?: string | null;
  workMode?: WorkMode | null;
  workAuthorization?: string | null;
  externalId?: string | null;
  sourceType?: SourceType | null;
  sourceName?: string | null;
  postedAt?: string | null;
  firstSeenAt?: string;
  lastVerifiedAt?: string | null;
  status?: OpportunityStatus;
  compensation?: CompensationPayload | null;
};

export type UpdateOpportunityRequest = Partial<CreateOpportunityRequest>;

export type ListOpportunitiesParams = {
  limit?: number;
  offset?: number;
  status?: OpportunityStatus;
  organizationId?: string;
  sourceName?: string;
};
