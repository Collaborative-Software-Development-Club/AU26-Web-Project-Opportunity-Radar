import type { RequestHandler } from 'express';
import { parseLookupQuery } from './lookups.schema';
import type { LookupsRepository } from './lookups.types';

const CACHE_CONTROL = 'public, max-age=300';

export function createLookupsController(resolveRepository: () => Promise<LookupsRepository>) {
  const list: RequestHandler = async (req, res) => {
    parseLookupQuery(req.query);
    const repository = await resolveRepository();
    res.set('Cache-Control', CACHE_CONTROL).json({ data: await repository.listAll() });
  };

  return { list };
}
