import { db, users } from '@radar/database';
import type { NewUser } from '@radar/database/schema';
import { eq } from 'drizzle-orm';

// Only these four fields come from the client. The database creates the ID and dates.
export type UserInput = Pick<NewUser, 'clerkUserId' | 'email' | 'firstName' | 'lastName'>;
export type ClerkUserInsert = UserInput;

// Keep this function for the existing Clerk webhook.
export async function insertClerkUser(user: ClerkUserInsert): Promise<void> {
  // Only Clerk ID conflicts are ignored; email conflicts must still surface.
  await db.insert(users).values(user).onConflictDoNothing({ target: users.clerkUserId });
}

export async function createUser(data: UserInput) {
  const rows = await db.insert(users).values(data).returning();
  return rows[0];
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.id);
}

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id));
  // An empty result means rows[0] is undefined.
  return rows[0];
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  const rows = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return rows[0];
}

export async function deleteUser(id: string) {
  const rows = await db.delete(users).where(eq(users.id, id)).returning();
  return rows[0];
}
