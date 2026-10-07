// Mock opportunities for building pages before the API is wired up.
// Read these through a feature hook, never directly from components.
import type {
  CategoryView, EducationLevelView, FieldView, LocationView, OpportunityView, OrganizationSummary,
} from '@radar/contracts';

const DAY = 86_400_000;
// Deadlines are relative to load time so "closing soon" and "deadline passed" stay true.
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const POSTED = '2026-09-15T14:00:00.000Z';

const ORGANIZATIONS = {
  campusLab: { id: '0b6f3c1e-2a4d-4c8e-9f10-1a2b3c4d5e01', name: 'Demo Campus Lab', slug: 'demo-campus-lab', websiteUrl: 'https://example.invalid', logoUrl: null },
  foundation: { id: '0b6f3c1e-2a4d-4c8e-9f10-1a2b3c4d5e02', name: 'Demo Community Foundation', slug: 'demo-community-foundation', websiteUrl: 'https://example.invalid', logoUrl: null },
  innovation: { id: '0b6f3c1e-2a4d-4c8e-9f10-1a2b3c4d5e03', name: 'Demo Innovation Network', slug: 'demo-innovation-network', websiteUrl: null, logoUrl: null },
} satisfies Record<string, OrganizationSummary>;

const LOCATIONS = {
  columbus: { id: 'b2aaf0b1-42e3-4d76-9c50-916547fa4001', city: 'Columbus', stateRegion: 'Ohio', country: 'United States', countryCode: 'US', latitude: '39.961176', longitude: '-82.998794' },
  chicago: { id: 'b2aaf0b1-42e3-4d76-9c50-916547fa4002', city: 'Chicago', stateRegion: 'Illinois', country: 'United States', countryCode: 'US', latitude: '41.878113', longitude: '-87.629799' },
  austin: { id: 'b2aaf0b1-42e3-4d76-9c50-916547fa4003', city: 'Austin', stateRegion: 'Texas', country: 'United States', countryCode: 'US', latitude: null, longitude: null },
  newYork: { id: 'b2aaf0b1-42e3-4d76-9c50-916547fa4004', city: 'New York', stateRegion: 'New York', country: 'United States', countryCode: 'US', latitude: null, longitude: null },
} satisfies Record<string, LocationView>;

const CATEGORIES = {
  internship: { id: 1, name: 'Internship', slug: 'internship' },
  scholarship: { id: 2, name: 'Scholarship', slug: 'scholarship' },
  research: { id: 3, name: 'Research', slug: 'research' },
  hackathon: { id: 4, name: 'Hackathon', slug: 'hackathon' },
  fellowship: { id: 5, name: 'Fellowship', slug: 'fellowship' },
  volunteer: { id: 6, name: 'Volunteer', slug: 'volunteer' },
} satisfies Record<string, CategoryView>;

const FIELDS = {
  computerScience: { id: 1, name: 'Computer Science', slug: 'computer-science' },
  engineering: { id: 2, name: 'Engineering', slug: 'engineering' },
  business: { id: 3, name: 'Business', slug: 'business' },
  dataScience: { id: 4, name: 'Data Science', slug: 'data-science' },
  publicHealth: { id: 5, name: 'Public Health', slug: 'public-health' },
} satisfies Record<string, FieldView>;

const LEVELS = {
  highSchool: { id: 1, name: 'High School', sortOrder: 1 },
  undergraduate: { id: 2, name: 'Undergraduate', sortOrder: 2 },
  graduate: { id: 3, name: 'Graduate', sortOrder: 3 },
} satisfies Record<string, EducationLevelView>;

type Fixture = Pick<OpportunityView, 'id' | 'title' | 'slug'> & Partial<OpportunityView>;

function opportunity({ id, slug, ...fields }: Fixture): OpportunityView {
  const url = `https://example.invalid/opportunities/${slug}`;
  return {
    id,
    slug,
    organizationId: fields.organization?.id ?? null,
    organization: null,
    summary: null,
    description: null,
    applicationUrl: url,
    sourceUrl: url,
    applicationDeadline: null,
    workMode: null,
    workAuthorization: null,
    externalId: slug,
    sourceType: 'seed',
    sourceName: 'mock',
    postedAt: POSTED,
    firstSeenAt: POSTED,
    lastVerifiedAt: POSTED,
    status: 'active',
    createdAt: POSTED,
    updatedAt: POSTED,
    compensation: null,
    locations: [],
    educationLevels: [],
    fields: [],
    categories: [],
    ...fields,
  };
}

const paid = (minAmount: string, maxAmount: string, period: 'hour' | 'month' | 'one-time') => ({
  compensationType: 'pay' as const, isPaid: true, minAmount, maxAmount, currency: 'USD', period, rawText: null,
});

