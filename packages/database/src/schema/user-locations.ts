import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { locations } from './locations';

export const userLocations = pgTable('user_locations', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id),
}, table => [primaryKey({ columns: [table.userId, table.locationId] })]);
