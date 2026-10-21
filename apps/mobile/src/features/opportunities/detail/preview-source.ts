import type { OpportunityView } from '@radar/contracts';
import { mockData, type MockOpportunity } from '../../../mock/data';
import type { DetailRecord, DetailSource } from './detail-source';

export type PreviewCategory = keyof typeof mockData;
export const previewId = (category: PreviewCategory, id: number) => `preview:${category}:${id}`;

function adapt(item: MockOpportunity, category: PreviewCategory): DetailRecord {
  const id = previewId(category, item.id);
  return {
    opportunity: {
      id, title: item.title, slug: id, organizationId: item.company,
      organization: { id: item.company, name: item.company, slug: item.company, logoUrl: null, websiteUrl: null },
      summary: null,
      description: 'This is a fictional opportunity used to preview the mobile experience. Full details will appear here when discovery is connected to live opportunities.',
      applicationUrl: '', sourceUrl: '', applicationDeadline: null,
      workMode: null, workAuthorization: null, externalId: null, sourceType: null, sourceName: null,
      postedAt: null, firstSeenAt: '', lastVerifiedAt: null, status: 'active', createdAt: '', updatedAt: '',
      compensation: category === 'work' ? {
        compensationType: item.paid ? 'pay' : 'unpaid', isPaid: item.paid,
        minAmount: item.wage?.toString() ?? null, maxAmount: null, currency: 'USD', period: 'hour', rawText: null,
      } : null,
      locations: [], fields: [], educationLevels: [],
      categories: [{ id: 1, name: category === 'work' ? 'Job/Work' : category === 'event' ? 'Event' : 'Scholarship', slug: category }],
    },
    // Keep display-only mock fields out of the API contract. A display date is not a timestamp.
    preview: { badges: [item.oppType, item.applType], eventDate: `Apply by ${item.appDL}` },
  };
}

const records = (Object.keys(mockData) as PreviewCategory[]).flatMap(category => mockData[category].map(item => adapt(item, category)));

export function createPreviewSource(fixtures: DetailRecord[]): DetailSource {
  return {
    kind: 'preview',
    async get(id) {
      const record = fixtures.find(item => item.opportunity.id === id);
      if (!record) throw new Error('Preview opportunity not found.');
      return record;
    },
    async related({ opportunity }, kind) {
      return fixtures.filter(({ opportunity: item }) => item.id !== opportunity.id && (kind === 'organization'
        ? item.organizationId === opportunity.organizationId
        : item.organizationId !== opportunity.organizationId && item.categories.some(category => opportunity.categories.some(other => category.slug === other.slug))));
    },
  };
}

export const discoveryPreviewSource = createPreviewSource(records);

// Isolated visual reference fixture. Never substituted for a failed live API request.
const reference: OpportunityView = {
  ...records[0].opportunity, id: 'preview:figma', title: 'Hack OHI/O', organizationId: 'preview:ohio',
  organization: { id: 'preview:ohio', name: 'OHI/O', slug: 'ohio', logoUrl: null, websiteUrl: null },
  description: "Hack OHI/O is Ohio State's premier annual hackathon, bringing together students from across the country for 24 hours of coding, creativity, and collaboration. Build something amazing, connect with sponsors, and compete for prizes across multiple tracks including AI, sustainability, and social good.",
  compensation: null, categories: [{ id: 1, name: 'Event', slug: 'event' }],
  locations: [{ id: 'preview:columbus', city: 'Columbus', stateRegion: 'OH', country: '', countryCode: null, latitude: null, longitude: null }],
};
export const designPreviewRecords: DetailRecord[] = [
  { opportunity: reference, preview: { organizationSubtitle: 'The Ohio State University', badges: ['Hackathon', 'Free'], eventDate: 'Oct 24-25, 2026', audience: '~1,200 hackers' } },
  { opportunity: { ...reference, id: 'preview:workshop', title: 'Hack OHI/O Workshop Series', locations: [], description: 'Preview of a related workshop opportunity. Full workshop details will come from the opportunity API.' }, preview: { eventDate: 'Oct 2026', badges: ['Free'], shortName: 'H/O' } },
  { opportunity: { ...reference, id: 'preview:mhacks', organizationId: 'preview:umich', organization: { id: 'preview:umich', name: 'MHacks', slug: 'mhacks', websiteUrl: null, logoUrl: null }, title: 'MHacks 17 — UMich Hackathon', description: 'Preview of a similar hackathon opportunity. Full event details will come from the opportunity API.', locations: [{ ...reference.locations[0], city: 'Ann Arbor', stateRegion: 'MI' }] }, preview: { badges: ['Free'], shortName: 'ML', color: '#7453a6' } },
];
