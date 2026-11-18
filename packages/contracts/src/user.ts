// Application user profile
import type {
  CategoryView, EducationLevelView, FieldView, LocationView, OpportunityRelationIdsPayload,
} from './opportunity';

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

// Named preference arrays replace their set; [] clears it and omission preserves it.
export type UpdateUserProfileRequest = OpportunityRelationIdsPayload & {
  firstName?: string;
  lastName?: string;
};
