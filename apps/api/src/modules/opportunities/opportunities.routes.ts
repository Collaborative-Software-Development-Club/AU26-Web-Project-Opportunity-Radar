import { getAuth } from '@clerk/express';
import { Router, json, type RequestHandler } from 'express';
import { requireAdmin, requireSession } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  createOpportunitiesController, type LoadPreferences, type OptionalClerkUserIdOf,
} from './opportunities.controller';
import { parseCreateOpportunity, parseUpdateOpportunity } from './opportunities.schema';
import { createOpportunitiesService } from './opportunities.service';
import type { OpportunitiesRepository } from './opportunities.types';

type Dependencies = {
  resolveRepository: () => Promise<OpportunitiesRepository>;
  authenticate?: RequestHandler;
  authorize?: RequestHandler;
  clerkUserIdOf?: OptionalClerkUserIdOf;
  loadPreferences?: LoadPreferences;
};

const sessionUserId: OptionalClerkUserIdOf = req => getAuth(req, { acceptsToken: 'session_token' }).userId ?? null;

const preferencesFromProfile: LoadPreferences = async clerkUserId => {
  const { getUserProfileByClerkId } = await import('../users/users.repository');
  const preferences = (await getUserProfileByClerkId(clerkUserId))?.preferences;
  return preferences && {
    locationIds: preferences.locations.map(location => location.id),
    educationLevelIds: preferences.educationLevels.map(level => level.id),
    fieldIds: preferences.fields.map(field => field.id),
    categoryIds: preferences.categories.map(category => category.id),
  };
};

export function createOpportunitiesRouter({
  resolveRepository, authenticate = requireSession, authorize = requireAdmin,
  clerkUserIdOf = sessionUserId, loadPreferences = preferencesFromProfile,
}: Dependencies): Router {
  const controller = createOpportunitiesController(
    createOpportunitiesService(resolveRepository), clerkUserIdOf, loadPreferences,
  );
  const parseBody = json({ limit: '256kb' });
  const router = Router();

  
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', authenticate, authorize, parseBody, validateBody(parseCreateOpportunity), controller.create);
  router.patch('/:id', authenticate, authorize, parseBody, validateBody(parseUpdateOpportunity), controller.update);
  router.delete('/:id', authenticate, authorize, controller.remove);
  return router;
}


let repository: Promise<OpportunitiesRepository> | undefined;
const resolveRepository = () => (repository ??= import('./opportunities.repository')
  .then(module => module.opportunitiesRepository));

export const opportunitiesRouter = createOpportunitiesRouter({ resolveRepository });
