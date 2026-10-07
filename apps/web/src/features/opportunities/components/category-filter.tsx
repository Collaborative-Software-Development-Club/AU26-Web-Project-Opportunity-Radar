import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DISCOVERY_CATEGORIES } from "../discovery-categories";

export function CategoryFilter({
  active,
  onChange,
}: {
  active: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-3"
      role="group"
      aria-label="Filter by category"
    >
      <Button
        className="rounded-full px-5"
        variant={active === "all" ? "default" : "outline"}
        aria-pressed={active === "all"}
        onClick={() => onChange("all")}
      >
        All
      </Button>
      {DISCOVERY_CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isActive = active === category.slug;
        return (
          <Button
            key={category.slug}
            variant="ghost"
            aria-pressed={isActive}
            onClick={() => onChange(category.slug)}
            className={cn(
              "rounded-full px-5",
              category.chipClass,
              isActive && "ring-2 ring-current",
            )}
          >
            <Icon aria-hidden />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}
