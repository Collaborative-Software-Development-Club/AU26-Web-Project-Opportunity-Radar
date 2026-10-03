import { Link, useParams } from 'react-router';

// Placeholder: the detail view lands in "Web: Opportunity detail page".
export function OpportunityDetailPage() {
  const { id } = useParams();

  return (
    <section>
      <Link to="/">Back to Discovery</Link>
      <h1>Opportunity</h1>
      <p>Details for opportunity <code>{id}</code> are coming soon.</p>
    </section>
  );
}
