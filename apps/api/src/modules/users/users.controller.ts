//controllers' main job is to read requests, call the service, and send responses.

import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';
import * as usersService from './users.service';

export const getCurrentUser: RequestHandler = (req, res) => {
  const { userId } = getAuth(req);
  res.set('Cache-Control', 'no-store');
  // This is the Clerk identity, not the application's database user UUID.
  res.json({ clerkUserId: userId });
};

// Express 5 forwards async errors to the shared application error handler.
export const getAllUsers: RequestHandler = async (_req, res) => {
  const users = await usersService.getAllUsers();
  res.status(200).json(users);
};

export const getUserById: RequestHandler<{ id: string }> = async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  res.status(200).json(user);
};

export const updateUser: RequestHandler = async (req, res) => {
  // Trust the verified session, never an ID supplied by the client.
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await usersService.updateUser(userId, req.body);
  res.status(200).json(user);
};

export const deleteUser: RequestHandler = async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await usersService.deleteUser(userId);
  res.status(204).send();
};
