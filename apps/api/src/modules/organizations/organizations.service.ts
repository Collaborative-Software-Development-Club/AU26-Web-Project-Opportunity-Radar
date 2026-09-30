import { FOREIGN_KEY_VIOLATION, UNIQUE_VIOLATION, databaseFailure } from '../../lib/database-error';
import { HttpError, conflict, notFound } from '../../lib/http-error';
import type {
  CreateOrganizationInput, ListOrganizationsQuery, ListOrganizationsResult,
  OrganizationDetail, OrganizationsRepository, OrganizationView, UpdateOrganizationInput,
} from './organizations.types';

export function translate(error: unknown): HttpError | undefined {
  const { code } = databaseFailure(error);
  if (code === UNIQUE_VIOLATION) return conflict('An organization with this slug already exists.');
  if (code === FOREIGN_KEY_VIOLATION) {
    return conflict('Organization still has opportunities; delete or reassign them first.');
  }
  return undefined;
}

export function createOrganizationsService(resolveRepository: () => Promise<OrganizationsRepository>) {
  const run = async <T>(operation: (repository: OrganizationsRepository) => Promise<T>): Promise<T> => {
    const repository = await resolveRepository();
    try {
      return await operation(repository);
    } catch (error) {
      throw translate(error) ?? error;
    }
  };

  async function assertSlugAvailable(repository: OrganizationsRepository, slug: string, allowedId?: string) {
    const existing = await repository.findBySlug(slug);
    if (existing && existing.id !== allowedId) throw conflict(`An organization with slug "${slug}" already exists.`);
  }

  return {
    list(query: ListOrganizationsQuery): Promise<ListOrganizationsResult> {
      return run(repository => repository.list(query));
    },

    getById(id: string): Promise<OrganizationDetail> {
      return run(async repository => {
        const organization = await repository.findById(id);
        if (!organization) throw notFound('Organization not found.');
        return organization;
      });
    },

    create(input: CreateOrganizationInput): Promise<OrganizationView> {
      return run(async repository => {
        await assertSlugAvailable(repository, input.slug);
        return repository.create(input);
      });
    },

    update(id: string, input: UpdateOrganizationInput): Promise<OrganizationView> {
      return run(async repository => {
        if (input.slug !== undefined) await assertSlugAvailable(repository, input.slug, id);
        const updated = await repository.update(id, input);
        if (!updated) throw notFound('Organization not found.');
        return updated;
      });
    },

    remove(id: string): Promise<void> {
      return run(async repository => {
        if (!await repository.remove(id)) throw notFound('Organization not found.');
      });
    },
  };
}

export type OrganizationsService = ReturnType<typeof createOrganizationsService>;
