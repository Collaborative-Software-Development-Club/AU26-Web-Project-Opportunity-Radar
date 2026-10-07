// Draft-only data for the discovery page, shaped exactly like the API's OpportunityView
// so the feed can switch to real data without touching the components.
import type {
  CategoryView,
  CompensationView,
  EducationLevelView,
  FieldView,
  LocationView,
  OpportunityView,
  OrganizationSummary,
} from "@radar/contracts";

const TIMESTAMP = "2026-09-01T00:00:00.000Z";

function uuid(n: number) {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

// Lookup tables
export const MOCK_CATEGORIES = {
  scholarships: { id: 1, name: "Scholarships", slug: "scholarships" },
  competitions: { id: 2, name: "Competitions", slug: "competitions" },
  careerEvents: { id: 3, name: "Career Events", slug: "career-events" },
  jobs: { id: 4, name: "Jobs & Internships", slug: "jobs-internships" },
} satisfies Record<string, CategoryView>;

const FIELDS = {
  programming: { id: 1, name: "Programming", slug: "programming" },
  research: { id: 2, name: "Research", slug: "research" },
  business: { id: 3, name: "Business", slug: "business" },
  dataScience: { id: 4, name: "Data Science", slug: "data-science" },
  design: { id: 5, name: "Design", slug: "design" },
  publicService: { id: 6, name: "Public Service", slug: "public-service" },
} satisfies Record<string, FieldView>;

const EDUCATION_LEVELS = {
  undergraduate: { id: 1, name: "Undergraduate", sortOrder: 1 },
  graduate: { id: 2, name: "Graduate", sortOrder: 2 },
} satisfies Record<string, EducationLevelView>;

function location(n: number, city: string, stateRegion: string): LocationView {
  return {
    id: uuid(100 + n),
    city,
    stateRegion,
    country: "United States",
    countryCode: "US",
    latitude: null,
    longitude: null,
  };
}

function organization(
  n: number,
  name: string,
  slug: string,
): OrganizationSummary {
  return { id: uuid(200 + n), name, slug, websiteUrl: null, logoUrl: null };
}

function compensation(fields: Partial<CompensationView>): CompensationView {
  return {
    compensationType: null,
    isPaid: null,
    minAmount: null,
    maxAmount: null,
    currency: "USD",
    period: null,
    rawText: null,
    ...fields,
  };
}

// Fills the columns the discovery UI doesn't care about.
function opportunity(
  n: number,
  fields: Pick<
    OpportunityView,
    "title" | "slug" | "organization" | "categories"
  > &
    Partial<OpportunityView>,
): OpportunityView {
  return {
    id: uuid(n),
    organizationId: fields.organization?.id ?? null,
    summary: null,
    description: null,
    applicationUrl: `https://example.com/${fields.slug}`,
    sourceUrl: `https://example.com/${fields.slug}`,
    applicationDeadline: null,
    workMode: null,
    workAuthorization: null,
    externalId: null,
    sourceType: "seed",
    sourceName: "mock",
    postedAt: TIMESTAMP,
    firstSeenAt: TIMESTAMP,
    lastVerifiedAt: TIMESTAMP,
    status: "active",
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    compensation: null,
    locations: [],
    educationLevels: [],
    fields: [],
    ...fields,
  };
}

export const MOCK_OPPORTUNITIES: OpportunityView[] = [
  // Scholarships
  opportunity(1, {
    title: "Fulbright U.S. Student Program",
    slug: "fulbright-us-student-program",
    organization: organization(
      1,
      "U.S. Department of State",
      "us-department-of-state",
    ),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2026-12-10T12:00:00.000Z",
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "50000.00",
      period: "total",
      rawText: "Up to $50,000",
    }),
  }),
  opportunity(2, {
    title: "Gates Millennium Scholars Program",
    slug: "gates-millennium-scholars-program",
    organization: organization(
      2,
      "Bill & Melinda Gates Foundation",
      "gates-foundation",
    ),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2027-01-15T12:00:00.000Z",
    educationLevels: [EDUCATION_LEVELS.undergraduate],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      period: "total",
      rawText: "Full Ride",
    }),
  }),
  opportunity(3, {
    title: "Knight-Hennessy Scholars",
    slug: "knight-hennessy-scholars",
    organization: organization(3, "Stanford University", "stanford-university"),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2026-10-04T12:00:00.000Z",
    educationLevels: [EDUCATION_LEVELS.graduate],
  }),
  opportunity(13, {
    title: "Rhodes Scholarship",
    slug: "rhodes-scholarship",
    organization: organization(13, "Rhodes Trust", "rhodes-trust"),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2026-10-07T12:00:00.000Z",
    educationLevels: [EDUCATION_LEVELS.graduate],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      period: "total",
      rawText: "Full Funding",
    }),
  }),
  opportunity(14, {
    title: "Goldwater Scholarship",
    slug: "goldwater-scholarship",
    organization: organization(
      14,
      "Barry Goldwater Scholarship Foundation",
      "goldwater-foundation",
    ),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2027-01-29T12:00:00.000Z",
    educationLevels: [EDUCATION_LEVELS.undergraduate],
    fields: [FIELDS.research],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "7500.00",
      period: "year",
      rawText: "Up to $7,500",
    }),
  }),
  opportunity(15, {
    title: "Truman Scholarship",
    slug: "truman-scholarship",
    organization: organization(
      15,
      "Harry S. Truman Scholarship Foundation",
      "truman-foundation",
    ),
    categories: [MOCK_CATEGORIES.scholarships],
    applicationDeadline: "2027-02-02T12:00:00.000Z",
    educationLevels: [EDUCATION_LEVELS.undergraduate],
    fields: [FIELDS.publicService],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "30000.00",
      period: "total",
      rawText: "$30,000",
    }),
  }),

  // Competitions
  opportunity(4, {
    title: "MIT $100K Entrepreneurship Competition",
    slug: "mit-100k-entrepreneurship-competition",
    organization: organization(4, "MIT Sloan", "mit-sloan"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2026-11-30T12:00:00.000Z",
    fields: [FIELDS.business],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "100000.00",
      period: "one-time",
      rawText: "$100,000 Prize",
    }),
  }),
  opportunity(5, {
    title: "ACM ICPC World Finals",
    slug: "acm-icpc-world-finals",
    organization: organization(5, "Association for Computing Machinery", "acm"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2026-09-30T12:00:00.000Z",
    fields: [FIELDS.programming],
  }),
  opportunity(6, {
    title: "Regeneron Science Talent Search",
    slug: "regeneron-science-talent-search",
    organization: organization(6, "Society for Science", "society-for-science"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2026-11-12T12:00:00.000Z",
    fields: [FIELDS.research],
  }),
  opportunity(16, {
    title: "Hult Prize Challenge",
    slug: "hult-prize-challenge",
    organization: organization(16, "Hult Prize Foundation", "hult-prize"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2026-12-05T12:00:00.000Z",
    fields: [FIELDS.business],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "1000000.00",
      period: "one-time",
      rawText: "$1M Prize",
    }),
  }),
  opportunity(17, {
    title: "Space Apps Challenge",
    slug: "nasa-space-apps-challenge",
    organization: organization(11, "NASA", "nasa"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2026-10-25T12:00:00.000Z",
    workMode: "hybrid",
    fields: [FIELDS.dataScience],
  }),
  opportunity(18, {
    title: "Imagine Cup",
    slug: "microsoft-imagine-cup",
    organization: organization(10, "Microsoft", "microsoft"),
    categories: [MOCK_CATEGORIES.competitions],
    applicationDeadline: "2027-01-15T12:00:00.000Z",
    fields: [FIELDS.programming],
    compensation: compensation({
      compensationType: "award",
      isPaid: true,
      maxAmount: "100000.00",
      period: "one-time",
      rawText: "$100,000 Prize",
    }),
  }),

  // Career events
  opportunity(7, {
    title: "Google Tech Talk: AI in Healthcare",
    slug: "google-tech-talk-ai-in-healthcare",
    organization: organization(7, "Google", "google"),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "remote",
  }),
  opportunity(8, {
    title: "Fall Engineering Career Fair",
    slug: "cmu-fall-engineering-career-fair",
    organization: organization(
      8,
      "Carnegie Mellon University",
      "carnegie-mellon-university",
    ),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "onsite",
    locations: [location(1, "Pittsburgh", "PA")],
  }),
  opportunity(9, {
    title: "Women in Tech Leadership Summit",
    slug: "women-in-tech-leadership-summit",
    organization: organization(9, "Lean In", "lean-in"),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "hybrid",
    locations: [location(2, "San Francisco", "CA")],
  }),
  opportunity(19, {
    title: "Work at a Startup Virtual Fair",
    slug: "yc-work-at-a-startup-virtual-fair",
    organization: organization(17, "Y Combinator", "y-combinator"),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "remote",
  }),
  opportunity(20, {
    title: "Diversity in Finance Networking Night",
    slug: "jpmorgan-diversity-in-finance-night",
    organization: organization(18, "J.P. Morgan", "jp-morgan"),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "onsite",
    locations: [location(6, "New York", "NY")],
  }),
  opportunity(21, {
    title: "Product Management Workshop",
    slug: "meta-product-management-workshop",
    organization: organization(19, "Meta", "meta"),
    categories: [MOCK_CATEGORIES.careerEvents],
    workMode: "hybrid",
    locations: [location(7, "Menlo Park", "CA")],
  }),

  // Jobs & internships
  opportunity(10, {
    title: "Software Engineering Intern, Summer 2027",
    slug: "microsoft-swe-intern-summer-2027",
    organization: organization(10, "Microsoft", "microsoft"),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2026-11-01T12:00:00.000Z",
    workMode: "onsite",
    locations: [location(3, "Redmond", "WA")],
    fields: [FIELDS.programming],
    compensation: compensation({
      compensationType: "pay",
      isPaid: true,
      minAmount: "45.00",
      maxAmount: "55.00",
      period: "hour",
      rawText: "$45–55/hr",
    }),
  }),
  opportunity(11, {
    title: "Pathways Internship Program",
    slug: "nasa-pathways-internship",
    organization: organization(11, "NASA", "nasa"),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2026-12-01T12:00:00.000Z",
    workMode: "onsite",
    workAuthorization: "U.S. citizens only",
    locations: [location(4, "Houston", "TX")],
    fields: [FIELDS.research],
  }),
  opportunity(12, {
    title: "Summer Analyst Program",
    slug: "goldman-sachs-summer-analyst",
    organization: organization(12, "Goldman Sachs", "goldman-sachs"),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2026-10-20T12:00:00.000Z",
    workMode: "onsite",
    locations: [location(5, "New York", "NY")],
    fields: [FIELDS.business],
    compensation: compensation({
      compensationType: "pay",
      isPaid: true,
      period: "week",
      rawText: "Paid",
    }),
  }),
  opportunity(22, {
    title: "Data Science Intern",
    slug: "spotify-data-science-intern",
    organization: organization(20, "Spotify", "spotify"),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2026-11-15T12:00:00.000Z",
    workMode: "hybrid",
    locations: [location(8, "New York", "NY")],
    fields: [FIELDS.dataScience],
    compensation: compensation({
      compensationType: "pay",
      isPaid: true,
      minAmount: "40.00",
      period: "hour",
      rawText: "$40/hr",
    }),
  }),
  opportunity(23, {
    title: "Undergraduate Research Assistant",
    slug: "nrel-undergraduate-research-assistant",
    organization: organization(
      21,
      "National Renewable Energy Laboratory",
      "nrel",
    ),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2027-01-10T12:00:00.000Z",
    workMode: "onsite",
    locations: [location(9, "Golden", "CO")],
    educationLevels: [EDUCATION_LEVELS.undergraduate],
    fields: [FIELDS.research],
    compensation: compensation({
      compensationType: "stipend",
      isPaid: true,
      period: "month",
      rawText: "Stipend",
    }),
  }),
  opportunity(24, {
    title: "Product Design Intern",
    slug: "figma-product-design-intern",
    organization: organization(22, "Figma", "figma"),
    categories: [MOCK_CATEGORIES.jobs],
    applicationDeadline: "2026-12-12T12:00:00.000Z",
    workMode: "remote",
    fields: [FIELDS.design],
    compensation: compensation({
      compensationType: "pay",
      isPaid: true,
      minAmount: "38.00",
      period: "hour",
      rawText: "$38/hr",
    }),
  }),
];
