import { WORK_MODES } from "@radar/contracts";
import { useSearchParams } from "react-router";
import type { DiscoveryFilters } from "../discovery-filters";

export function useDiscoveryParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const read = (key: string) => searchParams.get(key) || undefined;
  const workMode = read("workMode");
  const filters: DiscoveryFilters = {
    q: read("q"),
    category: read("category"),
    location: read("location"),
    workMode: WORK_MODES.find((mode) => mode === workMode),
  };
  const page = Math.max(1, Math.floor(Number(searchParams.get("page"))) || 1);
  const hasFilters = Object.values(filters).some(Boolean);

  function update(changes: Partial<DiscoveryFilters>) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        next.delete("page");
        return next;
      },
      { replace: Object.keys(changes).every((key) => key === "q") },
    );
  }

  function setPage(nextPage: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      return next;
    });
  }

  function clear() {
    setSearchParams(new URLSearchParams());
  }

  return { filters, page, hasFilters, update, setPage, clear };
}
