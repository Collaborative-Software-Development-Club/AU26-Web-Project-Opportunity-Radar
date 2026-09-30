

// Response shapes are the published contract; write shapes stay internal to the API.
export {
  COMPENSATION_PERIODS, COMPENSATION_TYPES, OPPORTUNITY_STATUSES, SOURCE_TYPES, WORK_MODES,
} from '@radar/contracts';
export type {
  CategoryView, CompensationPeriod, CompensationType, CompensationView, EducationLevelView,
  FieldView, LocationView, OpportunityStatus, OpportunityView, OrganizationSummary,
  SourceType, WorkMode,
} from '@radar/contracts';

import type {
  CompensationPeriod, CompensationType, OpportunityStatus, OpportunityView, SourceType, WorkMode,
} from '@radar/contracts';

export const MAX_COMPENSATION_AMOUNT = 9_999_999_999.99;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
// A single opportunity referencing more lookup rows than this is a client mistake, not a record.
export const MAX_RELATION_IDS = 50;


export type CompensationWrite = {
  compensationType: CompensationType | null;
  isPaid: boolean | null;
  minAmount: string | null;
  maxAmount: string | null;
  currency: string | null;
  period: CompensationPeriod | null;
  rawText: string | null;
};


export type RelationIdsWrite = {
  locationIds?: string[];
  educationLevelIds?: number[];
  fieldIds?: number[];
  categoryIds?: number[];
};

export const RELATION_KEYS = ['locationIds', 'educationLevelIds', 'fieldIds', 'categoryIds'] as const;

export type RelationKey = (typeof RELATION_KEYS)[number];

export type MissingReferences = Partial<Record<RelationKey, (string | number)[]>>;


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
