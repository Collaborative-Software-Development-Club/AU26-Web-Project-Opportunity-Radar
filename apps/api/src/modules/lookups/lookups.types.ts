import type { CategoryView, EducationLevelView, FieldView, LocationView } from '../opportunities/opportunities.types';

export type { CategoryView, EducationLevelView, FieldView, LocationView };

export type Lookups = {
  categories: CategoryView[];
  fields: FieldView[];
  educationLevels: EducationLevelView[];
  locations: LocationView[];
};

export type LookupsRepository = {
  listAll(): Promise<Lookups>;
};
