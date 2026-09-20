import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';
import { opportunities } from './opportunities';
import { opportunityCompensation } from './opportunity-compensation';
import { categories } from './categories';
import { locations } from './locations';
import { fields } from './fields';
import { educationLevels } from './education-levels';
import { opportunityCategories } from './opportunity-categories';
import { opportunityLocations } from './opportunity-locations';
import { opportunityFields } from './opportunity-fields';
import { opportunityEducationLevels } from './opportunity-education-levels';
import { savedOpportunities } from './saved-opportunities';

export const usersRelations = relations(users, ({ many }) => ({
  savedOpportunities: many(savedOpportunities),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  opportunities: many(opportunities),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organization: one(organizations, { fields: [opportunities.organizationId], references: [organizations.id] }),
  compensation: one(opportunityCompensation),
  categories: many(opportunityCategories),
  locations: many(opportunityLocations),
  fields: many(opportunityFields),
  educationLevels: many(opportunityEducationLevels),
  savedOpportunities: many(savedOpportunities),
}));

export const opportunityCompensationRelations = relations(opportunityCompensation, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityCompensation.opportunityId], references: [opportunities.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  opportunities: many(opportunityCategories),
}));

export const opportunityCategoriesRelations = relations(opportunityCategories, ({ one }) => ({
  opportunity: one(opportunities, { fields: [opportunityCategories.opportunityId], references: [opportunities.id] }),
  category: one(categories, { fields: [opportunityCategories.categoryId], references: [categories.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  opportunities: many(opportunityLocations),
}));

export const opportunityLocationsRelations = relations(opportunityLocations, ({ one }) => ({
  opportunity: one(opportunities, { fields: [opportunityLocations.opportunityId], references: [opportunities.id] }),
  location: one(locations, { fields: [opportunityLocations.locationId], references: [locations.id] }),
}));

export const fieldsRelations = relations(fields, ({ many }) => ({
  opportunities: many(opportunityFields),
}));

export const opportunityFieldsRelations = relations(opportunityFields, ({ one }) => ({
  opportunity: one(opportunities, { fields: [opportunityFields.opportunityId], references: [opportunities.id] }),
  field: one(fields, { fields: [opportunityFields.fieldId], references: [fields.id] }),
}));

export const educationLevelsRelations = relations(educationLevels, ({ many }) => ({
  opportunities: many(opportunityEducationLevels),
}));

export const opportunityEducationLevelsRelations = relations(opportunityEducationLevels, ({ one }) => ({
  opportunity: one(opportunities, { fields: [opportunityEducationLevels.opportunityId], references: [opportunities.id] }),
  educationLevel: one(educationLevels, { fields: [opportunityEducationLevels.educationLevelId], references: [educationLevels.id] }),
}));

export const savedOpportunitiesRelations = relations(savedOpportunities, ({ one }) => ({
  user: one(users, { fields: [savedOpportunities.userId], references: [users.id] }),
  opportunity: one(opportunities, { fields: [savedOpportunities.opportunityId], references: [opportunities.id] }),
}));
