import type { CompensationView, OpportunityView } from "@radar/contracts";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOpenPopoutOnCardClick } from "../hooks/use-opportunity-popouts";
import { WORK_MODE_LABELS } from "../work-mode-labels";
import { OpportunityPopoutLink } from "./opportunity-popout-link";
import { SaveButton } from "./save-button";

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
  const openPopout = useOpenPopoutOnCardClick(opportunity.id, opportunity.title);
  const tag = getTag(opportunity);
  const MetaIcon = opportunity.applicationDeadline ? Clock : MapPin;

  return (
    <Card
      className="cursor-pointer gap-3 rounded-2xl border-2 shadow-none transition-colors hover:border-brand/40"
      onClick={openPopout}
    >
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {opportunity.organization?.name}
        </CardDescription>
        <CardTitle className="font-serif text-lg leading-snug">
          <OpportunityPopoutLink id={opportunity.id} title={opportunity.title} />
        </CardTitle>
        <CardAction>
          <SaveButton 
            opportunity = {opportunity}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col items-start gap-2">
          {tag && (
            <Badge
              variant="secondary"
              className={cn("max-w-full", badgeClass)}
              title={tag}
            >
              <span className="truncate">{tag}</span>
            </Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MetaIcon className="size-3" aria-hidden />
            {getMeta(opportunity)}
          </span>
        </div>
        {opportunity.matchScore !== undefined && (
          <MatchIndicator score={opportunity.matchScore} />
        )}
      </CardContent>
    </Card>
  );
}

export function OpportunityCardSkeleton() {
  return (
    <Card className="gap-3 rounded-2xl border-2 shadow-none" aria-hidden>
      <CardHeader className="gap-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

const RING_RADIUS = 9;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function MatchIndicator({ score }: { score: number }) {
  return (
    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden>
        <circle cx="12" cy="12" r={RING_RADIUS} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle
          cx="12"
          cy="12"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="4"
          className="stroke-teal-700"
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - score / 100)}
        />
      </svg>
      <span className="font-medium text-foreground">{score}%</span> match
    </span>
  );
}

// The most useful single fact for the badge: money, then audience/topic, then format.
export function getTag(opportunity: OpportunityView) {
  return (
    getCompensationLabel(opportunity.compensation) ??
    opportunity.educationLevels[0]?.name ??
    opportunity.fields[0]?.name ??
    (opportunity.workMode ? WORK_MODE_LABELS[opportunity.workMode] : null)
  );
}

const PERIOD_SUFFIX: Partial<Record<string, string>> = {
  hour: "/hr",
  day: "/day",
  week: "/wk",
  month: "/mo",
  year: "/yr",
};

function getCompensationLabel(compensation: CompensationView | null) {
  if (!compensation) return null;
  if (compensation.isPaid === false || compensation.compensationType === "unpaid")
    return "Unpaid";
  const amounts = [compensation.minAmount, compensation.maxAmount].filter(
    (amount) => amount !== null,
  );
  if (!amounts.length) return compensation.rawText;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: compensation.currency ?? "USD",
    minimumFractionDigits: 0,
  });
  const range = [...new Set(amounts.map((amount) => money.format(Number(amount))))];
  return range.join("–") + (PERIOD_SUFFIX[compensation.period ?? ""] ?? "");
}

function getLocationLabel(opportunity: OpportunityView) {
  const places = opportunity.locations.map((location) =>
    [location.city, location.stateRegion].filter(Boolean).join(", "),
  );
  if (opportunity.workMode === "remote" || opportunity.workMode === "hybrid")
    places.push("Online");
  return places.join(" / ");
}

export function getMeta(opportunity: OpportunityView) {
  if (opportunity.applicationDeadline)
    return deadlineFormat.format(new Date(opportunity.applicationDeadline));
  return getLocationLabel(opportunity) || "Location TBA";
}
