import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const userCategories = pgTable('user_categories', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  categoryId: smallint('category_id').notNull().references(() => categories.id),
}, table => [primaryKey({ columns: [table.userId, table.categoryId] })]);
