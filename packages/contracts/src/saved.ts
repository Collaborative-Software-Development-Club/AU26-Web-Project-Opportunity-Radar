// Saved opportunities (bookmarks) for the signed-in user.
import type { OpportunityView } from './opportunity';
import type { Paginated } from './pagination';

export type SavedOpportunityView = {
  opportunity: OpportunityView;
  savedAt: string;
};

export type SavedListResponse = Paginated<SavedOpportunityView>;
