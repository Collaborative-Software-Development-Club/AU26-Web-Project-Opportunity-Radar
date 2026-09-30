import { badRequest } from '../../lib/http-error';
import { Issues, type ObjectReader, definedOnly, httpUrl, integer, matching, readerFor, text, uuid } from '../../lib/validation';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../opportunities/opportunities.types';
import type { CreateOrganizationInput, ListOrganizationsQuery, UpdateOrganizationInput } from './organizations.types';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ORGANIZATION_KEYS = ['name', 'slug', 'websiteUrl', 'logoUrl'] as const;

const QUERY_KEYS = ['limit', 'offset', 'q'] as const;

function readFields(body: ObjectReader, required: boolean): UpdateOrganizationInput {
  return {
    name: body.field('name', text({ max: 255 }), { required }),
    slug: body.field('slug', matching(SLUG, 'must be lowercase letters and digits separated by single hyphens', 255), { required }),
    websiteUrl: body.field('websiteUrl', httpUrl(), { nullable: true }),
    logoUrl: body.field('logoUrl', httpUrl(), { nullable: true }),
  };
}

export function parseCreateOrganization(payload: unknown): CreateOrganizationInput {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(ORGANIZATION_KEYS);
  const fields = readFields(body, true);
  issues.throwIfAny('Organization payload is invalid.');

  const { name, slug, ...rest } = definedOnly(fields);
  return { ...rest, name: name!, slug: slug! };
}

export function parseUpdateOrganization(payload: unknown): UpdateOrganizationInput {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(ORGANIZATION_KEYS);
  const changes = definedOnly(readFields(body, false));
  issues.throwIfAny('Organization payload is invalid.');

  if (!Object.keys(changes).length) throw badRequest('Provide at least one field to update.');
  return changes;
}

export function parseListOrganizationsQuery(payload: unknown): ListOrganizationsQuery {
  const issues = new Issues();
  const query = readerFor(payload ?? {}, issues, 'query');
  query.rejectUnknown(QUERY_KEYS);
  const limit = query.field('limit', integer({ min: 1, max: MAX_PAGE_SIZE }));
  const offset = query.field('offset', integer({ min: 0, max: 1_000_000 }));
  const q = query.field('q', text({ max: 255 }));
  issues.throwIfAny('Query parameters are invalid.');

  return { limit: limit ?? DEFAULT_PAGE_SIZE, offset: offset ?? 0, ...definedOnly({ q }) };
}

export function parseOrganizationId(value: unknown): string {
  const issues = new Issues();
  const id = readerFor({ id: value }, issues, 'path').field('id', uuid(), { required: true });
  issues.throwIfAny('Organization ID is invalid.');
  return id!;
}
