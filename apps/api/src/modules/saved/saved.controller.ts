import type { Request, RequestHandler } from 'express';
import { parseListSavedQuery, parseOpportunityId } from './saved.schema';
import type { SavedService } from './saved.service';

export type ClerkUserIdOf = (req: Request) => string;

export function createSavedController(service: SavedService, clerkUserIdOf: ClerkUserIdOf) {
  const list: RequestHandler = async (req, res) => {
    const query = parseListSavedQuery(req.query);
    const { items, total } = await service.list(clerkUserIdOf(req), query);
    res.json({ data: items, pagination: { total, limit: query.limit, offset: query.offset } });
  };

  const save: RequestHandler = async (req, res) => {
    await service.save(clerkUserIdOf(req), parseOpportunityId(req.params.opportunityId));
    res.status(204).end();
  };

  const remove: RequestHandler = async (req, res) => {
    await service.remove(clerkUserIdOf(req), parseOpportunityId(req.params.opportunityId));
    res.status(204).end();
  };

  return { list, save, remove };
}
