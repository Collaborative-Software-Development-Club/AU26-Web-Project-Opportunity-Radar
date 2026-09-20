import { boolean, char, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';

export const opportunityCompensation = pgTable('opportunity_compensation', {
  id: uuid('id').defaultRandom().primaryKey(),
  opportunityId: uuid('opportunity_id').notNull().unique()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  compensationType: varchar('compensation_type', { length: 30 }),
  isPaid: boolean('is_paid'),
  minAmount: numeric('min_amount', { precision: 12, scale: 2 }),
  maxAmount: numeric('max_amount', { precision: 12, scale: 2 }),
  currency: char('currency', { length: 3 }).default('USD'),
  period: varchar('period', { length: 20 }),
  rawText: text('raw_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OpportunityCompensation = typeof opportunityCompensation.$inferSelect;
export type NewOpportunityCompensation = typeof opportunityCompensation.$inferInsert;
