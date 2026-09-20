import { defineConfig } from 'drizzle-kit';
import { databaseUrl } from './src/env';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
});
