//controllers' main job is to read requests, call the service, and send responses.

import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';
import * as usersService from './users.service';

// Express 5 forwards async errors to the shared application error handler.
export const getCurrentUser: RequestHandler = async (req, res) => {
  // requireSession has already rejected requests without a user ID.
  res.json(await usersService.getCurrentUser(getAuth(req).userId!));
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
