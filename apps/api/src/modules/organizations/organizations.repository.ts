import { asc, count, eq, ilike, sql } from 'drizzle-orm';
import { db, organizations } from '@radar/database';
import type { Organization } from '@radar/database/schema';
import { toView as toOpportunityView } from '../opportunities/opportunities.view';
import type { OrganizationsRepository, OrganizationView } from './organizations.types';

// LIKE treats %, _ and \ as operators; match them literally.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const toOrganizationView = (row: Organization): OrganizationView => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  websiteUrl: row.websiteUrl,
  logoUrl: row.logoUrl,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const organizationsRepository: OrganizationsRepository = {
  async list({ limit, offset, q }) {
    const where = q ? ilike(organizations.name, `%${escapeLike(q)}%`) : undefined;
    const [rows, totals] = await Promise.all([
      db.select().from(organizations).where(where)
        .orderBy(asc(organizations.name), asc(organizations.id)).limit(limit).offset(offset),
      db.select({ value: count() }).from(organizations).where(where),
    ]);
    return { items: rows.map(toOrganizationView), total: Number(totals[0]?.value ?? 0) };
  },

  async findById(id) {
    const row = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: {
        opportunities: {
          orderBy: (opportunity, { asc, desc }) =>
            [sql`${opportunity.postedAt} desc nulls last`, desc(opportunity.createdAt), asc(opportunity.id)],
          with: {
            compensation: true,
            categories: { with: { category: true } },
            fields: { with: { field: true } },
            educationLevels: { with: { educationLevel: true } },
            locations: { with: { location: true } },
          },
        },
      },
    });
    if (!row) return null;

    const { opportunities, ...organization } = row;
    return {
      ...toOrganizationView(organization),
      // Reuse the parent row as each opportunity's organization instead of loading it again.
      opportunities: opportunities.map(opportunity => toOpportunityView({ ...opportunity, organization })),
    };
  },

  async findBySlug(slug) {
    const rows = await db.select({ id: organizations.id }).from(organizations)
      .where(eq(organizations.slug, slug)).limit(1);
    return rows[0] ?? null;
  },

  async create(input) {
    const [row] = await db.insert(organizations).values(input).returning();
    return toOrganizationView(row);
  },

  async update(id, input) {
    // updated_at carries an insert default only; use the database clock so it never precedes created_at.
    const [row] = await db.update(organizations).set({ ...input, updatedAt: sql`now()` })
      .where(eq(organizations.id, id)).returning();
    return row ? toOrganizationView(row) : null;
  },

  async remove(id) {
    // opportunities.organization_id has no ON DELETE action, so Postgres rejects this while postings remain.
    const deleted = await db.delete(organizations).where(eq(organizations.id, id))
      .returning({ id: organizations.id });
    return deleted.length > 0;
  },
};
