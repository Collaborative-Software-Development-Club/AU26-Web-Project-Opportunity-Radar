
import type { RequestHandler } from 'express';
import type { BodyHandler } from '../../middleware/validate';
import { parseListQuery, parseOpportunityId } from './opportunities.schema';
import type { OpportunitiesService } from './opportunities.service';
import type { CreateOpportunityInput, UpdateOpportunityInput } from './opportunities.types';


export function createOpportunitiesController(service: OpportunitiesService) {
  const list: RequestHandler = async (req, res) => {
    const query = parseListQuery(req.query);
    const { items, total } = await service.list(query);
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
