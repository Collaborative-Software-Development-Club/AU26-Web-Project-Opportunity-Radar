import { Issues, readerFor } from '../../lib/validation';

export function parseLookupQuery(payload: unknown): void {
  const issues = new Issues();
  readerFor(payload ?? {}, issues, 'query').rejectUnknown([]);
  issues.throwIfAny('Query parameters are invalid.');
}
