import { Router } from 'express';
import { requireSession } from '../../middleware/auth';
import { getCurrentUser } from './users.controller';

export const usersRouter = Router();
usersRouter.get('/me', requireSession, getCurrentUser);
