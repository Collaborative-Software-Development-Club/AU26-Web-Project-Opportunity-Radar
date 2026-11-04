

// Response shapes are the published contract; write shapes stay internal to the API.
export {
  COMPENSATION_PERIODS, COMPENSATION_TYPES, OPPORTUNITY_SORTS, OPPORTUNITY_STATUSES, SOURCE_TYPES,
  WORK_MODES,
} from '@radar/contracts';
export type {
  CategoryView, CompensationPeriod, CompensationType, CompensationView, EducationLevelView,
  FieldView, LocationView, OpportunitySort, OpportunityStatus, OpportunityView, OrganizationSummary,
  SourceType, WorkMode,
} from '@radar/contracts';

import type {
  CompensationPeriod, CompensationType, OpportunitySort, OpportunityStatus, OpportunityView,
  SourceType, WorkMode,
} from '@radar/contracts';
import type { RelationIdsWrite, MissingReferences } from '../../lib/relation-ids';

export { MAX_RELATION_IDS, RELATION_KEYS } from '../../lib/relation-ids';
export type { RelationIdsWrite, RelationKey, MissingReferences } from '../../lib/relation-ids';

export const MAX_COMPENSATION_AMOUNT = 9_999_999_999.99;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
// Long enough for a pasted job title, short enough that the ILIKE scan stays cheap.
export const MAX_SEARCH_LENGTH = 200;
// Matches locations.city and locations.state_region, both varchar(150).
export const MAX_LOCATION_LENGTH = 150;


export type CompensationWrite = {
  compensationType: CompensationType | null;
  isPaid: boolean | null;
  minAmount: string | null;
  maxAmount: string | null;
  currency: string | null;
  period: CompensationPeriod | null;
  rawText: string | null;
};


export type OpportunityFieldsWrite = {
  organizationId?: string | null;
  title?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  applicationUrl?: string;
  sourceUrl?: string;
  applicationDeadline?: Date | null;
  workMode?: WorkMode | null;
  workAuthorization?: string | null;
  externalId?: string | null;
  sourceType?: SourceType | null;
  sourceName?: string | null;
  postedAt?: Date | null;
  firstSeenAt?: Date;
  lastVerifiedAt?: Date | null;
  status?: OpportunityStatus;
};

export type CreateOpportunityInput =
  Omit<OpportunityFieldsWrite, 'title' | 'slug' | 'applicationUrl' | 'sourceUrl'> & {
    title: string;
    slug: string;
    applicationUrl: string;
    sourceUrl: string;
    compensation?: CompensationWrite;
    relations: RelationIdsWrite;
  };


export type UpdateOpportunityInput = {
  fields: OpportunityFieldsWrite;
  compensation?: CompensationWrite | null;
  relations: RelationIdsWrite;
};

export type ListOpportunitiesQuery = {
  limit: number;
  offset: number;
  status?: OpportunityStatus;
  organizationId?: string;
  sourceName?: string;
  /** Free-text search over title and summary. Absent when the client sent nothing to match. */
  q?: string;
  /** categories.slug, not the numeric ID, so the filter survives in a shareable URL. */
  category?: string;
  /** Matched case-insensitively against locations.city or locations.state_region. */
  location?: string;
  workMode?: WorkMode;
  sort: OpportunitySort;
  includeExpired: boolean;
};

export type ListOpportunitiesResult = { items: OpportunityView[]; total: number };

export type OpportunityIdentity = { id: string };


export type OpportunitiesRepository = {
  list(query: ListOpportunitiesQuery): Promise<ListOpportunitiesResult>;
  findById(id: string): Promise<OpportunityView | null>;
  findBySlug(slug: string): Promise<OpportunityIdentity | null>;
  findBySourceIdentity(sourceName: string, externalId: string): Promise<OpportunityIdentity | null>;
  findMissingReferences(relations: RelationIdsWrite): Promise<MissingReferences>;
  create(input: CreateOpportunityInput): Promise<OpportunityView>;
  update(id: string, input: UpdateOpportunityInput): Promise<OpportunityView | null>;
  remove(id: string): Promise<boolean>;
};
