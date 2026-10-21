import { useApiQuery } from '@/hooks/use-api-query';

// The route always supplies :id.
export const useOrganization = (id: string | undefined) =>
    useApiQuery(`organization:${id}`, (api, signal) => api.organizations.get(id!, { signal }));
