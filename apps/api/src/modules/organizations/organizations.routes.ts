import { Router, json, type RequestHandler } from 'express';
import { requireSession } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { createOrganizationsController } from './organizations.controller';
import { parseCreateOrganization, parseUpdateOrganization } from './organizations.schema';
import { createOrganizationsService } from './organizations.service';
import type { OrganizationsRepository } from './organizations.types';

type Dependencies = {
  resolveRepository: () => Promise<OrganizationsRepository>;
  authenticate?: RequestHandler;
};

export function createOrganizationsRouter({ resolveRepository, authenticate = requireSession }: Dependencies): Router {
  const controller = createOrganizationsController(createOrganizationsService(resolveRepository));
  const parseBody = json({ limit: '16kb' });
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', authenticate, parseBody, validateBody(parseCreateOrganization), controller.create);
  router.patch('/:id', authenticate, parseBody, validateBody(parseUpdateOrganization), controller.update);
  router.delete('/:id', authenticate, controller.remove);
  return router;
}

let repository: Promise<OrganizationsRepository> | undefined;
const resolveRepository = () => (repository ??= import('./organizations.repository')
  .then(module => module.organizationsRepository));

export const organizationsRouter = createOrganizationsRouter({ resolveRepository });