export const mockOpportunities: OpportunityView[] = [
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000001',
    title: 'Software Engineering Internship',
    slug: 'software-engineering-internship',
    organization: ORGANIZATIONS.innovation,
    summary: 'Build product features with a small engineering team over the summer.',
    description: 'You will ship features end to end.\n\nWhat you will do:\n- Pair with a mentor\n- Own a project from design to launch',
    applicationDeadline: daysFromNow(45),
    workMode: 'remote',
    workAuthorization: 'Must be authorized to work in the US',
    compensation: paid('25.00', '32.00', 'hour'),
    educationLevels: [LEVELS.undergraduate],
    fields: [FIELDS.computerScience],
    categories: [CATEGORIES.internship],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000002',
    title: 'Student Access Scholarship',
    slug: 'student-access-scholarship',
    organization: ORGANIZATIONS.foundation,
    summary: 'A one-time award for first-generation college students.',
    description: 'Submit a short essay and one recommendation letter.',
    // Closing soon.
    applicationDeadline: daysFromNow(5),
    compensation: { compensationType: 'award', isPaid: true, minAmount: '2500.00', maxAmount: '2500.00', currency: 'USD', period: 'one-time', rawText: null },
    educationLevels: [LEVELS.highSchool, LEVELS.undergraduate],
    fields: [FIELDS.business],
    categories: [CATEGORIES.scholarship],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000003',
    title: 'Data Research Assistant',
    slug: 'data-research-assistant',
    organization: ORGANIZATIONS.campusLab,
    summary: 'Clean and analyze survey data for an ongoing public health study.',
    description: 'Ten hours a week during the semester.',
    applicationDeadline: daysFromNow(30),
    workMode: 'hybrid',
    compensation: paid('20.00', '20.00', 'hour'),
    locations: [LOCATIONS.columbus],
    educationLevels: [LEVELS.graduate],
    fields: [FIELDS.dataScience, FIELDS.publicHealth],
    categories: [CATEGORIES.research],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000004',
    title: 'Campus Innovation Hackathon',
    slug: 'campus-innovation-hackathon',
    organization: ORGANIZATIONS.innovation,
    summary: 'A 36-hour hackathon with workshops, mentors and prizes.',
    description: 'Teams of up to four. Meals provided.',
    applicationDeadline: daysFromNow(14),
    workMode: 'onsite',
    // No compensation row at all.
    locations: [LOCATIONS.columbus, LOCATIONS.chicago],
    educationLevels: [LEVELS.undergraduate],
    fields: [FIELDS.engineering, FIELDS.computerScience],
    categories: [CATEGORIES.hackathon],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000005',
    title: 'Community Health Volunteer',
    slug: 'community-health-volunteer',
    organization: ORGANIZATIONS.foundation,
    summary: 'Help run weekend health screening events.',
    description: 'Flexible schedule. Training provided.',
    // Rolling: no deadline.
    workMode: 'onsite',
    compensation: { compensationType: 'unpaid', isPaid: false, minAmount: null, maxAmount: null, currency: 'USD', period: null, rawText: null },
    locations: [LOCATIONS.columbus],
    educationLevels: [LEVELS.highSchool],
    fields: [FIELDS.publicHealth],
    categories: [CATEGORIES.volunteer],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000006',
    title: 'Past Research Fellowship',
    slug: 'past-research-fellowship',
    organization: ORGANIZATIONS.campusLab,
    summary: 'A year-long fellowship in applied machine learning.',
    description: 'Applications for this cycle are closed.',
    applicationDeadline: daysFromNow(-14),
    workMode: 'remote',
    status: 'closed',
    compensation: { compensationType: 'stipend', isPaid: true, minAmount: '1000.00', maxAmount: '1000.00', currency: 'USD', period: 'month', rawText: null },
    educationLevels: [LEVELS.graduate],
    fields: [FIELDS.computerScience],
    categories: [CATEGORIES.fellowship, CATEGORIES.research],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000007',
    title: 'Summer Undergraduate Research Experience in Computational Biology, Machine Learning and Large-Scale Genomic Data Analysis',
    slug: 'summer-undergraduate-research-computational-biology',
    organization: ORGANIZATIONS.campusLab,
    // Null summary and description.
    applicationDeadline: daysFromNow(2),
    workMode: 'onsite',
    compensation: { compensationType: null, isPaid: null, minAmount: null, maxAmount: null, currency: null, period: null, rawText: 'Competitive stipend plus campus housing' },
    locations: [LOCATIONS.chicago, LOCATIONS.austin, LOCATIONS.newYork],
    educationLevels: [LEVELS.undergraduate],
    fields: [FIELDS.dataScience, FIELDS.computerScience],
    categories: [CATEGORIES.research],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000008',
    title: 'Product Design Fellowship',
    slug: 'product-design-fellowship',
    organization: ORGANIZATIONS.innovation,
    summary: 'Design and test a product with a cross-functional team.',
    description: 'This posting has expired.',
    applicationDeadline: daysFromNow(-3),
    workMode: 'hybrid',
    status: 'expired',
    compensation: paid('4000.00', '5000.00', 'month'),
    locations: [LOCATIONS.newYork],
    educationLevels: [LEVELS.undergraduate, LEVELS.graduate],
    fields: [FIELDS.engineering],
    categories: [CATEGORIES.fellowship],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000009',
    title: 'Open Source Mentorship Program',
    slug: 'open-source-mentorship-program',
    // No organization, no posted date, remote with no location.
    summary: 'Contribute to open source projects with a mentor for 12 weeks.',
    description: null,
    applicationDeadline: daysFromNow(90),
    postedAt: null,
    workMode: 'remote',
    workAuthorization: 'Open to international students',
    compensation: { compensationType: 'stipend', isPaid: true, minAmount: '3000.00', maxAmount: null, currency: 'USD', period: 'total', rawText: null },
    fields: [FIELDS.computerScience],
    categories: [CATEGORIES.internship],
  }),
  opportunity({
    id: '7d1c2b3a-0000-4000-8000-000000000010',
    title: 'Marketing Analytics Internship',
    slug: 'marketing-analytics-internship',
    organization: ORGANIZATIONS.foundation,
    summary: 'Measure campaign performance and build weekly dashboards.',
    description: 'Experience with spreadsheets required; SQL is a plus.',
    applicationDeadline: daysFromNow(20),
    workMode: 'onsite',
    workAuthorization: 'Must be authorized to work in the US',
    compensation: paid('18.00', '22.00', 'hour'),
    locations: [LOCATIONS.austin],
    educationLevels: [LEVELS.undergraduate],
    fields: [FIELDS.business, FIELDS.dataScience],
    categories: [CATEGORIES.internship],
  }),
];
