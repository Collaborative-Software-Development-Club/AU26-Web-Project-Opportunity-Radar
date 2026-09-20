import { char, numeric, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  city: varchar('city', { length: 150 }),
  stateRegion: varchar('state_region', { length: 150 }),
  country: varchar('country', { length: 100 }).notNull(),
  countryCode: char('country_code', { length: 2 }),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
});
