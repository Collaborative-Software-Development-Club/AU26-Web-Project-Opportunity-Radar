import type { CategoryView } from "@radar/contracts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { discoveryCategoryFor } from "../discovery-categories";

export function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: CategoryView[];
  active: string | undefined;
  onChange: (slug: string | undefined) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-3"
      role="group"
      aria-label="Filter by category"
    >
      <Button
        className="rounded-full px-5"
        variant={active ? "outline" : "default"}
        aria-pressed={!active}
        onClick={() => onChange(undefined)}
      >
        All
      </Button>
      {categories.map((category) => {
        const { slug, label, icon: Icon, chipClass } = discoveryCategoryFor(category);
        const isActive = active === slug;
        return (
          <Button
            key={slug}
            variant="ghost"
            aria-pressed={isActive}
            onClick={() => onChange(isActive ? undefined : slug)}
            className={cn(
              "rounded-full px-5",
              chipClass,
              isActive && "ring-2 ring-current",
            )}
          >
            <Icon aria-hidden />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
