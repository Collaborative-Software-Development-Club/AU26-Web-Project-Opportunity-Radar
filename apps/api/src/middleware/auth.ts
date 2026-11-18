import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';
import { env } from '../config/env';

export const requireSession: RequestHandler = (req, res, next) => {
  const auth = getAuth(req, { acceptsToken: 'session_token' });
  if (!auth.isAuthenticated || !auth.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

export const enforceAuthorizedParty: RequestHandler = (req, res, next) => {
  const azp = getAuth(req).sessionClaims?.azp;
  if (azp && !env.clerkAuthorizedParties.includes(azp)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

type IsAdmin = (clerkUserId: string) => Promise<boolean>;

const isAdminInDatabase: IsAdmin = async clerkUserId => {
  const { getUserByClerkId } = await import('../modules/users/users.repository');
  return (await getUserByClerkId(clerkUserId))?.isAdmin === true;
};


export function createRequireAdmin(isAdmin: IsAdmin = isAdminInDatabase): RequestHandler {
  return async (req, res, next) => {
    if (!(await isAdmin(getAuth(req).userId!))) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export const requireAdmin = createRequireAdmin();
