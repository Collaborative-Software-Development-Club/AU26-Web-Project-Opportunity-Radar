import type { OpportunityView } from "@radar/contracts";
import { cn } from "@/lib/utils";
import { badgeClassFor } from "../discovery-categories";
import { OpportunityCard, OpportunityCardSkeleton } from "./opportunity-card";

const GRID_CLASS = "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3";

export function OpportunityGrid({
  opportunities,
  badgeClass,
  isRefreshing = false,
}: {
  opportunities: OpportunityView[];
  badgeClass?: string;
  isRefreshing?: boolean;
}) {
  return (
    <div
      className={cn(GRID_CLASS, "transition-opacity", isRefreshing && "opacity-60")}
      aria-busy={isRefreshing}
    >
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          badgeClass={badgeClass ?? badgeClassFor(opportunity.categories)}
        />
      ))}
    </div>
  );
}

export function OpportunityGridSkeleton({ count }: { count: number }) {
  return (
    <div className={GRID_CLASS} role="status" aria-label="Loading opportunities">
      {Array.from({ length: count }, (_, index) => (
        <OpportunityCardSkeleton key={index} />
      ))}
    </div>
  );
}
