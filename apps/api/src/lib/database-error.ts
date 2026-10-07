export const UNIQUE_VIOLATION = '23505';
export const FOREIGN_KEY_VIOLATION = '23503';

export type DatabaseFailure = { code?: string; constraint?: string };

// Postgres drivers expose SQLSTATE on the error, sometimes only on a wrapped cause.
export function databaseFailure(error: unknown): DatabaseFailure {
  for (const candidate of [error, error instanceof Error ? error.cause : undefined]) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const { code, constraint } = candidate as Record<string, unknown>;
    if (typeof code === 'string') {
      return { code, constraint: typeof constraint === 'string' ? constraint : undefined };
    }
  }
  return {};
}
