import type { ApiClient } from '@radar/api-client';
import type { OpportunityView } from '@radar/contracts';

// The sheet consumes contracts, never the discovery card's presentation props.
export type DetailRecord = {
  opportunity: OpportunityView;
  preview?: {
    organizationSubtitle?: string;
    badges?: string[];
    eventDate?: string;
    audience?: string;
    shortName?: string;
    color?: string;
  };
};
export type RelatedKind = 'organization' | 'similar';
export interface DetailSource {
  kind: 'api' | 'preview';
  get(id: string, signal: AbortSignal): Promise<DetailRecord>;
  related(record: DetailRecord, kind: RelatedKind, signal: AbortSignal): Promise<DetailRecord[]>;
}

export function createApiDetailSource(api: ApiClient): DetailSource {
  return {
    kind: 'api',
    get: async (id, signal) => ({ opportunity: await api.opportunities.get(id, { signal }) }),
    async related({ opportunity }, kind, signal) {
      const filter = kind === 'organization'
        ? opportunity.organizationId && { organizationId: opportunity.organizationId }
        : opportunity.categories[0] && { category: opportunity.categories[0].slug };
      if (!filter) return [];
      const { data } = await api.opportunities.list({ ...filter, status: 'active', limit: 20 }, { signal });
      return data.filter(item => item.id !== opportunity.id && (kind !== 'similar'
        || !opportunity.organizationId || item.organizationId !== opportunity.organizationId))
        .map(item => ({ opportunity: item }));
    },
  };
}

export function isHttpUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

export function canApply(opportunity: OpportunityView, now = Date.now()): boolean {
  const deadline = opportunity.applicationDeadline;
  return opportunity.status === 'active' && isHttpUrl(opportunity.applicationUrl)
    && (deadline === null || Date.parse(deadline) >= now);
}

export function compensationLabel(value: OpportunityView['compensation']): string | null {
  if (!value) return null;
  if (value.isPaid === false) return 'Unpaid';
  if (value.rawText) return value.rawText;
  const amount = (raw: string) => {
    const number = Number(raw);
    if (!Number.isFinite(number)) return raw;
    if (!value.currency) return number.toLocaleString();
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: value.currency, maximumFractionDigits: 2 }).format(number); }
    catch { return `${value.currency} ${number.toLocaleString()}`; }
  };
  const range = value.minAmount != null
    ? `${amount(value.minAmount)}${value.maxAmount != null && value.maxAmount !== value.minAmount ? `–${amount(value.maxAmount)}` : ''}`
    : value.maxAmount != null ? `Up to ${amount(value.maxAmount)}` : null;
  return range ? `${range}${value.period ? ` / ${value.period}` : ''}` : value.isPaid ? 'Paid' : null;
}

export const locationLabel = (opportunity: OpportunityView) => opportunity.locations.map(location =>
  [location.city, location.stateRegion, location.country].filter(Boolean).join(', '),
).join(' · ');

export function dateLabel(value: string | null): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
