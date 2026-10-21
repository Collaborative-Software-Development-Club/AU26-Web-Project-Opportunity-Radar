import type { OpportunityView } from "@radar/contracts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedMessage } from "@/features/opportunities/components/feed-message";
import { getMeta, getTag } from "@/features/opportunities/components/opportunity-card";
import { discoveryCategoryFor } from "@/features/opportunities/discovery-categories";
import { OpportunityCard } from "./OpportunityCard";

type Group = { slug: string; label: string; opportunities: OpportunityView[] };

const OTHER = { slug: "other", label: "Other" };

const UPCOMING_COUNT = 4;

// An opportunity's first category decides its section, icon and badge colour.
function categoryOf(opportunity: OpportunityView) {
  const [first] = opportunity.categories;
  return first ? discoveryCategoryFor(first) : OTHER;
}

function groupByCategory(opportunities: OpportunityView[]): Group[] {
  const groups = new Map<string, Group>();
  for (const opportunity of opportunities) {
    const { slug, label } = categoryOf(opportunity);
    const group = groups.get(slug) ?? { slug, label, opportunities: [] };
    group.opportunities.push(opportunity);
    groups.set(slug, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function SavedCard({ opportunity }: { opportunity: OpportunityView }) {
  return (
    <OpportunityCard
      opportunityId={opportunity.id}
      title={opportunity.title}
      organization={opportunity.organization?.name ?? ""}
      badge={getTag(opportunity) ?? ""}
      date={getMeta(opportunity)}
      category={categoryOf(opportunity).slug}
    />
  );
}

// Unsaving here keeps the card (with an empty heart) until the next load, so a misclick can be undone.
export function SavedOpportunities({
  opportunities,
  error,
  retry,
}: {
  opportunities?: OpportunityView[];
  error?: unknown;
  retry: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("all");

  if (error)
    return (
      <FeedMessage
        role="alert"
        title="Couldn't load saved opportunities"
        description="Something went wrong reaching the server. Check your connection and try again."
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
  if (!opportunities) return <p role="status">Loading saved opportunities…</p>;
  if (opportunities.length === 0)
    return (
      <FeedMessage
        role="status"
        title="Nothing saved yet"
        description="Tap the heart on any opportunity to save it here."
      />
    );

  const groups = groupByCategory(opportunities);
  // A tab can vanish only on reload, but fall back to All rather than show nothing.
  const active = groups.some((group) => group.slug === activeCategory) ? activeCategory : "all";

  return (
    <>
      <div className="sorting-opportunities">
        {[{ slug: "all", label: "All" }, ...groups].map(({ slug, label }) => (
          <button
            key={slug}
            type="button"
            className={active === slug ? `${slug} active-filter` : slug}
            aria-pressed={active === slug}
            onClick={() => setActiveCategory(slug)}
          >
            {label}
          </button>
        ))}
      </div>

      {groups
        .filter((group) => active === "all" || group.slug === active)
        .map((group) => (
          <div key={group.slug} className="opportunity-section">
            <h3>{group.label}</h3>
            {group.opportunities.map((opportunity) => (
              <SavedCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ))}
    </>
  );
}

// Saved opportunities whose deadline has not passed, nearest first.
export function UpcomingDeadlines({ opportunities }: { opportunities?: OpportunityView[] }) {
  if (!opportunities) return null;
  const now = Date.now();
  const upcoming = opportunities
    .flatMap((opportunity) => {
      const deadline = opportunity.applicationDeadline ? Date.parse(opportunity.applicationDeadline) : NaN;
      return deadline >= now ? [{ opportunity, deadline }] : [];
    })
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, UPCOMING_COUNT);

  if (upcoming.length === 0) return <p>No upcoming deadlines in your saved opportunities.</p>;
  return upcoming.map(({ opportunity }) => <SavedCard key={opportunity.id} opportunity={opportunity} />);
}
