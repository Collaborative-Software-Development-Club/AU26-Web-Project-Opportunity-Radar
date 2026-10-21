import { Show, SignInButton } from "@clerk/react";
import type { OpportunityView } from "@radar/contracts";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedMessage } from "@/features/opportunities/components/feed-message";
import { getMeta, getTag } from "@/features/opportunities/components/opportunity-card";
import { discoveryCategoryFor } from "@/features/opportunities/discovery-categories";
import { useApiQuery } from "@/hooks/use-api-query";
import { OpportunityCard } from "./OpportunityCard";

type Group = { slug: string; label: string; opportunities: OpportunityView[] };

const OTHER = { slug: "other", label: "Other" };

export function SavedOpportunities() {
  return (
    <>
      <Show when="signed-in">
        <SavedList />
      </Show>
      <Show when="signed-out">
        <FeedMessage
          title="Sign in to see your saved opportunities"
          description="Tap the heart on any opportunity to save it here."
          action={
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          }
        />
      </Show>
    </>
  );
}

// Each opportunity sits under its first category, so it appears in exactly one section.
function groupByCategory(opportunities: OpportunityView[]): Group[] {
  const groups = new Map<string, Group>();
  for (const opportunity of opportunities) {
    const [first] = opportunity.categories;
    const { slug, label } = first ? discoveryCategoryFor(first) : OTHER;
    const group = groups.get(slug) ?? { slug, label, opportunities: [] };
    group.opportunities.push(opportunity);
    groups.set(slug, group);
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

// Unsaving here keeps the card (with an empty heart) until the next load, so a misclick can be undone.
function SavedList() {
  const [activeCategory, setActiveCategory] = useState("all");
  // shortcut: tabs and sections group one request of the newest 100 saves; add a category filter to /api/saved when users save more.
  const { data, error, retry } = useApiQuery("saved", (api, signal) =>
    api.saved.list({ limit: 100 }, { signal }),
  );

  if (error)
    return (
      <FeedMessage
        role="alert"
        title="Couldn't load saved opportunities"
        description="Something went wrong reaching the server. Check your connection and try again."
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
  if (!data) return <p role="status">Loading saved opportunities…</p>;
  if (data.data.length === 0)
    return (
      <FeedMessage
        role="status"
        title="Nothing saved yet"
        description="Tap the heart on any opportunity to save it here."
      />
    );

  const groups = groupByCategory(data.data.map((item) => item.opportunity));
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
              <OpportunityCard
                key={opportunity.id}
                opportunityId={opportunity.id}
                title={opportunity.title}
                organization={opportunity.organization?.name ?? ""}
                badge={getTag(opportunity) ?? ""}
                date={getMeta(opportunity)}
                category={group.slug}
              />
            ))}
          </div>
        ))}
    </>
  );
}
