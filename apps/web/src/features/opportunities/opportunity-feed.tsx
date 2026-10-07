import { useMemo, useState } from "react";
import { CategoryFilter } from "./components/category-filter";
import { CategorySection } from "./components/category-section";
import { SearchBar } from "./components/search-bar";
import { DISCOVERY_CATEGORIES } from "./discovery-categories";
import { MOCK_OPPORTUNITIES } from "./mock-data";

const PREVIEW_LIMIT = 3;

export function OpportunityFeed({ firstName }: { firstName: string | null }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const sections = useMemo(
    () =>
      DISCOVERY_CATEGORIES.filter(
        (category) =>
          activeCategory === "all" || category.slug === activeCategory,
      )
        .map((category) => ({
          category,
          opportunities: MOCK_OPPORTUNITIES.filter((opportunity) =>
            opportunity.categories.some(({ slug }) => slug === category.slug),
          ),
        }))
        .filter((section) => section.opportunities.length > 0),
    [activeCategory],
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-5xl font-bold">
        Welcome back
        {firstName && (
          <>
            , <span className="text-teal-700">{firstName}</span>
          </>
        )}
      </h1>
      <SearchBar />
      <CategoryFilter active={activeCategory} onChange={setActiveCategory} />
      {sections.map(({ category, opportunities }) => (
        <CategorySection
          key={category.slug}
          category={category}
          opportunities={opportunities}
          limit={activeCategory === "all" ? PREVIEW_LIMIT : undefined}
        />
      ))}
    </div>
  );
}
