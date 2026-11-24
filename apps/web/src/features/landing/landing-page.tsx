import { OpportunityFeed } from "@/features/opportunities/opportunity-feed";
import { LandingHero } from "./components/landing-hero";

const EXPLORE_ID = "explore";

export function LandingPage() {
  return (
    <div>
      <LandingHero exploreId={EXPLORE_ID} />
      <OpportunityFeed
        id={EXPLORE_ID}
        heading={
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-4xl font-bold">Take a look around</h2>
            <p className="text-muted-foreground">
              Browse everything that's open right now. Sign up to save the ones
              you like.
            </p>
          </div>
        }
      />
    </div>
  );
}
