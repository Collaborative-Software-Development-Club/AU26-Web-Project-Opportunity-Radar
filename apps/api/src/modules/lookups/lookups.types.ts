import type { Lookups } from '@radar/contracts';
import type { CategoryView, EducationLevelView, FieldView, LocationView } from '../opportunities/opportunities.types';

// The response shape is the published contract.
export type { CategoryView, EducationLevelView, FieldView, LocationView, Lookups };

export type LookupsRepository = {
  listAll(): Promise<Lookups>;
};
