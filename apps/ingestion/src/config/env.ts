import path from 'node:path';
import dotenv from 'dotenv';

// 1. Explicitly load repository-root .env for local development, preserving existing env vars
dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
  override: false, // Does not overwrite variables already set in process.env
});

// 2. Validate DATABASE_URL (ingestion doesn't require Clerk or API keys)
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for ingestion. Set it in the repository-root .env or hosting environment.',
  );
}

export const env = {
  DATABASE_URL: databaseUrl,
};