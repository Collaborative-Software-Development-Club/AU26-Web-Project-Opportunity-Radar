import { FOREIGN_KEY_VIOLATION, databaseFailure } from '../../lib/database-error';
import { notFound } from '../../lib/http-error';
import type { ListSavedQuery, ListSavedResult, SavedRepository } from './saved.types';

export function createSavedService(resolveRepository: () => Promise<SavedRepository>) {
  const forUser = async <T>(clerkUserId: string, operation: (repository: SavedRepository, userId: string) => Promise<T>) => {
    const repository = await resolveRepository();
    const userId = await repository.findUserId(clerkUserId);
    if (!userId) throw notFound('User not found.');
    return operation(repository, userId);
  };

  return {
    list(clerkUserId: string, query: ListSavedQuery): Promise<ListSavedResult> {
      return forUser(clerkUserId, (repository, userId) => repository.list(userId, query));
    },

    save(clerkUserId: string, opportunityId: string): Promise<void> {
      return forUser(clerkUserId, async (repository, userId) => {
        try {
          await repository.save(userId, opportunityId);
        } catch (error) {
          if (databaseFailure(error).code === FOREIGN_KEY_VIOLATION) throw notFound('Opportunity not found.');
          throw error;
        }
      });
    },

    remove(clerkUserId: string, opportunityId: string): Promise<void> {
      return forUser(clerkUserId, (repository, userId) => repository.remove(userId, opportunityId));
    },
  };
}

export type SavedService = ReturnType<typeof createSavedService>;
