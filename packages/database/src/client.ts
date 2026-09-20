import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { databaseUrl } from './env';
import * as schema from './schema';

export const db = drizzle(neon(databaseUrl), { schema });
