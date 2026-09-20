import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { users } from './users';

export const savedOpportunities = pgTable('saved_opportunities', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  opportunityId: uuid('opportunity_id').notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  savedAt: timestamp('saved_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.userId, table.opportunityId] })]);
