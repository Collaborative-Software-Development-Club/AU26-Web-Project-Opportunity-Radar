import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiOpportunityDetailSheet } from '../../src/features/opportunities/detail/ApiOpportunityDetailSheet';

// Live IDs use the same sheet, independent of discovery's current preview data.
export default function OpportunityDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return <ApiOpportunityDetailSheet id={id} onClose={() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }} />;
}
