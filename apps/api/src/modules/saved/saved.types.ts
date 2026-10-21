import type { SavedOpportunityView } from '@radar/contracts';

export type { SavedOpportunityView };

export type ListSavedQuery = { limit: number; offset: number };

export type ListSavedResult = { items: SavedOpportunityView[]; total: number };

export type SavedRepository = {
  findUserId(clerkUserId: string): Promise<string | null>;
  list(userId: string, query: ListSavedQuery): Promise<ListSavedResult>;
  save(userId: string, opportunityId: string): Promise<void>;
  remove(userId: string, opportunityId: string): Promise<void>;
};
