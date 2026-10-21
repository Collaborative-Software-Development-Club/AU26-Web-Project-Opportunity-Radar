import type { WorkMode } from "@radar/contracts";

export type DiscoveryFilters = {
  q?: string;
  category?: string;
  location?: string;
  workMode?: WorkMode;
};
