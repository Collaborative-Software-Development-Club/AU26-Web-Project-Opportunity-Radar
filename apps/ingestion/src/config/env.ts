import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });

export function requireDatabaseUrl(): string {
	const value = process.env.DATABASE_URL?.trim();
	if (!value) throw new Error('DATABASE_URL is required. Set it in the repository-root .env or hosting environment.');
	return value;
}

export function grantsGovKeywords(override?: string): string[] {
	const value = override ?? process.env.GRANTS_GOV_KEYWORDS ?? '';
	return [...new Set(value.split(',').map(keyword => keyword.trim()).filter(Boolean))];
}
