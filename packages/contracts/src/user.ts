// Application user profile
import type { CategoryView, EducationLevelView, FieldView, LocationView } from './opportunity';

export type UserPreferencesView = {
  locations: LocationView[];
  educationLevels: EducationLevelView[];
  fields: FieldView[];
  categories: CategoryView[];
};

export type UserProfileView = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  preferences: UserPreferencesView;
};

export type UpdateUserProfileRequest = {
  firstName?: string;
  lastName?: string;
  locationIds?: string[];
  educationLevelIds?: number[];
  fieldIds?: number[];
  categoryIds?: number[];
};