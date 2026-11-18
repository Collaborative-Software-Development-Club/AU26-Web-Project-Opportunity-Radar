
import type { Request, RequestHandler } from 'express';
import type { BodyHandler } from '../../middleware/validate';
import { parseListQuery, parseOpportunityId } from './opportunities.schema';
import type { OpportunitiesService } from './opportunities.service';
import type { CreateOpportunityInput, PreferenceIds, UpdateOpportunityInput } from './opportunities.types';

export type OptionalClerkUserIdOf = (req: Request) => string | null;
export type LoadPreferences = (clerkUserId: string) => Promise<PreferenceIds | undefined>;

export function createOpportunitiesController(
  service: OpportunitiesService, clerkUserIdOf: OptionalClerkUserIdOf, loadPreferences: LoadPreferences,
) {
  const list: RequestHandler = async (req, res) => {
    const query = parseListQuery(req.query);
    let preferences: PreferenceIds | undefined;
    if (query.sort === 'recommended') {
      res.set('Cache-Control', 'private, no-store');
      const clerkUserId = clerkUserIdOf(req);
      if (clerkUserId) preferences = await loadPreferences(clerkUserId);
    }
    const { items, total } = await service.list(query, preferences);
    res.json({ data: items, pagination: { total, limit: query.limit, offset: query.offset } });
  };

  const getById: RequestHandler = async (req, res) => {
    res.json(await service.getById(parseOpportunityId(req.params.id)));
  };

  
  const create: BodyHandler<CreateOpportunityInput> = async (req, res) => {
    const created = await service.create(req.body);
    res.status(201).location(`/api/opportunities/${created.id}`).json(created);
  };

  const update: BodyHandler<UpdateOpportunityInput> = async (req, res) => {
    const id = parseOpportunityId(req.params.id);
    res.json(await service.update(id, req.body));
  };

  const remove: RequestHandler = async (req, res) => {
    await service.remove(parseOpportunityId(req.params.id));
    res.status(204).end();
  };

  return { list, getById, create, update, remove };
}
