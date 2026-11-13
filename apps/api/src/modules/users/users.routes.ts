import { getAuth } from '@clerk/express';
import { Router, json, type RequestHandler } from 'express';
import { validateBody } from '../../middleware/validate';
import { requireSession } from '../../middleware/auth';
import { createUsersController, type ClerkUserIdOf } from './users.controller';
import { createUsersService, parseUpdateUser } from './users.service';
import type { UsersRepository } from './users.types';

type Dependencies = {
  resolveRepository: () => Promise<UsersRepository>;
  authenticate?: RequestHandler;
  clerkUserIdOf?: ClerkUserIdOf;
};

const sessionUserId: ClerkUserIdOf = req => getAuth(req).userId!;

export function createUsersRouter(
  { resolveRepository, authenticate = requireSession, clerkUserIdOf = sessionUserId }: Dependencies,
): Router {
  const controller = createUsersController(createUsersService(resolveRepository), clerkUserIdOf);
  const router = Router();
  router.use(authenticate, (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/me', controller.getCurrentUser);
  router.patch('/me', json(), validateBody(parseUpdateUser), controller.updateUser);
  router.delete('/me', controller.deleteUser);
  return router;
}

let repository: Promise<UsersRepository> | undefined;
const resolveRepository = () => (repository ??= import('./users.repository').then(module => module.usersRepository));

export const usersRouter = createUsersRouter({ resolveRepository });
