import type { UserProfileView } from '@radar/contracts';
import { FOREIGN_KEY_VIOLATION, databaseFailure } from '../../lib/database-error';
import { badRequest, conflict, notFound } from '../../lib/http-error';
import { RELATION_KEYS, assertReferencesExist, readRelations } from '../../lib/relation-ids';
import { Issues, readerFor, text, definedOnly } from '../../lib/validation';
import type { UserUpdate, UsersRepository } from './users.types';

export function parseUpdateUser(payload: unknown): UserUpdate {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(['firstName', 'lastName', ...RELATION_KEYS]);

  const data = definedOnly({
    // Empty names remain allowed, matching the Clerk webhook.
    firstName: body.field('firstName', text({ max: 100, min: 0 })),
    lastName: body.field('lastName', text({ max: 100, min: 0 })),
    ...readRelations(body, { rejectDuplicates: true }),
  });

  issues.throwIfAny('Invalid user fields.');
  if (Object.keys(data).length === 0) throw badRequest('Provide at least one user field.');
  return data;
}

export function createUsersService(resolveRepository: () => Promise<UsersRepository>) {
  return {
    async getCurrentUser(clerkUserId: string): Promise<UserProfileView> {
      const repository = await resolveRepository();
      const user = await repository.getUserByClerkId(clerkUserId);
      if (!user) throw notFound('User not found.');
      return user;
    },

    async updateUser(clerkUserId: string, data: UserUpdate): Promise<UserProfileView> {
      const repository = await resolveRepository();
      if (!await repository.getUserByClerkId(clerkUserId)) throw notFound('User not found.');
      await assertReferencesExist(repository, data);
      try {
        const user = await repository.updateUser(clerkUserId, data);
        if (!user) throw notFound('User not found.');
        return user;
      } catch (error) {
        if (databaseFailure(error).code === FOREIGN_KEY_VIOLATION) {
          throw conflict('A referenced record changed while the request was in flight; retry.');
        }
        throw error;
      }
    },

    async deleteUser(clerkUserId: string): Promise<void> {
      const repository = await resolveRepository();
      if (!await repository.deleteUser(clerkUserId)) throw notFound('User not found.');
    },
  };
}

export type UsersService = ReturnType<typeof createUsersService>;
