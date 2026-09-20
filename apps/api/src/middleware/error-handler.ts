import type { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (_error, _req, res, next) => {
  if (res.headersSent) {
    next(_error);
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
};
