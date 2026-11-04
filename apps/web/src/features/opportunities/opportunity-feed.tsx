import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CategoryFilter } from "./components/category-filter";
import { CategorySection } from "./components/category-section";
import { FilterPanel } from "./components/filter-panel";
import { OpportunityResults } from "./components/opportunity-results";
import { SearchBar } from "./components/search-bar";
import { DISCOVERY_CATEGORIES } from "./discovery-categories";
import { useDiscoveryParams } from "./hooks/use-discovery-params";
import { useLookups } from "./hooks/use-lookups";

export function OpportunityFeed({ heading, id }: { heading: ReactNode; id?: string }) {
  const { filters, page, hasFilters, update, setPage, clear } = useDiscoveryParams();
  const lookups = useLookups();
  const categories = lookups.data?.categories ?? [];

  function changePage(nextPage: number) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div id={id} className="mx-auto flex w-full max-w-6xl scroll-mt-8 flex-col gap-8">
      {heading}
      <SearchBar value={filters.q ?? ""} onSearch={(q) => update({ q })} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CategoryFilter
            categories={categories}
            active={filters.category}
            onChange={(category) => update({ category })}
          />
          <FilterPanel
            locations={lookups.data?.locations ?? []}
            filters={filters}
            hasFilters={hasFilters}
            onChange={update}
            onClear={clear}
          />
        </div>
        {Boolean(lookups.error) && !lookups.isLoading && (
          <p role="alert" className="text-sm text-muted-foreground">
            Couldn't load filter options.{" "}
            <Button variant="link" className="h-auto px-0" onClick={lookups.retry}>
              Try again
            </Button>
          </p>
        )}
      </div>
      {hasFilters ? (
        <OpportunityResults
          filters={filters}
          category={categories.find(({ slug }) => slug === filters.category)}
          page={page}
          onPageChange={changePage}
          onClearFilters={clear}
        />
      ) : (
        DISCOVERY_CATEGORIES.map((category) => (
          <CategorySection
            key={category.slug}
            category={category}
            onViewAll={() => update({ category: category.slug })}
          />
        ))
      )}
    </div>
  );
}
