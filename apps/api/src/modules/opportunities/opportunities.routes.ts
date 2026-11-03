import { Router, json, type RequestHandler } from 'express';
import { requireAdmin, requireSession } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createOpportunitiesController } from './opportunities.controller';
import { parseCreateOpportunity, parseUpdateOpportunity } from './opportunities.schema';
import { createOpportunitiesService } from './opportunities.service';
import type { OpportunitiesRepository } from './opportunities.types';

type Dependencies = {
  resolveRepository: () => Promise<OpportunitiesRepository>;
  authenticate?: RequestHandler;
  authorize?: RequestHandler;
};

export function createOpportunitiesRouter({
  resolveRepository, authenticate = requireSession, authorize = requireAdmin,
}: Dependencies): Router {
  const controller = createOpportunitiesController(createOpportunitiesService(resolveRepository));
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
