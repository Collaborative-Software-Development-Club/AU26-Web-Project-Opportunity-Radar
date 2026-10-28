import type { UpdateUserProfileRequest, UserProfileView } from '@radar/contracts';
import type { MissingReferences, RelationIdsWrite } from '../../lib/relation-ids';

export type UserUpdate = UpdateUserProfileRequest;

export type UsersRepository = {
  getUserByClerkId(clerkUserId: string): Promise<UserProfileView | undefined>;
  findMissingReferences(relations: RelationIdsWrite): Promise<MissingReferences>;
  updateUser(clerkUserId: string, changes: UserUpdate): Promise<UserProfileView | undefined>;
  deleteUser(clerkUserId: string): Promise<{ id: string } | undefined>;
};
