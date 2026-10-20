import { useAuth } from '@clerk/react';
import { createApiClient } from '@radar/api-client';
import { useMemo } from 'react';

export { ApiError } from '@radar/api-client';

const API_URL = import.meta.env.VITE_API_URL?.trim();
if (!API_URL) throw new Error('Set VITE_API_URL in apps/web/.env, then restart the web development server.');
const baseUrl = API_URL;

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient({ baseUrl, getToken }), [getToken]);
}
