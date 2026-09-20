import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
// Resolve against this file so npm workspace commands use the same root .env.
// dotenv preserves values already supplied by the hosting environment.
config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });
const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
export const env = {
  port,
  webOrigins: (process.env.WEB_ORIGINS ?? 'http://localhost:5174').split(',').map(value => value.trim()).filter(Boolean),
  clerkAuthorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES ?? process.env.WEB_ORIGINS ?? 'http://localhost:5174').split(',').map(value => value.trim()).filter(Boolean),
};
for (const [name, origins] of [['WEB_ORIGINS', env.webOrigins], ['CLERK_AUTHORIZED_PARTIES', env.clerkAuthorizedParties]] as const) {
  if (!origins.length) throw new Error(`${name} must contain at least one origin.`);
  for (const origin of origins) {
    let valid = false;
    try { const url = new URL(origin); valid = ['http:', 'https:'].includes(url.protocol) && url.origin === origin; } catch { /* Invalid origin. */ }
    if (!valid) throw new Error(`${name} must contain comma-separated HTTP(S) origins without paths, trailing slashes, or Markdown.`);
  }
}
for (const name of ['CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'] as const) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required. Set it in the repository-root .env or hosting environment.`);
}
