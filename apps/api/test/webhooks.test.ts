import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { after, test } from 'node:test';
import express from 'express';
import { createClerkWebhookHandler } from '../src/webhooks/clerk/clerk.handler';
import type { ClerkUserInsert } from '../src/modules/users/users.repository';

const key = randomBytes(32);
const secret = `whsec_${key.toString('base64')}`;
const rows = new Map<string, ClerkUserInsert>();
let writes = 0;
let failWrite = false;
let configured = true;
const app = express();
app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), createClerkWebhookHandler({
  signingSecret: () => configured ? secret : undefined,
  insertUser: async user => {
    writes++;
    if (failWrite) throw new Error('Simulated database failure');
    if (!rows.has(user.clerkUserId)) rows.set(user.clerkUserId, user);
  },
}));
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const url = `http://127.0.0.1:${address.port}/webhooks/clerk`;
const profile = {
  id: 'user_signup', first_name: 'Ada', last_name: 'Lovelace',
  primary_email_address_id: 'email_primary',
  email_addresses: [
    { id: 'email_other', email_address: 'other@example.test' },
    { id: 'email_primary', email_address: 'ada@example.test' },
  ],
};
function delivery(data: unknown = profile, type = 'user.created', timestamp = Math.floor(Date.now() / 1000)) {
  const body = JSON.stringify({ type, data });
  const id = 'msg_test';
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return { body, headers: { 'content-type': 'application/json', 'svix-id': id,
    'svix-timestamp': String(timestamp), 'svix-signature': `v1,${signature}` } };
}
const send = (request = delivery()) => fetch(url, { method: 'POST', ...request });

test('signed signup maps primary email and acknowledges repeated delivery', async () => {
  const request = delivery();
  assert.equal((await send(request)).status, 200);
  assert.equal((await send(request)).status, 200);
  assert.deepEqual(rows.get(profile.id), {
    clerkUserId: profile.id, email: 'ada@example.test', firstName: 'Ada', lastName: 'Lovelace',
  });
  assert.equal(rows.size, 1);
});

test('optional Clerk names are stored as empty strings', async () => {
  assert.equal((await send(delivery({ ...profile, id: 'user_nameless', first_name: null, last_name: null }))).status, 200);
  assert.equal(rows.get('user_nameless')?.firstName, '');
  assert.equal(rows.get('user_nameless')?.lastName, '');
});

test('tampered body, missing signature, and stale signature cannot write', async () => {
  const before = writes;
  const tampered = delivery();
  tampered.body = tampered.body.replace('Ada', 'Eve');
  assert.equal((await send(tampered)).status, 400);
  const unsigned = delivery();
  unsigned.headers['svix-signature'] = '';
  assert.equal((await send(unsigned)).status, 400);
  assert.equal((await send(delivery(profile, 'user.created', Math.floor(Date.now() / 1000) - 600))).status, 400);
  assert.equal(writes, before);
});

test('missing primary email and oversized names cannot write', async () => {
  const before = writes;
  assert.equal((await send(delivery({ ...profile, primary_email_address_id: null }))).status, 422);
  assert.equal((await send(delivery({ ...profile, first_name: 'a'.repeat(101) }))).status, 422);
  assert.equal(writes, before);
});

test('unsubscribed lifecycle events are acknowledged without mutation', async () => {
  const before = writes;
  const response = await send(delivery(profile, 'user.deleted'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ignored' });
  assert.equal(writes, before);
});

test('database failure remains retryable and does not leak details', async () => {
  failWrite = true;
  try {
    const response = await send();
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Unable to persist Clerk user.' });
  } finally { failWrite = false; }
});

test('unconfigured endpoint fails closed', async () => {
  configured = false;
  const before = writes;
  try { assert.equal((await send()).status, 503); } finally { configured = true; }
  assert.equal(writes, before);
});
