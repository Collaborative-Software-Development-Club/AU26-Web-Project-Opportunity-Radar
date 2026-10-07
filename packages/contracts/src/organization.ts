// Public organization shapes
import type { OpportunityView } from './opportunity';
import type { Paginated } from './pagination';

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
};

export type OrganizationView = OrganizationSummary & {
  createdAt: string;
  updatedAt: string;
};

// GET /api/organizations/:id also returns the organization's opportunities.
export type OrganizationDetail = OrganizationView & { opportunities: OpportunityView[] };

export type OrganizationListResponse = Paginated<OrganizationView>;

export type ListOrganizationsParams = {
  limit?: number;
  offset?: number;
  q?: string;
};

export type CreateOrganizationRequest = {
  name: string;
  slug: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
};

export type UpdateOrganizationRequest = Partial<CreateOrganizationRequest>;
