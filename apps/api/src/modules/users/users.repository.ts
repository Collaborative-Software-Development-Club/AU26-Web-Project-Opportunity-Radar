import { db, users, userLocations, userEducationLevels, userFields, userCategories } from '@radar/database';
import type { NewUser } from '@radar/database/schema';
import { eq } from 'drizzle-orm';
import {
  findMissingReferences, relationDeletes, relationInserts, type RelationTables, type Statement,
} from '../../lib/relation-repository';
import type { UserUpdate, UsersRepository } from './users.types';
import { toUserProfileView } from './users.view';

// Clerk provides these fields when the signup webhook creates a user.
export type ClerkUserInsert = Pick<NewUser, 'clerkUserId' | 'email' | 'firstName' | 'lastName'>;

const WITH_PREFERENCES = {
  locations: { with: { location: true } },
  educationLevels: { with: { educationLevel: true } },
  fields: { with: { field: true } },
  categories: { with: { category: true } },
} as const;

const RELATION_TABLES = {
  locationIds: {
    table: userLocations, ownerColumn: userLocations.userId,
    ownerKey: 'userId', lookupKey: 'locationId',
  },
  educationLevelIds: {
    table: userEducationLevels, ownerColumn: userEducationLevels.userId,
    ownerKey: 'userId', lookupKey: 'educationLevelId',
  },
  fieldIds: {
    table: userFields, ownerColumn: userFields.userId,
    ownerKey: 'userId', lookupKey: 'fieldId',
  },
  categoryIds: {
    table: userCategories, ownerColumn: userCategories.userId,
    ownerKey: 'userId', lookupKey: 'categoryId',
  },
} satisfies RelationTables;

// Keep this function for the existing Clerk webhook.
export async function insertClerkUser(user: ClerkUserInsert): Promise<void> {
  // Only Clerk ID conflicts are ignored; email conflicts must still surface.
  await db.insert(users).values(user).onConflictDoNothing({ target: users.clerkUserId });
}

export async function getUserByClerkId(clerkUserId: string) {
  const row = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
    with: WITH_PREFERENCES,
  });
  return row ? toUserProfileView(row) : undefined;
}

export async function updateUser(clerkUserId: string, data: UserUpdate) {
  // Join tables use the internal UUID, never the Clerk identity supplied by the session.
  const rows = await db.select({ id: users.id }).from(users)
    .where(eq(users.clerkUserId, clerkUserId)).limit(1);
  const id = rows[0]?.id;
  if (!id) return undefined;

  const setUser = db.update(users)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({ id: users.id });
  const statements: [Statement, ...Statement[]] = [setUser];
  statements.push(
    ...relationDeletes(id, data, RELATION_TABLES),
    ...relationInserts(id, data, RELATION_TABLES),
  );
  // Neon's HTTP batch is one transaction, including the name update and all preference sets.
  const [changed] = await db.batch(statements);
  return changed.length ? getUserByClerkId(clerkUserId) : undefined;
}

export async function deleteUser(clerkUserId: string) {
  const rows = await db.delete(users).where(eq(users.clerkUserId, clerkUserId)).returning();
  return rows[0];
}

export const usersRepository: UsersRepository = {
  getUserByClerkId, findMissingReferences, updateUser, deleteUser,
};
