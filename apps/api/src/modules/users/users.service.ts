//main job is to check the input. call the repository, and return the result to the controller.
import type { UserInput } from './users.repository';

// Controllers use this status to turn an expected problem into an HTTP response.
export class UserError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function validateId(id: string) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new UserError(400, 'User ID must be a valid UUID.');
  }
}

function validateBody(body: unknown, isUpdate: boolean): Partial<UserInput> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new UserError(400, 'Request body must be a JSON object.');
  }

  const input = body as Record<string, unknown>;
  const fields = ['clerkUserId', 'email', 'firstName', 'lastName'] as const;
  const data: Partial<UserInput> = {};

  if (Object.keys(input).length === 0) {
    throw new UserError(400, 'Provide at least one user field.');
  }

  for (const field of Object.keys(input)) {
    if (!fields.some(allowed => allowed === field)) {
      throw new UserError(400, `Unknown field: ${field}.`);
    }
  }

  for (const field of fields) {
    const value = input[field];
    // PATCH may omit fields; POST must provide all four.
    if (value === undefined && isUpdate) continue;
    if (typeof value !== 'string') {
      throw new UserError(400, `${field} must be a string.`);
    }

    const trimmed = value.trim();
    const maxLength = field === 'firstName' || field === 'lastName' ? 100 : 255;
    if (trimmed.length > maxLength) {
      throw new UserError(400, `${field} must be at most ${maxLength} characters.`);
    }
    // Empty names are allowed, matching the existing Clerk webhook.
    if ((field === 'email' || field === 'clerkUserId') && trimmed.length === 0) {
      throw new UserError(400, `${field} cannot be empty.`);
    }
    if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new UserError(400, 'Provide a valid email address.');
    }
    data[field] = trimmed;
  }

  return data;
}

// Load the repository when needed so /me does not load the database module.
export async function createUser(body: unknown) {
  const data = validateBody(body, false) as UserInput;
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
  if (!user) throw new UserError(404, 'User not found.');
  return user;
}

export async function updateUser(id: string, body: unknown) {
  validateId(id);
  const data = validateBody(body, true);
  const repository = await import('./users.repository');
  const user = await repository.updateUser(id, data);
  if (!user) throw new UserError(404, 'User not found.');
  return user;
}

export async function deleteUser(id: string) {
  validateId(id);
  const repository = await import('./users.repository');
  const user = await repository.deleteUser(id);
  if (!user) throw new UserError(404, 'User not found.');
}
