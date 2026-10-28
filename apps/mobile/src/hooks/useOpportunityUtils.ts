import { useApi } from "../lib/api";
import { useEffect, useState } from "react";
import type { OpportunityListResponse } from "@radar/contracts";

type Api = ReturnType<typeof useApi>;
type Jobs = {
  internships: OpportunityListResponse;
  research: OpportunityListResponse;
  volunteer: OpportunityListResponse;
};
type Events = {
  hackathon: OpportunityListResponse;
};
type Financials = {
  grant: OpportunityListResponse;
  fellowship: OpportunityListResponse;
  scholarship: OpportunityListResponse;
};
export function useJobs() {
  const api = useApi();
  const [jData, setData] = useState<Jobs | null>(null);
  const [jLoading, setLoading] = useState(false);
  const [jError, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [internships, research, volunteer] = await Promise.all([
          api.opportunities.list(
            { limit: 20, category: "internship" },
            { signal },
          ),
          api.opportunities.list(
            { limit: 20, category: "research" },
            { signal },
          ),
          api.opportunities.list(
            { limit: 20, category: "volunteer" },
            { signal },
          ),
        ]);
        if (!signal.aborted) {
          setData({ internships, research, volunteer });
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [api]);

  return { jData, jLoading, jError };
}

export function useEvents() {
  const api = useApi();
  const [evData, setData] = useState<Events | null>(null);
  const [evLoading, setLoading] = useState(false);
  const [evError, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [hackathon] = await Promise.all([
          api.opportunities.list(
            { limit: 20, category: "hackathon" },
            { signal },
          ),
        ]);
        if (!signal.aborted) {
          setData({ hackathon });
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [api]);

  return { evData, evLoading, evError };
}

export function useFinancials() {
  const api = useApi();
  const [fiData, setData] = useState<Financials | null>(null);
  const [fiLoading, setLoading] = useState(false);
  const [fiError, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [grant, fellowship, scholarship] = await Promise.all([
          api.opportunities.list({ limit: 20, category: "grant" }, { signal }),
          api.opportunities.list(
            { limit: 20, category: "fellowship" },
            { signal },
          ),
          api.opportunities.list(
            { limit: 20, category: "scholarship" },
            { signal },
          ),
        ]);
        if (!signal.aborted) {
          setData({ grant, fellowship, scholarship });
        }
      } catch (err) {
        if (!signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [api]);

  return { fiData, fiLoading, fiError };
}
