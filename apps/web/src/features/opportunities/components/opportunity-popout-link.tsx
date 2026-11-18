import { Link } from "react-router";
import { useOpportunityPopouts } from "../hooks/use-opportunity-popouts";

export function OpportunityPopoutLink({ id, title }: { id: string; title: string }) {
  const { open } = useOpportunityPopouts();

  return (
    <Link
      to={`/opportunities/${id}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        open(id, title);
      }}
    >
      {title}
    </Link>
  );
}
