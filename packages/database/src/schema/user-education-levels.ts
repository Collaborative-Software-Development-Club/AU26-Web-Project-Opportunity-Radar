import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { educationLevels } from './education-levels';

export const userEducationLevels = pgTable('user_education_levels', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  educationLevelId: smallint('education_level_id').notNull().references(() => educationLevels.id),
}, table => [primaryKey({ columns: [table.userId, table.educationLevelId] })]);
