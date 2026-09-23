import { Router } from 'express';
import { requireSession } from '../../middleware/auth';
import { getCurrentUser } from './users.controller';

export const usersRouter = Router();
usersRouter.get('/me', requireSession, getCurrentUser);

//POST /api/users
//GET /api/users
//GET /api/users/:id
//PATCH /api/users/:id
//DELETE /api/users/:id
