import type { UserProfileView } from '@radar/contracts';
import type * as schema from '@radar/database/schema';

export type UserProfileRow = typeof schema.users.$inferSelect & {
  locations: { location: typeof schema.locations.$inferSelect }[];
  educationLevels: { educationLevel: typeof schema.educationLevels.$inferSelect }[];
  fields: { field: typeof schema.fields.$inferSelect }[];
  categories: { category: typeof schema.categories.$inferSelect }[];
};

export function toUserProfileView(row: UserProfileRow): UserProfileView {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    createdAt: row.createdAt.toISOString(),
    preferences: {
      locations: row.locations.map(({ location }) => ({
        id: location.id,
        city: location.city,
        stateRegion: location.stateRegion,
        country: location.country,
        countryCode: location.countryCode,
        latitude: location.latitude,
        longitude: location.longitude,
      })).sort((a, b) => a.country.localeCompare(b.country)
        || (a.stateRegion ?? '').localeCompare(b.stateRegion ?? '')
        || (a.city ?? '').localeCompare(b.city ?? '') || a.id.localeCompare(b.id)),
      educationLevels: row.educationLevels.map(({ educationLevel }) => ({
        id: educationLevel.id, name: educationLevel.name, sortOrder: educationLevel.sortOrder,
      })).sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER)
        || a.name.localeCompare(b.name)),
      fields: row.fields.map(({ field }) => ({
        id: field.id, name: field.name, slug: field.slug,
      })).sort((a, b) => a.name.localeCompare(b.name)),
      categories: row.categories.map(({ category }) => ({
        id: category.id, name: category.name, slug: category.slug,
      })).sort((a, b) => a.name.localeCompare(b.name)),
    },
  };
}
