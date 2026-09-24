import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/http-error';

type ParseFailure = Error & { status?: unknown; type?: unknown };

function parseFailureStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const { status, type } = error as ParseFailure;
  if (typeof type !== 'string' || typeof status !== 'number') return undefined;
  return status >= 400 && status < 500 ? status : undefined;
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.status).json(error.details.length
      ? { error: error.message, details: error.details }
      : { error: error.message });
    return;
  }

  const parseStatus = parseFailureStatus(error);
  if (parseStatus) {
    res.status(parseStatus).json({
      error: parseStatus === 413 ? 'Request body is too large.' : 'Request body must be valid JSON.',
    });
    return;
  }


  console.error(error instanceof Error ? error.stack ?? error.message : error);
  res.status(500).json({ error: 'Internal server error' });
};
