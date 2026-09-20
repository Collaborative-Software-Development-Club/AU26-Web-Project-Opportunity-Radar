import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';

export const getCurrentUser: RequestHandler = (req, res) => {
  const { userId } = getAuth(req);
  res.set('Cache-Control', 'no-store');
  // This is the Clerk identity, not the application's database user UUID.
  res.json({ clerkUserId: userId });
};
