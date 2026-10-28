import type { Request, RequestHandler } from 'express';
import type { UsersService } from './users.service';

export type ClerkUserIdOf = (req: Request) => string;

export function createUsersController(service: UsersService, clerkUserIdOf: ClerkUserIdOf) {
  const getCurrentUser: RequestHandler = async (req, res) => {
    res.json(await service.getCurrentUser(clerkUserIdOf(req)));
  };

  const updateUser: RequestHandler = async (req, res) => {
    res.json(await service.updateUser(clerkUserIdOf(req), req.body));
  };

  const deleteUser: RequestHandler = async (req, res) => {
    await service.deleteUser(clerkUserIdOf(req));
    res.status(204).send();
  };

  return { getCurrentUser, updateUser, deleteUser };
}
