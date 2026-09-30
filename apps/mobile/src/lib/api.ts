import { useAuth } from "@clerk/expo";
import { useMemo } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("Add EXPO_PUBLIC_API_URL to apps/mobile/.env");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type GetToken = () => Promise<string | null>;

// Move into packages/api-client later.
export function createApiClient(getToken: GetToken) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    
    const headers = new Headers(init.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const res = await fetch(`${API_URL}${path}`, { ...init, headers });

    if (!res.ok) throw new ApiError(res.status, await res.text());
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  };
}

export function useApi() {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient(getToken), [getToken]);
}
