
import { badRequest, type FieldError } from './http-error';

export type Coercer<T> = (raw: unknown) => T;

class Invalid extends Error {}


export const invalid = (message: string): never => { throw new Invalid(message); };

export class Issues {
  private readonly entries: FieldError[] = [];

  add(field: string, message: string): void { this.entries.push({ field, message }); }

  throwIfAny(message: string): void {
    if (this.entries.length) throw badRequest(message, [...this.entries]);
  }
}

export const text = ({ max, min = 1 }: { max: number; min?: number }): Coercer<string> => raw => {
  if (typeof raw !== 'string') return invalid('must be a string');
  const value = raw.trim();
  if (value.length < min) return invalid(min === 1 ? 'must not be empty' : `must be at least ${min} characters`);
  return value.length > max ? invalid(`must be at most ${max} characters`) : value;
};

export const matching = (expression: RegExp, expectation: string, max: number): Coercer<string> => raw => {
  const value = text({ max })(raw);
  return expression.test(value) ? value : invalid(expectation);
};

export const httpUrl = (max = 2048): Coercer<string> => raw => {
  const value = text({ max })(raw);
  let parsed: URL;
  try { parsed = new URL(value); } catch { return invalid('must be an absolute URL'); }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? value : invalid('must use http or https');
};

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})?)?$/;

export const timestamp = (): Coercer<Date> => raw => {
  if (typeof raw !== 'string' || !ISO_DATE_TIME.test(raw.trim())) return invalid('must be an ISO 8601 date or date-time');
  const value = new Date(raw.trim());
  if (Number.isNaN(value.getTime())) return invalid('must be a real calendar date');
  const year = value.getUTCFullYear();
  return year >= 1970 && year <= 2200 ? value : invalid('must fall between 1970 and 2200');
};

export const flag = (): Coercer<boolean> => raw => typeof raw === 'boolean' ? raw : invalid('must be true or false');

export const amount = ({ max }: { max: number }): Coercer<string> => raw => {
  const value = typeof raw === 'number'
    ? (Number.isFinite(raw) ? raw.toString() : invalid('must be a finite number'))
    : typeof raw === 'string' ? raw.trim() : invalid('must be a number or a numeric string');
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return invalid('must be zero or positive with at most 2 decimal places');
  const parsed = Number(value);
  return parsed > max ? invalid(`must not exceed ${max}`) : parsed.toFixed(2);
};

export const oneOf = <T extends string>(allowed: readonly T[]): Coercer<T> => raw => {
  const value = typeof raw === 'string' ? raw.trim() : invalid('must be a string');
  return (allowed as readonly string[]).includes(value)
    ? value as T
    : invalid(`must be one of: ${allowed.join(', ')}`);
};

export const integer = ({ min, max }: { min: number; max: number }): Coercer<number> => raw => {
  const value = typeof raw === 'number' ? raw
    : typeof raw === 'string' && /^-?\d+$/.test(raw.trim()) ? Number(raw.trim())
    : invalid('must be an integer');
  if (!Number.isInteger(value)) return invalid('must be an integer');
  return value < min || value > max ? invalid(`must be between ${min} and ${max}`) : value;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuid = (): Coercer<string> => matching(UUID, 'must be a UUID', 36);

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class ObjectReader {
  constructor(
    private readonly source: Record<string, unknown>,
    readonly issues: Issues,
    private readonly prefix = '',
  ) {}

  
  field<T>(key: string, coercer: Coercer<T>, options?: { required?: boolean; nullable?: false }): T | undefined;
  field<T>(key: string, coercer: Coercer<T>, options: { required?: boolean; nullable: true }): T | null | undefined;
  field<T>(key: string, coercer: Coercer<T>, options: { required?: boolean; nullable?: boolean } = {}): T | null | undefined {
    const path = `${this.prefix}${key}`;
    
    const raw = Object.hasOwn(this.source, key) ? this.source[key] : undefined;
    if (raw === undefined) {
      if (options.required) this.issues.add(path, 'is required');
      return undefined;
    }
    if (raw === null) {
      if (options.nullable) return null;
      this.issues.add(path, 'must not be null');
      return undefined;
    }
    try {
      return coercer(raw);
    } catch (error) {
      this.issues.add(path, error instanceof Invalid ? error.message : 'is invalid');
      return undefined;
    }
  }

  nested(key: string, allowed: readonly string[]): ObjectReader | null | undefined {
    const path = `${this.prefix}${key}`;
    const raw = Object.hasOwn(this.source, key) ? this.source[key] : undefined;
    if (raw === undefined) return undefined;
    if (raw === null) return null;
    if (!isPlainObject(raw)) {
      this.issues.add(path, 'must be an object');
      return undefined;
    }
    const reader = new ObjectReader(raw, this.issues, `${path}.`);
    reader.rejectUnknown(allowed);
    return reader;
  }

  rejectUnknown(allowed: readonly string[]): void {
    for (const key of Object.keys(this.source)) {
      if (!allowed.includes(key)) this.issues.add(`${this.prefix}${key}`, 'is not a recognized field');
    }
  }
}

export function readerFor(payload: unknown, issues: Issues, label = 'body'): ObjectReader {
  if (!isPlainObject(payload)) throw badRequest(`Request ${label} must be a JSON object.`);
  return new ObjectReader(payload, issues);
}


export function definedOnly<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}
