import type { CategoryView, EducationLevelView, FieldView, LocationView } from '../lookups/lookups.types';
import type { OpportunityView } from '../opportunities/opportunities.types';

export type OrganizationView = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationOpportunityView = OpportunityView & {
  categories: CategoryView[];
  fields: FieldView[];
  educationLevels: EducationLevelView[];
  locations: LocationView[];
};

export type OrganizationDetail = OrganizationView & { opportunities: OrganizationOpportunityView[] };

export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
};

export type CreateOrganizationInput = Omit<UpdateOrganizationInput, 'name' | 'slug'> & { name: string; slug: string };

export type ListOrganizationsQuery = { limit: number; offset: number; q?: string };

export type ListOrganizationsResult = { items: OrganizationView[]; total: number };

export type OrganizationsRepository = {
  list(query: ListOrganizationsQuery): Promise<ListOrganizationsResult>;
  findById(id: string): Promise<OrganizationDetail | null>;
  findBySlug(slug: string): Promise<{ id: string } | null>;
  create(input: CreateOrganizationInput): Promise<OrganizationView>;
  update(id: string, input: UpdateOrganizationInput): Promise<OrganizationView | null>;
  remove(id: string): Promise<boolean>;
};
