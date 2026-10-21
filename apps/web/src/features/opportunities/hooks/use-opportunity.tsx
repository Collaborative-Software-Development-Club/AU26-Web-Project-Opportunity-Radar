import { useApiQuery } from '@/hooks/use-api-query';

// The route always supplies :id.
export const useOpportunity = (id: string | undefined) =>
    useApiQuery(`opportunity:${id}`, (api, signal) => api.opportunities.get(id!, { signal }));
