//main job is to check the input. call the repository, and return the result to the controller.
import type { UserInput } from './users.repository';

import { badRequest, notFound } from '../../lib/http-error';
import { Issues, readerFor, text, matching, uuid, definedOnly } from '../../lib/validation';

function validateId(id: string) {
  const issues = new Issues();
  const params = readerFor({ id }, issues, 'path');
  params.field('id', uuid(), { required: true });
  issues.throwIfAny('Invalid user ID.');
}

// Shared helpers check types, trim strings, and collect field errors.
function parseUserBody(payload: unknown, isUpdate: boolean): Partial<UserInput> {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  body.rejectUnknown(['clerkUserId', 'email', 'firstName', 'lastName']);
  const required = !isUpdate;

  const data = definedOnly({
    clerkUserId: body.field('clerkUserId', text({ max: 255 }), { required }),
    email: body.field('email', matching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'must be a valid email address', 255), { required }),
    // Empty names remain allowed, matching the Clerk webhook.
    firstName: body.field('firstName', text({ max: 100, min: 0 }), { required }),
    lastName: body.field('lastName', text({ max: 100, min: 0 }), { required }),
  });

  issues.throwIfAny('Invalid user fields.');
  if (Object.keys(data).length === 0) {
    throw badRequest('Provide at least one user field.');
  }
  return data;
}

// Routes pass these parsers to the shared validateBody middleware.
export function parseCreateUser(payload: unknown): UserInput {
  // All four fields were required and checked by parseUserBody.
  return parseUserBody(payload, false) as UserInput;
}

export function parseUpdateUser(payload: unknown): Partial<UserInput> {
  return parseUserBody(payload, true);
}

// Load the repository when needed so /me does not load the database module.
export async function createUser(data: UserInput) {
  const repository = await import('./users.repository');
  return repository.createUser(data);
}

export async function getAllUsers() {
  const repository = await import('./users.repository');
  return repository.getAllUsers();
}

export async function getUserById(id: string) {
  validateId(id);
  const repository = await import('./users.repository');
  const user = await repository.getUserById(id);
  if (!user) throw notFound('User not found.');
  return user;
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  validateId(id);
  const repository = await import('./users.repository');
  const user = await repository.updateUser(id, data);
  if (!user) throw notFound('User not found.');
  return user;
}

export async function deleteUser(id: string) {
  validateId(id);
  const repository = await import('./users.repository');
  const user = await repository.deleteUser(id);
  if (!user) throw notFound('User not found.');
}
