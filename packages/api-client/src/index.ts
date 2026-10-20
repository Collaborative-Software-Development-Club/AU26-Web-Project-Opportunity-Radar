// Typed HTTP client shared by web and mobile
import type {
  CreateOpportunityRequest, CreateOrganizationRequest, ListOpportunitiesParams,
  ListOrganizationsParams, LookupsResponse, OpportunityListResponse, OpportunityView,
  OrganizationDetail, OrganizationListResponse, OrganizationView,
  UpdateOpportunityRequest, UpdateOrganizationRequest, UpdateUserProfileRequest, UserProfileView,
} from '@radar/contracts';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getToken: () => Promise<string | null>;
};

// Pass an AbortController's signal to drop a request whose result is no longer needed.
export type RequestOptions = { signal?: AbortSignal };

type QueryValue = string | number | boolean | undefined | null;

// Unset values are left out, so `{ q: undefined }` sends no `q` at all.
function toQuery(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  const root = baseUrl.replace(/\/+$/, '');

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const res = await fetch(`${root}${path}`, { ...init, headers });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  const id = (value: string) => encodeURIComponent(value);
  const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

  return {
    request,
    opportunities: {
      list: (params: ListOpportunitiesParams = {}, options: RequestOptions = {}) =>
        request<OpportunityListResponse>(`/api/opportunities${toQuery(params)}`, options),
      get: (opportunityId: string, options: RequestOptions = {}) =>
        request<OpportunityView>(`/api/opportunities/${id(opportunityId)}`, options),
      create: (opportunity: CreateOpportunityRequest) =>
        request<OpportunityView>('/api/opportunities', json('POST', opportunity)),
      update: (opportunityId: string, changes: UpdateOpportunityRequest) =>
        request<OpportunityView>(`/api/opportunities/${id(opportunityId)}`, json('PATCH', changes)),
      remove: (opportunityId: string) =>
        request<void>(`/api/opportunities/${id(opportunityId)}`, { method: 'DELETE' }),
    },
    organizations: {
      list: (params: ListOrganizationsParams = {}, options: RequestOptions = {}) =>
        request<OrganizationListResponse>(`/api/organizations${toQuery(params)}`, options),
      get: (organizationId: string, options: RequestOptions = {}) =>
        request<OrganizationDetail>(`/api/organizations/${id(organizationId)}`, options),
      create: (organization: CreateOrganizationRequest) =>
        request<OrganizationView>('/api/organizations', json('POST', organization)),
      update: (organizationId: string, changes: UpdateOrganizationRequest) =>
        request<OrganizationView>(`/api/organizations/${id(organizationId)}`, json('PATCH', changes)),
      remove: (organizationId: string) =>
        request<void>(`/api/organizations/${id(organizationId)}`, { method: 'DELETE' }),
    },
    lookups: {
      list: (options: RequestOptions = {}) => request<LookupsResponse>('/api/lookups', options),
    },
    // Uncomment (and import SavedListResponse) once "Basic CRUD for Saved Opportunities" lands
    // saved: {
    //   list: (options: RequestOptions = {}) => request<SavedListResponse>('/api/saved', options),
    //   save: (opportunityId: string) =>
    //     request<void>(`/api/saved/${id(opportunityId)}`, { method: 'POST' }),
    //   remove: (opportunityId: string) =>
    //     request<void>(`/api/saved/${id(opportunityId)}`, { method: 'DELETE' }),
    // },
    // Typed to the agreed profile contract; the API returns it once "User Profile CRUD" lands.
    users: {
      me: (options: RequestOptions = {}) => request<UserProfileView>('/api/users/me', options),
      updateMe: (changes: UpdateUserProfileRequest) =>
        request<UserProfileView>('/api/users/me', json('PATCH', changes)),
      deleteMe: () => request<void>('/api/users/me', { method: 'DELETE' }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
