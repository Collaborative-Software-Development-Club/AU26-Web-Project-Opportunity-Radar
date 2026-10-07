// Reference data for filters and pickers, from GET /api/lookups.
import type { CategoryView, EducationLevelView, FieldView, LocationView } from './opportunity';

export type Lookups = {
  categories: CategoryView[];
  fields: FieldView[];
  educationLevels: EducationLevelView[];
  locations: LocationView[];
};

export type LookupsResponse = { data: Lookups };
