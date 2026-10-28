import assert from 'node:assert/strict';
import test from 'node:test';
import { createGrantsGovAdapter } from '../src/sources/grants-gov.ts';

test('Grants.gov adapter sends a search request and maps the API response', async () => {
  let requestUrl: string | URL | Request | undefined;
  let requestInit: RequestInit | undefined;
  const adapter = createGrantsGovAdapter({
    endpoint: 'https://example.test/search',
    fetchImpl: (async (url, init) => {
      requestUrl = url;
      requestInit = init;
      return Response.json({
        errorcode: 0,
        data: { hitCount: 1, oppHits: [{ id: '123', title: 'Example grant' }] },
      });
    }) as typeof fetch,
  });

  const page = await adapter.searchPage({ keyword: 'health', startRecordNum: 0, rows: 10 });

  assert.equal(requestUrl, 'https://example.test/search');
  assert.equal(requestInit?.method, 'POST');
  assert.deepEqual(JSON.parse(String(requestInit?.body)), {
    keyword: 'health',
    startRecordNum: 0,
    rows: 10,
    oppStatuses: 'forecasted|posted',
  });
  assert.deepEqual(page, { hitCount: 1, hits: [{ id: '123', title: 'Example grant' }] });
});

test('Grants.gov adapter reports unsuccessful HTTP responses', async () => {
  const adapter = createGrantsGovAdapter({
    fetchImpl: (async () => new Response('', { status: 503 })) as typeof fetch,
  });

  await assert.rejects(
    adapter.searchPage({ keyword: 'health', startRecordNum: 0, rows: 10 }),
    /HTTP 503/,
  );
});

test('Grants.gov adapter omits keyword when searching broadly', async () => {
  let requestBody = '';
  const adapter = createGrantsGovAdapter({
    fetchImpl: (async (_url, init) => {
      requestBody = String(init?.body);
      return Response.json({ errorcode: 0, data: { hitCount: 0, oppHits: [] } });
    }) as typeof fetch,
  });

  await adapter.searchPage({ startRecordNum: 0, rows: 5 });

  assert.deepEqual(JSON.parse(requestBody), {
    startRecordNum: 0,
    rows: 5,
    oppStatuses: 'forecasted|posted',
  });
});