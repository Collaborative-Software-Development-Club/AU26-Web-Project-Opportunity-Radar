import { Show, useUser } from "@clerk/react";
import { LandingPage } from "@/features/landing/landing-page";
import { OpportunityFeed } from "./opportunity-feed";

export function DiscoveryPage() {
  return (
    <>
      <Show when="signed-out">
        <LandingPage />
      </Show>
      <Show when="signed-in">
        <MemberFeed />
      </Show>
    </>
  );
}

function MemberFeed() {
  const { user } = useUser();
  const firstName = user?.firstName;

  return (
    <OpportunityFeed
      heading={
        <h1 className="font-serif text-5xl font-bold">
          Welcome back
          {firstName && (
            <>
              , <span className="text-teal-700">{firstName}</span>
            </>
          )}
        </h1>
      }
    />
  );
}
