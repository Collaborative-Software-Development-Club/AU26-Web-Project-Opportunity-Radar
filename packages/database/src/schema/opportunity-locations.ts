import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { opportunities } from './opportunities';
import { locations } from './locations';

export const opportunityLocations = pgTable('opportunity_locations', {
  opportunityId: uuid('opportunity_id').notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id),
}, table => [primaryKey({ columns: [table.opportunityId, table.locationId] })]);
