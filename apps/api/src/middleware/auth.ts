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
