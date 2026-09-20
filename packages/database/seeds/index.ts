import { sql, type SQL } from 'drizzle-orm';
import { db } from '../src/client';

// The shared client loads root .env and preserves hosting/shell DATABASE_URL.
const referenceOnly = process.argv.includes('--reference-only');
const unknownArgs = process.argv.slice(2).filter(arg => arg !== '--reference-only');
if (unknownArgs.length) throw new Error('Usage: db:seed [--reference-only]');
if (!referenceOnly && process.env.NODE_ENV === 'production') {
  throw new Error('Demo fixtures are disabled in production. Use --reference-only.');
}

const categories = ['Internship', 'Scholarship', 'Research', 'Hackathon', 'Fellowship', 'Volunteer'];
const fields = ['Computer Science', 'Engineering', 'Business', 'Data Science', 'Public Health'];
const levels = ['High School', 'Undergraduate', 'Graduate'];
const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-');
const statements: SQL[] = [];
for (const name of categories) {
  statements.push(sql`insert into categories (name, slug) values (${name}, ${slug(name)}) on conflict do nothing`);
}
for (const name of fields) {
  statements.push(sql`insert into fields (name, slug) values (${name}, ${slug(name)}) on conflict do nothing`);
}
for (const [index, name] of levels.entries()) {
  statements.push(sql`insert into education_levels (name, sort_order) values (${name}, ${index + 1}) on conflict do nothing`);
}

const organizations = ['Demo Campus Lab', 'Demo Community Foundation', 'Demo Innovation Network'];
const locationId = 'b2aaf0b1-42e3-4d76-9c50-916547fa4001';
const fixtures = [
  { key: 'software-internship', title: 'Software Engineering Internship', org: 2, category: 'Internship', field: 'Computer Science', level: 'Undergraduate', mode: 'remote', days: 45, amount: '25.00', period: 'hour', status: 'active' },
  { key: 'student-scholarship', title: 'Student Access Scholarship', org: 1, category: 'Scholarship', field: 'Business', level: 'Undergraduate', mode: null, days: 60, amount: '2500.00', period: 'one-time', status: 'active' },
  { key: 'research-assistant', title: 'Data Research Assistant', org: 0, category: 'Research', field: 'Data Science', level: 'Graduate', mode: 'hybrid', days: 30, amount: '20.00', period: 'hour', status: 'active' },
  { key: 'campus-hackathon', title: 'Campus Innovation Hackathon', org: 2, category: 'Hackathon', field: 'Engineering', level: 'Undergraduate', mode: 'onsite', days: 14, amount: null, period: null, status: 'active' },
  { key: 'community-volunteer', title: 'Community Health Volunteer', org: 1, category: 'Volunteer', field: 'Public Health', level: 'High School', mode: 'onsite', days: null, amount: null, period: null, status: 'active' },
  { key: 'closed-fellowship', title: 'Past Research Fellowship', org: 0, category: 'Fellowship', field: 'Computer Science', level: 'Graduate', mode: 'remote', days: -14, amount: '1000.00', period: 'month', status: 'closed' },
];

if (!referenceOnly) {
  for (const name of organizations) {
    statements.push(sql`insert into organizations (name, slug, website_url)
      values (${name}, ${slug(name)}, ${'https://example.invalid'}) on conflict do nothing`);
  }
  // Stable UUID makes the geographic fixture repeatable without adding schema constraints.
  statements.push(sql`insert into locations (id, city, state_region, country, country_code)
    values (${locationId}, 'Columbus', 'Ohio', 'United States', 'US') on conflict do nothing`);
  for (const fixture of fixtures) {
    const opportunitySlug = `demo-${fixture.key}`;
    const organizationSlug = slug(organizations[fixture.org]);
    const deadline = fixture.days === null ? null : new Date(Date.now() + fixture.days * 86_400_000).toISOString();
    const url = `https://example.invalid/opportunities/${opportunitySlug}`;
    statements.push(sql`insert into opportunities
      (organization_id, title, slug, summary, description, application_url, source_url,
       application_deadline, work_mode, external_id, source_type, source_name, posted_at, status)
      values ((select id from organizations where slug = ${organizationSlug}),
       ${`[DEMO] ${fixture.title}`}, ${opportunitySlug},
       'Fictional development fixture. Not a real opportunity.',
       'Seed data for testing discovery, filtering, detail pages and bookmarks. Do not apply.',
       ${url}, ${url}, ${deadline}, ${fixture.mode}, ${fixture.key}, 'seed', 'development-seed', now(), ${fixture.status})
      on conflict do nothing`);
    const opportunityId = sql`(select id from opportunities where slug = ${opportunitySlug} and source_name = 'development-seed')`;
    statements.push(sql`insert into opportunity_categories (opportunity_id, category_id)
      values (${opportunityId}, (select id from categories where name = ${fixture.category})) on conflict do nothing`);
    statements.push(sql`insert into opportunity_fields (opportunity_id, field_id)
      values (${opportunityId}, (select id from fields where name = ${fixture.field})) on conflict do nothing`);
    statements.push(sql`insert into opportunity_education_levels (opportunity_id, education_level_id)
      values (${opportunityId}, (select id from education_levels where name = ${fixture.level})) on conflict do nothing`);
    if (fixture.mode === 'onsite' || fixture.mode === 'hybrid') {
      statements.push(sql`insert into opportunity_locations (opportunity_id, location_id)
        values (${opportunityId}, ${locationId}) on conflict do nothing`);
    }
    if (fixture.amount !== null || fixture.category === 'Volunteer') {
      statements.push(sql`insert into opportunity_compensation
        (opportunity_id, compensation_type, is_paid, min_amount, max_amount, currency, period, raw_text)
        values (${opportunityId}, ${fixture.amount === null ? 'unpaid' : fixture.category === 'Scholarship' ? 'award' : 'pay'},
          ${fixture.amount !== null}, ${fixture.amount}, ${fixture.amount}, 'USD', ${fixture.period},
          'Fictional development compensation; not a real offer.') on conflict do nothing`);
    }
  }
}

try {
  // Neon HTTP batches run in one transaction: either every insert succeeds or none do.
  const queries = statements.map(statement => db.execute(statement));
  await db.batch([queries[0], ...queries.slice(1)]);
  console.log(referenceOnly
    ? 'Reference seed complete: 6 categories, 5 fields, 3 education levels ensured.'
    : 'Seed complete: reference data, 3 demo organizations, 1 location, 6 demo opportunities and their relationships ensured.');
  console.log('Existing rows preserved. No users or bookmarks inserted.');
} catch {
  // Avoid logging connection strings or query parameters from driver exceptions.
  console.error('Seed failed; transaction rolled back. Check connectivity, migrations and conflicting seed identifiers.');
  process.exitCode = 1;
}
