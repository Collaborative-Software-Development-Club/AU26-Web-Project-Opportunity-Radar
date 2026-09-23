// TODO: Implement business logic for opportunities.
// Business rules for opportunities: duplicate detection, cross-field invariants that need
// the stored row, and turning database constraint violations into honest status codes.
import { HttpError, conflict, notFound, unprocessable } from '../../lib/http-error';
import type {
  CreateOpportunityInput, ListOpportunitiesQuery, ListOpportunitiesResult,
  OpportunitiesRepository, OpportunityView, UpdateOpportunityInput,
} from './opportunities.types';

const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

type DatabaseFailure = { code?: string; constraint?: string };

// Postgres drivers expose SQLSTATE on the error, sometimes only on a wrapped cause.
function databaseFailure(error: unknown): DatabaseFailure {
  for (const candidate of [error, error instanceof Error ? error.cause : undefined]) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const { code, constraint } = candidate as Record<string, unknown>;
    if (typeof code === 'string') {
      return { code, constraint: typeof constraint === 'string' ? constraint : undefined };
    }
  }
  return {};
}

// The unique indexes are the real guard: pre-checks can always lose a race.
function translate(error: unknown): HttpError | undefined {
  const { code, constraint } = databaseFailure(error);
  if (code === UNIQUE_VIOLATION) {
    if (constraint?.includes('slug')) return conflict('An opportunity with this slug already exists.');
    if (constraint?.includes('external_id')) return conflict('An opportunity with this sourceName and externalId already exists.');
    return conflict('Opportunity conflicts with an existing record.');
  }
  if (code === FOREIGN_KEY_VIOLATION) {
    return constraint?.includes('organization')
      ? unprocessable('Referenced organization does not exist.')
      : conflict('A referenced record changed while the request was in flight; retry.');
  }
  return undefined;
}

function assertCoherentDates(deadline: Date | null | undefined, posted: Date | null | undefined): void {
  // A deadline before the posting date means an upstream parser got it wrong.
  if (deadline && posted && deadline.getTime() < posted.getTime()) {
    throw unprocessable('applicationDeadline must not precede postedAt.');
  }
}

const asDate = (value: string | null): Date | null => value === null ? null : new Date(value);

export function createOpportunitiesService(resolveRepository: () => Promise<OpportunitiesRepository>) {
  const run = async <T>(operation: (repository: OpportunitiesRepository) => Promise<T>): Promise<T> => {
    const repository = await resolveRepository();
    try {
      return await operation(repository);
    } catch (error) {
      throw translate(error) ?? error;
    }
  };

  async function assertSlugAvailable(repository: OpportunitiesRepository, slug: string): Promise<void> {
    if (await repository.findBySlug(slug)) throw conflict(`An opportunity with slug "${slug}" already exists.`);
  }

  async function assertSourceAvailable(
    repository: OpportunitiesRepository,
    sourceName: string | null | undefined,
    externalId: string | null | undefined,
    allowedId?: string,
  ): Promise<void> {
    if (!sourceName || !externalId) return;
    const existing = await repository.findBySourceIdentity(sourceName, externalId);
    if (existing && existing.id !== allowedId) {
      throw conflict(`An opportunity from "${sourceName}" with externalId "${externalId}" already exists.`);
    }
  }

  return {
    list(query: ListOpportunitiesQuery): Promise<ListOpportunitiesResult> {
      return run(repository => repository.list(query));
    },

    getById(id: string): Promise<OpportunityView> {
      return run(async repository => {
        const opportunity = await repository.findById(id);
        if (!opportunity) throw notFound('Opportunity not found.');
        return opportunity;
      });
    },

    create(input: CreateOpportunityInput): Promise<OpportunityView> {
      return run(async repository => {
        assertCoherentDates(input.applicationDeadline, input.postedAt);
        await assertSlugAvailable(repository, input.slug);
        await assertSourceAvailable(repository, input.sourceName, input.externalId);
        return repository.create(input);
      });
    },

    update(id: string, input: UpdateOpportunityInput): Promise<OpportunityView> {
      return run(async repository => {
        const existing = await repository.findById(id);
        if (!existing) throw notFound('Opportunity not found.');

        const { fields } = input;
        
        assertCoherentDates(
          fields.applicationDeadline !== undefined ? fields.applicationDeadline : asDate(existing.applicationDeadline),
          fields.postedAt !== undefined ? fields.postedAt : asDate(existing.postedAt),
        );
        if (fields.slug !== undefined && fields.slug !== existing.slug) {
          await assertSlugAvailable(repository, fields.slug);
        }
        if (fields.sourceName !== undefined || fields.externalId !== undefined) {
          await assertSourceAvailable(
            repository,
            fields.sourceName !== undefined ? fields.sourceName : existing.sourceName,
            fields.externalId !== undefined ? fields.externalId : existing.externalId,
            id,
          );
        }

        const updated = await repository.update(id, input);
        // Deleted between the read and the write.
        if (!updated) throw notFound('Opportunity not found.');
        return updated;
      });
    },

    remove(id: string): Promise<void> {
      return run(async repository => {
        if (!await repository.remove(id)) throw notFound('Opportunity not found.');
      });
    },
  };
}

export type OpportunitiesService = ReturnType<typeof createOpportunitiesService>;
