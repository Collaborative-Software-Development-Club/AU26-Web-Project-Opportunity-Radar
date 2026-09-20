import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { fields } from './fields';

export const opportunityFields = pgTable('opportunity_fields', {
  opportunityId: uuid('opportunity_id').notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  fieldId: smallint('field_id').notNull().references(() => fields.id),
}, table => [primaryKey({ columns: [table.opportunityId, table.fieldId] })]);
