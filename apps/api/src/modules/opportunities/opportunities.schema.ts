
import { badRequest } from '../../lib/http-error';
import {
  Issues, type Coercer, type ObjectReader,
  amount, definedOnly, flag, httpUrl, integer, invalid, matching, oneOf, readerFor, text, timestamp, uuid,
} from '../../lib/validation';
import {
  COMPENSATION_PERIODS, COMPENSATION_TYPES, DEFAULT_PAGE_SIZE, MAX_COMPENSATION_AMOUNT, MAX_PAGE_SIZE,
  OPPORTUNITY_STATUSES, SOURCE_TYPES, WORK_MODES,
  type CompensationWrite, type CreateOpportunityInput, type ListOpportunitiesQuery, type UpdateOpportunityInput,
} from './opportunities.types';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OPPORTUNITY_KEYS = [
  'organizationId', 'title', 'slug', 'summary', 'description', 'applicationUrl', 'sourceUrl',
  'applicationDeadline', 'workMode', 'workAuthorization', 'externalId', 'sourceType', 'sourceName',
  'postedAt', 'firstSeenAt', 'lastVerifiedAt', 'status', 'compensation',
] as const;

const COMPENSATION_KEYS = [
  'compensationType', 'isPaid', 'minAmount', 'maxAmount', 'currency', 'period', 'rawText',
] as const;

const QUERY_KEYS = ['limit', 'offset', 'status', 'organizationId', 'sourceName'] as const;

const currencyCode = (): Coercer<string> => (raw: any) => {
  const value = text({ max: 3, min: 3 })(raw).toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : invalid('must be a 3-letter ISO 4217 code');
};

const slug = () => matching(SLUG, 'must be lowercase letters and digits separated by single hyphens', 500);


function readFields(body: ObjectReader, required: boolean) {
  return {
    organizationId: body.field('organizationId', uuid(), { nullable: true }),
    title: body.field('title', text({ max: 500 }), { required }),
    slug: body.field('slug', slug(), { required }),
    summary: body.field('summary', text({ max: 5_000 }), { nullable: true }),
    description: body.field('description', text({ max: 50_000 }), { nullable: true }),
    applicationUrl: body.field('applicationUrl', httpUrl(), { required }),
    sourceUrl: body.field('sourceUrl', httpUrl(), { required }),
    applicationDeadline: body.field('applicationDeadline', timestamp(), { nullable: true }),
    workMode: body.field('workMode', oneOf(WORK_MODES), { nullable: true }),
    workAuthorization: body.field('workAuthorization', text({ max: 50 }), { nullable: true }),
    externalId: body.field('externalId', text({ max: 255 }), { nullable: true }),
    sourceType: body.field('sourceType', oneOf(SOURCE_TYPES), { nullable: true }),
    sourceName: body.field('sourceName', text({ max: 255 }), { nullable: true }),
    postedAt: body.field('postedAt', timestamp(), { nullable: true }),
    firstSeenAt: body.field('firstSeenAt', timestamp()),
    lastVerifiedAt: body.field('lastVerifiedAt', timestamp(), { nullable: true }),
    status: body.field('status', oneOf(OPPORTUNITY_STATUSES)),
  };
}

function readCompensation(body: ObjectReader): CompensationWrite | null | undefined {
  const compensation = body.nested('compensation', COMPENSATION_KEYS);
  if (compensation === undefined || compensation === null) return compensation;

  const values = {
    compensationType: compensation.field('compensationType', oneOf(COMPENSATION_TYPES), { nullable: true }),
    isPaid: compensation.field('isPaid', flag(), { nullable: true }),
    minAmount: compensation.field('minAmount', amount({ max: MAX_COMPENSATION_AMOUNT }), { nullable: true }),
    maxAmount: compensation.field('maxAmount', amount({ max: MAX_COMPENSATION_AMOUNT }), { nullable: true }),
    currency: compensation.field('currency', currencyCode(), { nullable: true }),
    period: compensation.field('period', oneOf(COMPENSATION_PERIODS), { nullable: true }),
    rawText: compensation.field('rawText', text({ max: 2_000 }), { nullable: true }),
  };

  const min = values.minAmount == null ? undefined : Number(values.minAmount);
  const max = values.maxAmount == null ? undefined : Number(values.maxAmount);
  if (min !== undefined && max !== undefined && min > max) {
    compensation.issues.add('compensation.minAmount', 'must not exceed compensation.maxAmount');
  }
  const hasAmount = min !== undefined || max !== undefined;
  if (hasAmount && values.isPaid === false) {
    compensation.issues.add('compensation.isPaid', 'must not be false when an amount is provided');
  }
  if (hasAmount && values.period == null) {
    compensation.issues.add('compensation.period', 'is required when an amount is provided');
  }

  return {
    compensationType: values.compensationType ?? null,
    isPaid: values.isPaid ?? null,
    minAmount: values.minAmount ?? null,
    maxAmount: values.maxAmount ?? null,
    currency: values.currency ?? 'USD',
    period: values.period ?? null,
    rawText: values.rawText ?? null,
  };
}

function ensure<T>(value: T | null | undefined, field: string): T {
  if (value === null || value === undefined) throw badRequest('Opportunity payload is invalid.', [{ field, message: 'is required' }]);
  return value;
}

export function parseCreateOpportunity(payload: unknown): CreateOpportunityInput {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(OPPORTUNITY_KEYS);
  const fields = readFields(body, true);
  const compensation = readCompensation(body);
  issues.throwIfAny('Opportunity payload is invalid.');

  return {
    ...definedOnly(fields),
    title: ensure(fields.title, 'title'),
    slug: ensure(fields.slug, 'slug'),
    applicationUrl: ensure(fields.applicationUrl, 'applicationUrl'),
    sourceUrl: ensure(fields.sourceUrl, 'sourceUrl'),
    ...(compensation ? { compensation } : {}),
  };
}

export function parseUpdateOpportunity(payload: unknown): UpdateOpportunityInput {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(OPPORTUNITY_KEYS);
  const fields = readFields(body, false);
  const compensation = readCompensation(body);
  issues.throwIfAny('Opportunity payload is invalid.');

  const changes = definedOnly(fields);
  if (!Object.keys(changes).length && compensation === undefined) {
    throw badRequest('Provide at least one field to update.');
  }
  return { fields: changes, compensation };
}

export function parseListQuery(payload: unknown): ListOpportunitiesQuery {
  const issues = new Issues();
  const query = readerFor(payload ?? {}, issues, 'query');
  query.rejectUnknown(QUERY_KEYS);
  const limit = query.field('limit', integer({ min: 1, max: MAX_PAGE_SIZE }));
  const offset = query.field('offset', integer({ min: 0, max: 1_000_000 }));
  const filters = {
    status: query.field('status', oneOf(OPPORTUNITY_STATUSES)),
    organizationId: query.field('organizationId', uuid()),
    sourceName: query.field('sourceName', text({ max: 255 })),
  };
  issues.throwIfAny('Query parameters are invalid.');

  return { limit: limit ?? DEFAULT_PAGE_SIZE, offset: offset ?? 0, ...definedOnly(filters) };
}

export function parseOpportunityId(value: unknown): string {
  const issues = new Issues();
  const params = readerFor({ id: value }, issues, 'path');
  const id = params.field('id', uuid(), { required: true });
  issues.throwIfAny('Opportunity ID is invalid.');
  return ensure(id, 'id');
}
