// Public organization shapes. Database columns stay behind the API.

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
};
