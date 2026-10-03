import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { fields } from './fields';

export const userFields = pgTable('user_fields', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fieldId: smallint('field_id').notNull().references(() => fields.id),
}, table => [primaryKey({ columns: [table.userId, table.fieldId] })]);
