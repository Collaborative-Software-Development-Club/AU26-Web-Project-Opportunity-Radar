import { Link, useParams } from 'react-router';
import { useOrganization } from './hooks/use-organization';
import { OragnizationPageDetails } from './components/organization-page-details';
import { ApiError } from '@/lib/api';


export function OrganizationPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOrganization(id)
  return (
    <section>
      {data !== undefined && data !== null && error == null && !isLoading.valueOf() && OragnizationPageDetails(data)}
    
      {!isLoading && error != null &&
        (
        <div>
          {error instanceof ApiError && [400, 404].includes(error.status)
            ? <p>Organization <code>{id}</code> could not be found.</p>
            : <p>Something went wrong. Try again later.</p>}
        </div>
      )
      }
      </section>
  );
}
