import type { RequestHandler } from 'express';
import type { BodyHandler } from '../../middleware/validate';
import { parseListOrganizationsQuery, parseOrganizationId } from './organizations.schema';
import type { OrganizationsService } from './organizations.service';
import type { CreateOrganizationInput, UpdateOrganizationInput } from './organizations.types';

export function createOrganizationsController(service: OrganizationsService) {
  const list: RequestHandler = async (req, res) => {
    const query = parseListOrganizationsQuery(req.query);
    const { items, total } = await service.list(query);
    res.json({ data: items, pagination: { total, limit: query.limit, offset: query.offset } });
  };

  const getById: RequestHandler = async (req, res) => {
    res.json(await service.getById(parseOrganizationId(req.params.id)));
  };

  const create: BodyHandler<CreateOrganizationInput> = async (req, res) => {
    const created = await service.create(req.body);
    res.status(201).location(`/api/organizations/${created.id}`).json(created);
  };

  const update: BodyHandler<UpdateOrganizationInput> = async (req, res) => {
    res.json(await service.update(parseOrganizationId(req.params.id), req.body));
  };

  const remove: RequestHandler = async (req, res) => {
    await service.remove(parseOrganizationId(req.params.id));
    res.status(204).end();
  };

  return { list, getById, create, update, remove };
}
