import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeGrantsGovOpportunity } from '../src/pipeline/normalize';

test('normalizes Grants.gov search hit fields and canonical URL', () => {
  const opportunity = normalizeGrantsGovOpportunity({
    id: '361754',
    number: 'PA-FPH-27-001',
    title: ' Title X Family Planning Services Grants ',
    agency: 'Office of the Assistant Secretary for Health',
    openDate: '04/03/2026',
    closeDate: '01/11/2027',
    oppStatus: 'posted',
  }, new Date('2026-09-30T00:00:00.000Z'));

  assert.equal(opportunity.title, 'Title X Family Planning Services Grants');
  assert.equal(opportunity.slug, 'grants-gov-361754');
  assert.equal(opportunity.externalId, '361754');
  assert.equal(opportunity.sourceName, 'grants-gov');
  assert.equal(opportunity.status, 'active');
  assert.equal(opportunity.applicationUrl, 'https://www.grants.gov/search-results-detail/361754');
  assert.equal(opportunity.applicationDeadline?.toISOString(), '2027-01-11T23:59:59.999Z');
  assert.equal(opportunity.postedAt, null);
  assert.equal(opportunity.description, null);
});

test('maps closed and elapsed opportunities and allows blank close dates', () => {
  const now = new Date('2026-09-30T00:00:00.000Z');
  assert.equal(normalizeGrantsGovOpportunity({ id: '1', title: 'Closed', oppStatus: 'closed' }, now).status, 'closed');
  assert.equal(normalizeGrantsGovOpportunity({ id: '2', title: 'Expired', closeDate: '09/29/2026' }, now).status, 'expired');
  assert.equal(normalizeGrantsGovOpportunity({ id: '3', title: 'Forecast', closeDate: '' }, now).applicationDeadline, null);
});

test('rejects missing required fields and invalid calendar dates', () => {
  assert.throws(() => normalizeGrantsGovOpportunity({ id: '1' }), /missing its title/);
  assert.throws(() => normalizeGrantsGovOpportunity({ title: 'No ID' }), /missing its ID/);
  assert.throws(() => normalizeGrantsGovOpportunity({ id: '1', title: 'Bad date', closeDate: '02/30/2027' }), /invalid calendar date/);
});