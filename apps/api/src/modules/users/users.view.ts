import type { UserProfileView } from '@radar/contracts';
import type * as schema from '@radar/database/schema';
import {
  toCategoryViews, toEducationLevelViews, toFieldViews, toLocationViews,
  type CategoryRow, type EducationLevelRow, type FieldRow, type LocationRow,
} from '../../lib/lookup-views';

export type UserProfileRow = Pick<typeof schema.users.$inferSelect, 'id' | 'email' | 'firstName' | 'lastName' | 'createdAt'> & {
  locations: { location: LocationRow }[];
  educationLevels: { educationLevel: EducationLevelRow }[];
  fields: { field: FieldRow }[];
  categories: { category: CategoryRow }[];
};

export function toUserProfileView(row: UserProfileRow): UserProfileView {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    createdAt: row.createdAt.toISOString(),
    preferences: {
      locations: toLocationViews(row.locations),
      educationLevels: toEducationLevelViews(row.educationLevels),
      fields: toFieldViews(row.fields),
      categories: toCategoryViews(row.categories),
    },
  };
}
