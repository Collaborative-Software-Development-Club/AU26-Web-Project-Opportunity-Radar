import { pgTable, smallserial, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: smallserial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});
