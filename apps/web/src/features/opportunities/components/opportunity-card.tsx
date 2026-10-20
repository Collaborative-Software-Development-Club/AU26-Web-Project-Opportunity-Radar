import { useState } from "react";
import type { OpportunityView, WorkMode } from "@radar/contracts";
import { Clock, Heart, HeartOff, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Virtual",
  onsite: "In Person",
  hybrid: "Hybrid",
};

const deadlineFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function OpportunityCard({
  opportunity,
  badgeClass,
}: {
  opportunity: OpportunityView;
  badgeClass: string;
}) {
  const [saved, setSaved] = useState(false);
  const tag = getTag(opportunity);
  const MetaIcon = opportunity.applicationDeadline ? Clock : MapPin;

  return (
    <Card className="gap-3 rounded-2xl border-2 shadow-none">
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {opportunity.organization?.name}
        </CardDescription>
        <CardTitle className="font-serif text-lg leading-snug">
          {opportunity.title}
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={
              saved
                ? `Unsave ${opportunity.title}`
                : `Save ${opportunity.title}`
            }
            onClick={() => setSaved((value) => !value)}
          >
            {saved ? (
              <Heart className="fill-current text-rose-600" />
            ) : (
              <HeartOff className="text-muted-foreground" />
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="flex flex-col items-start gap-2">
          {tag && (
            <Badge variant="secondary" className={badgeClass}>
              {tag}
            </Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MetaIcon className="size-3" aria-hidden />
            {getMeta(opportunity)}
          </span>
        </div>
        <MatchIndicator />
      </CardContent>
    </Card>
  );
}

// Placeholder until match scoring exists.
function MatchIndicator() {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn("size-6 rounded-full border-4 border-teal-700")}
        aria-hidden
      />
      match
    </span>
  );
}

// The most useful single fact for the badge: money, then audience/topic, then format.
function getTag(opportunity: OpportunityView) {
  return (
    opportunity.compensation?.rawText ??
    opportunity.educationLevels[0]?.name ??
    opportunity.fields[0]?.name ??
    (opportunity.workMode ? WORK_MODE_LABELS[opportunity.workMode] : null)
  );
}

function getLocationLabel(opportunity: OpportunityView) {
  const places = opportunity.locations.map((location) =>
    [location.city, location.stateRegion].filter(Boolean).join(", "),
  );
  if (opportunity.workMode === "remote" || opportunity.workMode === "hybrid")
    places.push("Online");
  return places.join(" / ");
}

function getMeta(opportunity: OpportunityView) {
  if (opportunity.applicationDeadline)
    return deadlineFormat.format(new Date(opportunity.applicationDeadline));
  return getLocationLabel(opportunity) || "Location TBA";
}
