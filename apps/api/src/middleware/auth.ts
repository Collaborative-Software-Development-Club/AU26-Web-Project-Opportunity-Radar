import { getAuth } from '@clerk/express';
import type { RequestHandler } from 'express';

export const requireSession: RequestHandler = (req, res, next) => {
  const auth = getAuth(req, { acceptsToken: 'session_token' });
  if (!auth.isAuthenticated || !auth.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};
