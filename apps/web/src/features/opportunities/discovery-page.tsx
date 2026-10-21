import { useUser } from "@clerk/react";
import { OpportunityFeed } from "./opportunity-feed";

export function DiscoveryPage() {
  const { user } = useUser();
  return <OpportunityFeed firstName={user?.firstName ?? null} />;
}
