//main job is to check the input. call the repository, and return the result to the controller.
import type { UserProfileView } from '@radar/contracts';
import type { UserUpdate } from './users.repository';

import { badRequest, notFound } from '../../lib/http-error';
import { Issues, readerFor, text, definedOnly } from '../../lib/validation';

// Shared helpers check types, trim strings, and collect field errors.
export function parseUpdateUser(payload: unknown): UserUpdate {
  const issues = new Issues();
  const body = readerFor(payload, issues);
  // Reject email, clerkUserId, and any other fields the user cannot edit.
  body.rejectUnknown(['firstName', 'lastName', 'location', 'educationLevel', 'school', 'areaOfStudy', 'lookingFor']);

  const data = definedOnly({
    // Empty names remain allowed, matching the Clerk webhook.
    firstName: body.field('firstName', text({ max: 100, min: 0 })),
    lastName: body.field('lastName', text({ max: 100, min: 0 })),
    location: body.field('location', text({ max: 255, min: 0 })),
    educationLevel: body.field('educationLevel', text({ max: 100, min: 0 })),
    school: body.field('school', text({ max: 255, min: 0 })),
    areaOfStudy: body.field('areaOfStudy', text({ max: 255, min: 0 })),
    lookingFor: body.field('lookingFor', text({ max: 100, min: 0 })),
  });

  issues.throwIfAny('Invalid user fields.');
  if (Object.keys(data).length === 0) {
    throw badRequest('Provide at least one user field.');
  }
  return data;
}

// Load the repository only when a database operation is needed.
// Preferences join the response once "User Profile CRUD" lands.
export async function getCurrentUser(clerkUserId: string): Promise<Omit<UserProfileView, 'preferences'>> {
  const repository = await import('./users.repository');
  const user = await repository.getUserByClerkId(clerkUserId);
  if (!user) throw notFound('User not found.');
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    location: user.location,
    educationLevel: user.educationLevel,
    school: user.school,
    areaOfStudy: user.areaOfStudy,
    lookingFor: user.lookingFor,
    onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
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

export async function completeOnboarding(
  clerkUserId: string,
  payload: unknown,
) 

{
  const data = parseUpdateUser(payload);

  if (!data.firstName?.trim() && !data.lastName?.trim()) {
    throw badRequest('Name is required.');
  }
    const repository = await import('./users.repository');
    const user = await repository.completeOnboarding(clerkUserId,data);

    if (!user) throw notFound('User not found.');

    return user;
}
