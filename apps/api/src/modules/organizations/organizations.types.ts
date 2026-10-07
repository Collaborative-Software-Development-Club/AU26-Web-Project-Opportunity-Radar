import type { OrganizationDetail, OrganizationView } from '@radar/contracts';

// Response shapes are the published contract; write shapes stay internal to the API.
export type { OrganizationDetail, OrganizationView };

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
