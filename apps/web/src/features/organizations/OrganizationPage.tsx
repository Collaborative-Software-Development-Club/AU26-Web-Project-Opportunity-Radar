import { Link, useParams } from 'react-router';
 import { useOrganization } from './hooks/use-organization';
import { OragnizationPageDetails } from './components/organization-page-details';


export function OrganizationPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOrganization(id)
  return (
    <section>
      <Link to="/">Back to Discovery</Link>
      {data !== undefined && data !== null && error == null && !isLoading.valueOf() && OragnizationPageDetails(data)}
    
      {(data == undefined || data == null) && !isLoading.valueOf() && error !== null &&
        (
        <div>
          <p>Organization <code>{id}</code> could not be found.</p>
          <code> {JSON.parse(error.message).error}</code> 
        </div>
      )
      }
      </section>
  );
}
