//DESCRIPTION: this routes file is like a headquarter, it looks at the requests and directs them to the appropriate controller function. It also applies middleware for authentication and error handling.
import { Router, json } from 'express';
import { validateBody } from '../../middleware/validate';
import { parseUpdateUser } from './users.service';
import { requireSession } from '../../middleware/auth';
import {
  getCurrentUser,
  updateUser,
  deleteUser,
} from './users.controller';

export const usersRouter = Router();

// Require valid Clerk sign-in sessions
usersRouter.use(requireSession);
usersRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next(); //let's the request through to the next middleware
});

usersRouter.use(json()); // Parse JSON into JavaScript to store in req.body

// app.ts already adds the /api/users prefix.
usersRouter.get('/me', getCurrentUser);
usersRouter.patch('/me', validateBody(parseUpdateUser), updateUser);
usersRouter.delete('/me', deleteUser);
