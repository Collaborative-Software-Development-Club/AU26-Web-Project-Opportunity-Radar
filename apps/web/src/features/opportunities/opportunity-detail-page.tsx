import { Link, useParams } from 'react-router';
import {useOpportunity} from './hooks/use-opportunity';
import { opportunityPageCard } from './components/opportunity-page-card';
import { ApiError } from '@/lib/api';
export function OpportunityDetailPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOpportunity(id)
  
  return (
    <section>
      {data !== undefined && data !== null && error == null && !isLoading.valueOf() && opportunityPageCard(data)}
  
      {!isLoading && error != null &&
      (
        <div>
          {error instanceof ApiError && [400, 404].includes(error.status)
            ? <p>Opportunity <code>{id}</code> could not be found.</p>
            : <p>Something went wrong. Try again later.</p>}
        </div>
      )
        
      }
      </section>
  );
}
