import { useAuth } from "@clerk/expo";
import { createApiClient } from "@radar/api-client";
import { useMemo } from "react";

export { ApiError } from "@radar/api-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("Add EXPO_PUBLIC_API_URL to apps/mobile/.env");
const baseUrl = API_URL;

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient({ baseUrl, getToken }), [getToken]);
}
