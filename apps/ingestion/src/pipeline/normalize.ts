import { RawOpportunity } from '../sources/types';

export interface NormalizedOpportunity extends RawOpportunity {
  updatedAt: string;
}

export function normalize(raw: RawOpportunity): NormalizedOpportunity {
  return {
    sourceType: raw.sourceType,
    sourceName: raw.sourceName,
    sourceUrl: raw.sourceUrl,
    externalId: raw.externalId,
    title: raw.title.trim(),
    applicationUrl: raw.applicationUrl,
    organization: raw.organization?.trim() || undefined,
    description: raw.description?.trim() || undefined,
    deadline: raw.deadline?.trim() || undefined,
    location: raw.location?.trim() || undefined,
    workMode: raw.workMode?.trim() || undefined,
    compensation: raw.compensation?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
}