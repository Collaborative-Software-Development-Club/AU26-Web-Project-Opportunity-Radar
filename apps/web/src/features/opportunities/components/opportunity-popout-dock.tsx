import { useOpportunityPopouts } from "../hooks/use-opportunity-popouts";
import { OpportunityPopoutWindow } from "./opportunity-popout-window";

export function OpportunityPopoutDock() {
  const { popouts, latestId } = useOpportunityPopouts();

  if (!popouts.length) return null;

  return (
    <aside
      aria-label="Open opportunities"
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end gap-3 px-4 pt-20 md:px-8"
    >
      {popouts.map((popout) => (
        <OpportunityPopoutWindow
          key={popout.id}
          popout={popout}
          isLatest={popout.id === latestId}
        />
      ))}
    </aside>
  );
}
