import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { once } from 'node:events';
import { spawnSync } from 'node:child_process';
import { after, test } from 'node:test';

// Exercise the real Clerk verifier with ephemeral keys, without Clerk accounts or network calls.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
process.env.CLERK_PUBLISHABLE_KEY = `pk_test_${Buffer.from('auth-test.clerk.accounts.dev$').toString('base64')}`;
process.env.CLERK_SECRET_KEY = 'sk_test_local_fixture_only';
process.env.CLERK_JWT_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
process.env.CLERK_AUTHORIZED_PARTIES = 'http://localhost:5174';
process.env.WEB_ORIGINS = 'http://localhost:5174';
process.env.CLERK_TELEMETRY_DISABLED = '1';

const { app } = await import('../src/app');
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
const address = server.address();
assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;

function token(overrides: Record<string, unknown> = {}, key = privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://auth-test.clerk.accounts.dev', sub: 'user_test', sid: 'sess_test',
    azp: 'http://localhost:5174', iat: now, nbf: now - 10, exp: now + 60,
    ...overrides,
  })).toString('base64url');
  const message = `${header}.${payload}`;
  return `${message}.${sign('RSA-SHA256', Buffer.from(message), key).toString('base64url')}`;
}

test('health remains public even with an invalid token', async () => {
  const response = await fetch(`${base}/health`, { headers: { Authorization: 'Bearer invalid' } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', scope: 'process-only' });
});

test('CORS preflight permits bearer authentication without a session', async () => {
  const response = await fetch(`${base}/api/users/me`, {
    method: 'OPTIONS', headers: { Origin: 'http://localhost:5174',
      'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5174');
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /authorization/i);
});

test('verified session returns the Clerk identity and prevents caching', async () => {
  const response = await fetch(`${base}/api/users/me`, { headers: { Authorization: `Bearer ${token()}` } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { clerkUserId: 'user_test' });
});

const otherKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey;
for (const [name, value] of [
  ['missing', undefined], ['malformed', 'invalid'],
  ['expired', token({ exp: Math.floor(Date.now() / 1000) - 60 })],
  ['wrong origin', token({ azp: 'https://untrusted.example' })],
  ['forged signature', token({}, otherKey)],
] as const) {
  test(`${name} token receives JSON 401 without redirect`, async () => {
    const response = await fetch(`${base}/api/users/me`, {
      headers: value ? { Authorization: `Bearer ${value}` } : {}, redirect: 'manual',
    });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('location'), null);
    assert.deepEqual(await response.json(), { error: 'Unauthorized' });
  });
}

for (const [name, value] of [
  ['CLERK_SECRET_KEY', ''], ['CLERK_PUBLISHABLE_KEY', ''],
  ['CLERK_AUTHORIZED_PARTIES', ''], ['CLERK_AUTHORIZED_PARTIES', 'https://example.com/path'],
] as const) {
  test(`startup rejects invalid ${name}: ${value || '(empty)'}`, () => {
    const result = spawnSync(process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', "await import('./src/config/env.ts')"],
      { cwd: new URL('..', import.meta.url), env: { ...process.env, [name]: value }, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(name));
  });
}
