import { createBrowserRouter } from 'react-router';
import { App } from './App';
import { NotFoundPage } from './NotFoundPage';
import { DiscoveryPage } from '../features/opportunities/discovery-page';
import { OpportunityDetailPage } from '../features/opportunities/opportunity-detail-page';
import { OrganizationPage } from '@/features/organizations/OrganizationPage';
import { ProfilePage } from '../features/profile/ProfilePage';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <DiscoveryPage /> },
      { path: 'opportunities/:id', element: <OpportunityDetailPage /> },
      { path: 'organizations/:id', element: <OrganizationPage />},
      { path: 'profile', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
