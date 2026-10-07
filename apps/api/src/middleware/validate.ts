
import type { RequestHandler } from 'express';

export type BodyHandler<T> = RequestHandler<Record<string, string>, any, T>;

export function validateBody<T>(parse: (payload: unknown) => T): BodyHandler<T> {
  return (req, _res, next) => {
    req.body = parse(req.body);
    next();
  };
}
