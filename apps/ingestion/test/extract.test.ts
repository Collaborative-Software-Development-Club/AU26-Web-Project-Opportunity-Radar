import assert from 'node:assert/strict';
import test from 'node:test';
import { extractGrantsGov } from '../src/pipeline/extract.ts';

test('extractGrantsGov paginates keywords and deduplicates repeated IDs', async () => {
  const calls: string[] = [];
  const adapter = {
    async searchPage({ keyword, startRecordNum }: { keyword: string; startRecordNum: number }) {
      calls.push(`${keyword}:${startRecordNum}`);
      if (startRecordNum === 0) {
        return { hitCount: 2, hits: [{ id: keyword === 'health' ? '1' : '2', title: 'First page' }] };
      }
      return { hitCount: 2, hits: [{ id: '2', title: 'Second' }] };
    },
  };

  const result = await extractGrantsGov({ keywords: ['health', ' health ', 'education'], rows: 1, adapter });

  assert.deepEqual(calls, ['health:0', 'health:1', 'education:0', 'education:1']);
  assert.deepEqual(result.records.map(record => record.id), ['1', '2']);
  assert.equal(result.skipped, 0);
});

test('extractGrantsGov skips malformed hits and reports them', async () => {
  const invalidHits: unknown[] = [];
  const adapter = {
    async searchPage() {
      return { hitCount: 2, hits: [{ title: 'No ID' }, { id: 'valid', title: 'Valid' }] };
    },
  };

  const result = await extractGrantsGov({
    keywords: ['health'],
    adapter,
    onInvalidHit: hit => invalidHits.push(hit),
  });

  assert.equal(result.records.length, 1);
  assert.equal(result.skipped, 1);
  assert.equal(invalidHits.length, 1);
});