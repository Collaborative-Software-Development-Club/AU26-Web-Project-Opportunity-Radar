import { useApiQuery } from "@/hooks/use-api-query";

export function useLookups() {
  return useApiQuery("lookups", async (api, signal) => {
    const { data } = await api.lookups.list({ signal });
    return data;
  });
}
