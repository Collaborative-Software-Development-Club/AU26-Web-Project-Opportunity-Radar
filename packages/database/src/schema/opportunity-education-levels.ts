import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { educationLevels } from './education-levels';

export const opportunityEducationLevels = pgTable('opportunity_education_levels', {
  opportunityId: uuid('opportunity_id').notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  educationLevelId: smallint('education_level_id').notNull().references(() => educationLevels.id),
}, table => [primaryKey({ columns: [table.opportunityId, table.educationLevelId] })]);
