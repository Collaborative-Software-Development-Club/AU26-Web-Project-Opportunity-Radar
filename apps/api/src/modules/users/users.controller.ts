//controllers' main job is to read requests, call the service, and send responses.

import { getAuth } from '@clerk/express';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { conflict } from '../../lib/http-error';
import * as usersService from './users.service';

export const getCurrentUser: RequestHandler = (req, res) => {
  const { userId } = getAuth(req);
  res.set('Cache-Control', 'no-store');
  // This is the Clerk identity, not the application's database user UUID.
  res.json({ clerkUserId: userId });
};

// Express 5 forwards errors from async handlers to our error handler below.
export const createUser: RequestHandler = async (req, res) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json(user);
}; //async lets us use await inside the function, which pauses execution until the promise resolves. This is important for database calls that take time to complete.

export const getAllUsers: RequestHandler = async (_req, res) => {
  const users = await usersService.getAllUsers();
  res.status(200).json(users);
};

export const getUserById: RequestHandler<{ id: string }> = async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  res.status(200).json(user);
};

export const updateUser: RequestHandler<{ id: string }> = async (req, res) => {
  const user = await usersService.updateUser(req.params.id, req.body);
  res.status(200).json(user);
};

export const deleteUser: RequestHandler<{ id: string }> = async (req, res) => {
  await usersService.deleteUser(req.params.id);
  res.status(204).send();
};

// PostgreSQL uses code 23505 for a unique-field conflict.
// Drizzle may wrap the database error inside another error's "cause".
function isDuplicateError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === '23505') return true;
  if ('cause' in error && error.cause !== error) return isDuplicateError(error.cause);
  return false;
}

export const handleUserError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (isDuplicateError(error)) {
    next(conflict('Email or Clerk user ID already exists.'));
    return;
  }
  // The shared handler handles HttpError, JSON parser errors, and unexpected errors.
  next(error);
};
