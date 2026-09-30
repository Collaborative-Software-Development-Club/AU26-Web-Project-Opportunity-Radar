// Todo: implement rate limiting and automatic retries 
export const GRANTS_GOV_API_URL = 'https://api.grants.gov/v1/api/search2';
export const GRANTS_GOV_SOURCE_NAME = 'grants-gov';
export const DEFAULT_GRANTS_GOV_PAGE_SIZE = 100;

export type SearchPageRequest = {
  keyword: string;
  startRecordNum: number;
  rows: number;
};

// Desired result format
export type SearchPage<Hit> = {
  hits: Hit[];
  hitCount: number;
};

// The contract that any new API source adapter must fulfill
export interface OpportunitySourceAdapter<Hit> {
  searchPage(request: SearchPageRequest): Promise<SearchPage<Hit>>;
}

export type GrantsGovSearchHit = {
  id?: unknown;
  [key: string]: unknown;
};

// The Grants.gov API response format
type GrantsGovApiResponse = {
  errorcode?: unknown;
  msg?: unknown;
  data?: {
    hitCount?: unknown;
    oppHits?: unknown;
  };
};

type FetchLike = typeof fetch;

// Map the Grants.gov API response to our SearchPage format
function mapApiResponse(payload: GrantsGovApiResponse): SearchPage<GrantsGovSearchHit> {
  if (payload.errorcode !== 0 || !payload.data || !Array.isArray(payload.data.oppHits)) {
    const message = typeof payload.msg === 'string' ? payload.msg : 'unexpected response';
    throw new Error(`Grants.gov search response was invalid: ${message}`);
  }

  const hitCount = Number(payload.data.hitCount);
  if (!Number.isInteger(hitCount) || hitCount < 0) {
    throw new Error('Grants.gov search response included an invalid hitCount.');
  }

  return { hits: payload.data.oppHits as GrantsGovSearchHit[], hitCount };
}

// Create an adapter for the Grants.gov API that implements the OpportunitySourceAdapter interface
export function createGrantsGovAdapter(options: {
  endpoint?: string;
  fetchImpl?: FetchLike;
} = {}): OpportunitySourceAdapter<GrantsGovSearchHit> {
  const endpoint = options.endpoint ?? process.env.GRANTS_GOV_API_URL ?? GRANTS_GOV_API_URL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async searchPage(request) {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...request, oppStatuses: 'forecasted|posted' }),
      });

      if (!response.ok) {
        throw new Error(`Grants.gov search request failed with HTTP ${response.status}.`);
      }

      let payload: GrantsGovApiResponse;
      try {
        payload = await response.json() as GrantsGovApiResponse;
      } catch {
        throw new Error('Grants.gov returned invalid JSON.');
      }

      return mapApiResponse(payload);
    },
  };
}