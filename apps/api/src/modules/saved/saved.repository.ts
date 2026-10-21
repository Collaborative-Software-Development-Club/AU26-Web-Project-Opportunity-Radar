import { and, count, desc, eq } from 'drizzle-orm';
import { db, savedOpportunities, users } from '@radar/database';
import { WITH_RELATIONS } from '../opportunities/opportunities.repository';
import { toView } from '../opportunities/opportunities.view';
import type { SavedRepository } from './saved.types';

export const savedRepository: SavedRepository = {
  async findUserId(clerkUserId) {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
    return rows[0]?.id ?? null;
  },

  async list(userId, { limit, offset }) {
    const where = eq(savedOpportunities.userId, userId);
    const [rows, totals] = await Promise.all([
      db.query.savedOpportunities.findMany({
        where,
        with: { opportunity: { with: WITH_RELATIONS } },
        orderBy: [desc(savedOpportunities.savedAt), desc(savedOpportunities.opportunityId)],
        limit,
        offset,
      }),
      db.select({ value: count() }).from(savedOpportunities).where(where),
    ]);
    return {
      items: rows.map(row => ({ opportunity: toView(row.opportunity), savedAt: row.savedAt.toISOString() })),
      total: Number(totals[0]?.value ?? 0),
    };
  },

  async save(userId, opportunityId) {
    await db.insert(savedOpportunities).values({ userId, opportunityId }).onConflictDoNothing();
  },

  async remove(userId, opportunityId) {
    await db.delete(savedOpportunities)
      .where(and(eq(savedOpportunities.userId, userId), eq(savedOpportunities.opportunityId, opportunityId)));
  },
};
