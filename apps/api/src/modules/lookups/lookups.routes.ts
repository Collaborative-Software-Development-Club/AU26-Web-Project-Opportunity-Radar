import { Router } from 'express';
import { createLookupsController } from './lookups.controller';
import type { LookupsRepository } from './lookups.types';

type Dependencies = { resolveRepository: () => Promise<LookupsRepository> };

export function createLookupsRouter({ resolveRepository }: Dependencies): Router {
  const controller = createLookupsController(resolveRepository);
  const router = Router();

  router.get('/', controller.list);
  return router;
}

let repository: Promise<LookupsRepository> | undefined;
const resolveRepository = () => (repository ??= import('./lookups.repository')
  .then(module => module.lookupsRepository));

export const lookupsRouter = createLookupsRouter({ resolveRepository });
