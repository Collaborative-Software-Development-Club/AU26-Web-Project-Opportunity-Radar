import type { OpportunityView } from '@radar/contracts';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';

export const useOpportunity =  (id: string | undefined) => {
    const [data, setData] = useState<OpportunityView | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const apiClient = useApi();

    useEffect(() => {
        if(!id) return;
        const controller = new AbortController();
        setIsLoading(true);
        setData(null);
        setError(null);
        apiClient.opportunities.get(id, { signal: controller.signal })
        .then(setData)
        .catch(error => {
            if(!controller.signal.aborted) setError(error);
        })
        .finally(() => {
            if(!controller.signal.aborted) setIsLoading(false);
        })
        return () => controller.abort();
    }, [id, apiClient])
    return {data, isLoading, error}
}
