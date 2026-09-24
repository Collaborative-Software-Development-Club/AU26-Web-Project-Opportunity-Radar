

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

export const MAX_COMPENSATION_AMOUNT = 9_999_999_999.99;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type CompensationView = {
  compensationType: CompensationType | null;
  isPaid: boolean | null;
  minAmount: string | null;
  maxAmount: string | null;
  currency: string | null;
  period: CompensationPeriod | null;
  rawText: string | null;
};


export type OpportunityView = {
  id: string;
  organizationId: string | null;
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
};


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
  };


export type UpdateOpportunityInput = {
  fields: OpportunityFieldsWrite;
  compensation?: CompensationWrite | null;
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
  create(input: CreateOpportunityInput): Promise<OpportunityView>;
  update(id: string, input: UpdateOpportunityInput): Promise<OpportunityView | null>;
  remove(id: string): Promise<boolean>;
};
