//main job is to check the input. call the repository, and return the result to the controller.
import type { UserUpdate } from './users.repository';

import { badRequest, notFound } from '../../lib/http-error';
import { Issues, readerFor, text, uuid, definedOnly } from '../../lib/validation';

function validateId(id: string) {
  const issues = new Issues();
  const params = readerFor({ id }, issues, 'path');
  params.field('id', uuid(), { required: true });
  issues.throwIfAny('Invalid user ID.');
}

// Shared helpers check types, trim strings, and collect field errors.
export function parseUpdateUser(payload: unknown): UserUpdate {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  // Reject email, clerkUserId, and any other fields the user cannot edit.
  body.rejectUnknown(['firstName', 'lastName']);

  const data = definedOnly({
    // Empty names remain allowed, matching the Clerk webhook.
    firstName: body.field('firstName', text({ max: 100, min: 0 })),
    lastName: body.field('lastName', text({ max: 100, min: 0 })),
  });

  issues.throwIfAny('Invalid user fields.');
  if (Object.keys(data).length === 0) {
    throw badRequest('Provide at least one user field.');
  }
  return data;
}

// Load the repository only when a database operation is needed.
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

export async function updateUser(clerkUserId: string, data: UserUpdate) {
  const repository = await import('./users.repository');
  const user = await repository.updateUser(clerkUserId, data);
  if (!user) throw notFound('User not found.');
  return user;
}

export async function deleteUser(clerkUserId: string) {
  const repository = await import('./users.repository');
  const user = await repository.deleteUser(clerkUserId);
  if (!user) throw notFound('User not found.');
}
