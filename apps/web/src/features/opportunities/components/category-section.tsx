import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "../discovery-categories";
import { useOpportunities } from "../hooks/use-opportunities";
import { OpportunityGrid, OpportunityGridSkeleton } from "./opportunity-grid";

const PREVIEW_LIMIT = 3;

export function CategorySection({
  category,
  onViewAll,
}: {
  category: DiscoveryCategory;
  onViewAll: () => void;
}) {
  const { slug, label, icon: Icon, accentClass, badgeClass } = category;
  const { data, error, isLoading, retry } = useOpportunities({
    category: slug,
    status: "active",
    limit: PREVIEW_LIMIT,
  });
  const headingId = `${slug}-heading`;
  const total = data?.pagination.total;

  return (
    <section className="flex flex-col gap-4" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="flex items-center gap-3 font-serif text-2xl font-semibold"
        >
          <Icon className={cn("size-6", accentClass)} aria-hidden />
          {label}
        </h2>
        {total !== undefined && (
          <div
            className={cn(
              "flex items-center gap-4 text-sm font-medium",
              accentClass,
            )}
          >
            <span>{total} found</span>
            {total > 0 && (
              <Button
                variant="link"
                className={cn("px-0", accentClass)}
                onClick={onViewAll}
              >
                View all <ArrowRight aria-hidden />
              </Button>
            )}
          </div>
        )}
      </div>
      {error && !isLoading ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Couldn't load {label.toLowerCase()}.{" "}
          <Button variant="link" className="h-auto px-0" onClick={retry}>
            Try again
          </Button>
        </p>
      ) : !data ? (
        <OpportunityGridSkeleton count={PREVIEW_LIMIT} />
      ) : data.data.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          No open {label.toLowerCase()} right now.
        </p>
      ) : (
        <OpportunityGrid
          opportunities={data.data}
          badgeClass={badgeClass}
          isRefreshing={isLoading}
        />
      )}
    </section>
  );
}
