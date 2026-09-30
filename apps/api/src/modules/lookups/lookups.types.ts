export type CategoryView = { id: number; name: string; slug: string };

export type FieldView = { id: number; name: string; slug: string };

export type EducationLevelView = { id: number; name: string; sortOrder: number | null };

export type LocationView = {
  id: string;
  city: string | null;
  stateRegion: string | null;
  country: string;
  countryCode: string | null;
};

export type Lookups = {
  categories: CategoryView[];
  fields: FieldView[];
  educationLevels: EducationLevelView[];
  locations: LocationView[];
};

export type LookupsRepository = {
  listAll(): Promise<Lookups>;
};
