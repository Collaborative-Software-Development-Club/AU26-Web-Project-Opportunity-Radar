import { Issues, integer, readerFor, uuid } from '../../lib/validation';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../opportunities/opportunities.types';
import type { ListSavedQuery } from './saved.types';

export function parseListSavedQuery(payload: unknown): ListSavedQuery {
  const issues = new Issues();
  const query = readerFor(payload ?? {}, issues, 'query');
  query.rejectUnknown(['limit', 'offset']);
  const limit = query.field('limit', integer({ min: 1, max: MAX_PAGE_SIZE }));
  const offset = query.field('offset', integer({ min: 0, max: 1_000_000 }));
  issues.throwIfAny('Query parameters are invalid.');
  return { limit: limit ?? DEFAULT_PAGE_SIZE, offset: offset ?? 0 };
}

export function parseOpportunityId(value: unknown): string {
  const issues = new Issues();
  const id = readerFor({ opportunityId: value }, issues, 'path').field('opportunityId', uuid(), { required: true });
  issues.throwIfAny('Opportunity ID is invalid.');
  return id!;
}
