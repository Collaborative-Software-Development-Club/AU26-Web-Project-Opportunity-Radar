import { db, users } from '@radar/database';
import type { NewUser } from '@radar/database/schema';

export type ClerkUserInsert = Pick<NewUser, 'clerkUserId' | 'email' | 'firstName' | 'lastName'>;

export async function insertClerkUser(user: ClerkUserInsert): Promise<void> {
  // Only Clerk ID conflicts are duplicates; email conflicts must surface for review.
  await db.insert(users).values(user).onConflictDoNothing({ target: users.clerkUserId });
}
