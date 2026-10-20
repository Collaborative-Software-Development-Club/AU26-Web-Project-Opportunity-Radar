import type { OpportunityView } from "@radar/contracts";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DiscoveryCategory } from "../discovery-categories";
import { OpportunityCard } from "./opportunity-card";

export function CategorySection({
  category,
  opportunities,
  limit,
}: {
  category: DiscoveryCategory;
  opportunities: OpportunityView[];
  limit?: number;
}) {
  const Icon = category.icon;
  const headingId = `${category.slug}-heading`;

  return (
    <section className="flex flex-col gap-4" aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="flex items-center gap-3 font-serif text-2xl font-semibold"
        >
          <Icon className={cn("size-6", category.accentClass)} aria-hidden />
          {category.label}
        </h2>
        <div
          className={cn(
            "flex items-center gap-4 text-sm font-medium",
            category.accentClass,
          )}
        >
          <span>{opportunities.length} found</span>
          <Button variant="link" className={cn("px-0", category.accentClass)}>
            View all <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.slice(0, limit).map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            badgeClass={category.badgeClass}
          />
        ))}
      </div>
    </section>
  );
}
