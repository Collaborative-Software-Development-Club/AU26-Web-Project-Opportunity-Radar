import type { ListOpportunitiesParams } from "@radar/contracts";
import { useApiQuery } from "@/hooks/use-api-query";

export function useOpportunities(params: ListOpportunitiesParams) {
  return useApiQuery(`opportunities:${JSON.stringify(params)}`, (api, signal) =>
    api.opportunities.list(params, { signal }),
  );
}
