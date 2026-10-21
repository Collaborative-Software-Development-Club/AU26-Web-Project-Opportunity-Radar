// Saved opportunities (bookmarks) for the signed-in user.
import type { OpportunityView } from './opportunity';
import type { Paginated } from './pagination';

export type SavedOpportunityView = {
  opportunity: OpportunityView;
  savedAt: string;
};

export type SavedListResponse = Paginated<SavedOpportunityView>;

// Every saved opportunity ID, unpaginated, so save buttons can show their state.
export type SavedIdsResponse = { data: string[] };
