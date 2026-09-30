import { asc, sql } from 'drizzle-orm';
import { categories, db, educationLevels, fields, locations } from '@radar/database';
import type { CategoryView, EducationLevelView, FieldView, LocationView, LookupsRepository } from './lookups.types';

export const toCategoryView = ({ id, name, slug }: typeof categories.$inferSelect): CategoryView => ({ id, name, slug });

export const toFieldView = ({ id, name, slug }: typeof fields.$inferSelect): FieldView => ({ id, name, slug });

export const toEducationLevelView = ({ id, name, sortOrder }: typeof educationLevels.$inferSelect): EducationLevelView =>
  ({ id, name, sortOrder });

export const toLocationView = ({ id, city, stateRegion, country, countryCode }: typeof locations.$inferSelect): LocationView =>
  ({ id, city, stateRegion, country, countryCode });

export const lookupsRepository: LookupsRepository = {
  async listAll() {
    const [categoryRows, fieldRows, educationLevelRows, locationRows] = await db.batch([
      db.select().from(categories).orderBy(asc(categories.name)),
      db.select().from(fields).orderBy(asc(fields.name)),
      db.select().from(educationLevels)
        .orderBy(sql`${educationLevels.sortOrder} asc nulls last`, asc(educationLevels.name)),
      db.select().from(locations)
        .orderBy(asc(locations.country), asc(locations.stateRegion), asc(locations.city), asc(locations.id)),
    ]);
    return {
      categories: categoryRows.map(toCategoryView),
      fields: fieldRows.map(toFieldView),
      educationLevels: educationLevelRows.map(toEducationLevelView),
      locations: locationRows.map(toLocationView),
    };
  },
};
