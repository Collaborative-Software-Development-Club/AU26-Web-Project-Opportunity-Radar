import { pgTable, smallint, smallserial, varchar } from 'drizzle-orm/pg-core';

export const educationLevels = pgTable('education_levels', {
  id: smallserial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  sortOrder: smallint('sort_order'),
});
