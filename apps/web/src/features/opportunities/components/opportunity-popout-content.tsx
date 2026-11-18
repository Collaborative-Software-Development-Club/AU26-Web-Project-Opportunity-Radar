import type { OpportunityView } from "@radar/contracts";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useOpportunity } from "../hooks/use-opportunity";
import { opportunityPageDetails } from "./opportunity-page-details";
import { SaveButton } from "./save-button";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function OpportunityPopoutContent({
  id,
  onOpenFullPage,
}: {
  id: string;
  onOpenFullPage: () => void;
}) {
  const { data, error, isLoading, retry } = useOpportunity(id);

  if (data)
    return <OpportunityPopoutDetails opportunity={data} onOpenFullPage={onOpenFullPage} />;

  if (isLoading)
    return (
      <div className="flex flex-col gap-3 p-5" role="status" aria-label="Loading opportunity">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );

  const notFound = error instanceof ApiError && [400, 404].includes(error.status);

  return (
    <div className="flex flex-col items-start gap-3 p-5" role="alert">
      <p className="text-sm text-muted-foreground">
        {notFound
          ? "This opportunity could not be found."
          : "Something went wrong loading this opportunity."}
      </p>
      {!notFound && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

function OpportunityPopoutDetails({
  opportunity,
  onOpenFullPage,
}: {
  opportunity: OpportunityView;
  onOpenFullPage: () => void;
}) {
  const active = opportunity.status === "active";

  return (
    <article className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        {opportunity.organization && (
          <Link
            to={`/organizations/${opportunity.organizationId}`}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground underline-offset-4 hover:underline"
          >
            {opportunity.organization.name}
          </Link>
        )}
        <h2 className="font-serif text-xl leading-snug font-semibold text-brand">
          {opportunity.title}
        </h2>
        <p className="text-sm text-muted-foreground">{getDeadlineLabel(opportunity)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={active ? "outline" : "destructive"}>
          {active ? "Active" : opportunity.status === "expired" ? "Expired" : "Closed"}
        </Badge>
        {opportunity.categories.map((category) => (
          <Badge key={category.id} variant="secondary">
            {category.name}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {active && (
          <Button
            variant="brand"
            nativeButton={false}
            render={
              <a href={opportunity.applicationUrl} target="_blank" rel="noopener noreferrer" />
            }
          >
            Apply
            <ExternalLink />
          </Button>
        )}
        <Button
          variant="outline"
          nativeButton={false}
          render={<a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer" />}
        >
          View source
        </Button>
        <SaveButton opportunity={opportunity} />
        <Button
          variant="link"
          nativeButton={false}
          render={<Link to={`/opportunities/${opportunity.id}`} onClick={onOpenFullPage} />}
        >
          Open full page
        </Button>
      </div>
      {opportunityPageDetails(opportunity)}
    </article>
  );
}

function getDeadlineLabel(opportunity: OpportunityView) {
  if (!opportunity.applicationDeadline) return "No deadline listed";
  const deadline = new Date(opportunity.applicationDeadline);
  const label = dateFormat.format(deadline);
  return deadline.getTime() < Date.now() ? `Deadline passed (${label})` : `Apply by ${label}`;
}
