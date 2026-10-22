import type { ApiClient } from "@radar/api-client";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/lib/api";

type QueryState<T> = { data?: T; error?: unknown; isLoading: boolean };

export function useApiQuery<T>(
  key: string,
  load: (api: ApiClient, signal: AbortSignal) => Promise<T>,
) {
  const api = useApi();
  const loadRef = useRef(load);
  loadRef.current = load;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState<T>>({ isLoading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ data: previous.data, isLoading: true }));
    loadRef
      .current(api, controller.signal)
      .then((data) => setState({ data, isLoading: false }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState((previous) => ({ data: previous.data, error, isLoading: false }));
      });
    return () => controller.abort();
  }, [api, key, attempt]);

  return { ...state, retry: () => setAttempt((count) => count + 1) };
}
