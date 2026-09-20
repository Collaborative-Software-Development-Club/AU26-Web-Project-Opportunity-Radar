import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { categories } from './categories';

export const opportunityCategories = pgTable('opportunity_categories', {
  opportunityId: uuid('opportunity_id').notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  categoryId: smallint('category_id').notNull().references(() => categories.id),
}, table => [primaryKey({ columns: [table.opportunityId, table.categoryId] })]);
