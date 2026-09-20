import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Share the repository-root backend environment, preserving injected values.
config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });

const value = process.env.DATABASE_URL;
if (!value?.trim()) {
  throw new Error('DATABASE_URL is required. Set it in the repository-root .env or hosting environment.');
}

export const databaseUrl = value;
