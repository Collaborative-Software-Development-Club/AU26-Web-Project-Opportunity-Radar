import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Load repository-root .env reliably using ESM URL resolution
config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });

export function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error('DATABASE_URL is required. Set it in the repository-root .env or hosting environment.');
  }
  return value;
}

export const env = {
  get DATABASE_URL() {
    return requireDatabaseUrl();
  },
};