import { db, users } from '@radar/database';
import type { NewUser } from '@radar/database/schema';
import { eq } from 'drizzle-orm';

// Clerk provides these fields when the signup webhook creates a user.
export type ClerkUserInsert = Pick<NewUser, 'clerkUserId' | 'email' | 'firstName' | 'lastName'>;
// Profile updates can change either name, but never the email or Clerk identity.
export type UserUpdate = Partial<Pick<NewUser, 'firstName' | 'lastName'>>;

// Keep this function for the existing Clerk webhook.
export async function insertClerkUser(user: ClerkUserInsert): Promise<void> {
  // Only Clerk ID conflicts are ignored; email conflicts must still surface.
  await db.insert(users).values(user).onConflictDoNothing({ target: users.clerkUserId });
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.id);
}

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  // An empty result means rows[0] is undefined.
  return rows[0];
}

export async function updateUser(clerkUserId: string, data: UserUpdate) {
  const rows = await db.update(users)
    .set({
      firstName: data.firstName,
      lastName: data.lastName,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, clerkUserId))
    .returning();
  return rows[0];
}

export async function deleteUser(clerkUserId: string) {
  const rows = await db.delete(users).where(eq(users.clerkUserId, clerkUserId)).returning();
  return rows[0];
}
