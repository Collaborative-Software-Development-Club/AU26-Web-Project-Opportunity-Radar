import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const opportunities = pgTable('opportunities', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  summary: text('summary'),
  description: text('description'),
  applicationUrl: text('application_url').notNull(),
  sourceUrl: text('source_url').notNull(),
  applicationDeadline: timestamp('application_deadline', { withTimezone: true }),
  workMode: varchar('work_mode', { length: 20 }),
  workAuthorization: varchar('work_authorization', { length: 50 }),
  externalId: varchar('external_id', { length: 255 }),
  sourceType: varchar('source_type', { length: 20 }),
  sourceName: varchar('source_name', { length: 255 }),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  uniqueIndex('opportunities_source_name_external_id_unique')
    .on(table.sourceName, table.externalId)
    .where(sql`${table.sourceName} IS NOT NULL AND ${table.externalId} IS NOT NULL`),
]);

export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
