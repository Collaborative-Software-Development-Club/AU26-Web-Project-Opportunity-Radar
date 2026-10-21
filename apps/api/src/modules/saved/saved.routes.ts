import { getAuth } from '@clerk/express';
import { Router, type RequestHandler } from 'express';
import { requireSession } from '../../middleware/auth';
import { createSavedController, type ClerkUserIdOf } from './saved.controller';
import { createSavedService } from './saved.service';
import type { SavedRepository } from './saved.types';

type Dependencies = {
  resolveRepository: () => Promise<SavedRepository>;
  authenticate?: RequestHandler;
  clerkUserIdOf?: ClerkUserIdOf;
};

const sessionUserId: ClerkUserIdOf = req => getAuth(req).userId!;

export function createSavedRouter(
  { resolveRepository, authenticate = requireSession, clerkUserIdOf = sessionUserId }: Dependencies,
): Router {
  const controller = createSavedController(createSavedService(resolveRepository), clerkUserIdOf);
  const router = Router();

  router.use(authenticate, (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/', controller.list);
  router.get('/ids', controller.listIds);
  router.post('/:opportunityId', controller.save);
  router.delete('/:opportunityId', controller.remove);
  return router;
}

let repository: Promise<SavedRepository> | undefined;
const resolveRepository = () => (repository ??= import('./saved.repository').then(module => module.savedRepository));

export const savedRouter = createSavedRouter({ resolveRepository });
