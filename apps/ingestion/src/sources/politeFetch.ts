const USER_AGENT = 'student-opportunity-radar (contact: dyer.449@osu.edu)';
const MAX_RETRY_AFTER_MS = 60_000;

export interface PoliteFetchOptions {
  minDelayMs?: number;
  maxAttempts?: number;
  baseBackoffMs?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
  sleepImpl?: (ms: number) => Promise<void>;
}

const lastRequestAtByHost = new Map<string, number>();

export function resetPoliteFetchState(): void {
  lastRequestAtByHost.clear();
}

export async function politeFetch(url: string, options: PoliteFetchOptions = {}): Promise<string> {
  const {
    minDelayMs = 1000,
    maxAttempts = 4,
    baseBackoffMs = 1000,
    timeoutMs = 15_000,
    headers = {},
    fetchImpl = fetch,
    sleepImpl = (ms) => new Promise((res) => setTimeout(res, ms)),
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Domain rate limiting
    const host = new URL(url).host;
    const last = lastRequestAtByHost.get(host);
    if (last && minDelayMs - (Date.now() - last) > 0) {
      await sleepImpl(minDelayMs - (Date.now() - last));
    }
    lastRequestAtByHost.set(host, Date.now());

    let res: Response;
    try {
      res = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml', ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) await sleepImpl(baseBackoffMs * 2 ** (attempt - 1));
      continue;
    }

    if (res.ok) return await res.text();

    const err = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);

    // Fail immediately on non-retryable status codes (e.g., 404, 403)
    if (res.status !== 429 && res.status < 500) throw err;

    lastError = err;
    if (attempt < maxAttempts) {
      const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
      if (retryAfter !== undefined && retryAfter > MAX_RETRY_AFTER_MS) {
        throw new Error(`${err.message} (Retry-After header exceeds max limit)`);
      }
      await sleepImpl(retryAfter ?? baseBackoffMs * 2 ** (attempt - 1));
    }
  }

  throw new Error(`Giving up on ${url} after ${maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function parseRetryAfter(val: string | null): number | undefined {
  if (!val) return undefined;
  const sec = Number(val);
  if (Number.isFinite(sec)) return Math.max(0, sec * 1000);
  const date = Date.parse(val);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}