import type { CategoryView, EducationLevelView, FieldView, LocationView } from '@radar/contracts';
import type * as schema from '@radar/database/schema';

export type LocationRow = typeof schema.locations.$inferSelect;
export type FieldRow = typeof schema.fields.$inferSelect;
export type CategoryRow = typeof schema.categories.$inferSelect;
export type EducationLevelRow = typeof schema.educationLevels.$inferSelect;

const byName = <T extends { name: string }>(rows: T[]): T[] =>
  rows.sort((first, second) => first.name.localeCompare(second.name));

const text = (value: string | null): string => value ?? '';

function toLocationView({ location }: { location: LocationRow }): LocationView {
  return {
    id: location.id,
    city: location.city,
    stateRegion: location.stateRegion,
    country: location.country,
    countryCode: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function toEducationLevelView({ educationLevel }: { educationLevel: EducationLevelRow }): EducationLevelView {
  return { id: educationLevel.id, name: educationLevel.name, sortOrder: educationLevel.sortOrder };
}

const toFieldView = ({ field }: { field: FieldRow }): FieldView =>
  ({ id: field.id, name: field.name, slug: field.slug });

const toCategoryView = ({ category }: { category: CategoryRow }): CategoryView =>
  ({ id: category.id, name: category.name, slug: category.slug });

export const toLocationViews = (rows: { location: LocationRow }[]): LocationView[] =>
  rows.map(toLocationView).sort((first, second) =>
    text(first.country).localeCompare(text(second.country))
    || text(first.stateRegion).localeCompare(text(second.stateRegion))
    || text(first.city).localeCompare(text(second.city))
    || first.id.localeCompare(second.id));

export const toEducationLevelViews = (rows: { educationLevel: EducationLevelRow }[]): EducationLevelView[] =>
  rows.map(toEducationLevelView).sort((first, second) =>
    (first.sortOrder ?? Number.MAX_SAFE_INTEGER) - (second.sortOrder ?? Number.MAX_SAFE_INTEGER)
    || first.name.localeCompare(second.name));

export const toFieldViews = (rows: { field: FieldRow }[]): FieldView[] => byName(rows.map(toFieldView));

export const toCategoryViews = (rows: { category: CategoryRow }[]): CategoryView[] => byName(rows.map(toCategoryView));
