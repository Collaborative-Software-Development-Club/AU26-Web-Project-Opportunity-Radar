import { pgTable, smallserial, varchar } from 'drizzle-orm/pg-core';

export const fields = pgTable('fields', {
  id: smallserial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
});
