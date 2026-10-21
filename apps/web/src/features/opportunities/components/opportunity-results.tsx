import type { CategoryView } from "@radar/contracts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { discoveryCategoryFor } from "../discovery-categories";
import type { DiscoveryFilters } from "../discovery-filters";
import { useOpportunities } from "../hooks/use-opportunities";
import { FeedMessage } from "./feed-message";
import { OpportunityGrid, OpportunityGridSkeleton } from "./opportunity-grid";
import { ResultsPagination } from "./results-pagination";

const PAGE_SIZE = 12;

export function OpportunityResults({
  filters,
  category,
  page,
  onPageChange,
  onClearFilters,
}: {
  filters: DiscoveryFilters;
  category: CategoryView | undefined;
  page: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}) {
  const { data, error, isLoading, retry } = useOpportunities({
    ...filters,
    status: "active",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const style = category && discoveryCategoryFor(category);
  const Icon = style?.icon;
  const total = data?.pagination.total;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="results-heading">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="results-heading"
          className="flex items-center gap-3 font-serif text-2xl font-semibold"
        >
          {Icon && <Icon className={cn("size-6", style.accentClass)} aria-hidden />}
          {style?.label ?? "All opportunities"}
        </h2>
        {total !== undefined && (
          <span
            className={cn("text-sm font-medium", style?.accentClass ?? "text-muted-foreground")}
            role="status"
          >
            {total} found
          </span>
        )}
      </div>

      {error && !isLoading ? (
        <FeedMessage
          role="alert"
          title="Couldn't load opportunities"
          description="Something went wrong reaching the server. Check your connection and try again."
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : !data ? (
        <OpportunityGridSkeleton count={PAGE_SIZE} />
      ) : data.data.length === 0 ? (
        <FeedMessage
          role="status"
          title="No opportunities found"
          description="Nothing matches your search and filters. Try broadening them."
          action={
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <OpportunityGrid opportunities={data.data} isRefreshing={isLoading} />
          <ResultsPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.pagination.total}
            onPageChange={onPageChange}
          />
        </>
      )}
    </section>
  );
}
