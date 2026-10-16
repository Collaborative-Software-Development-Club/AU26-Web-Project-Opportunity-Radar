import type { OpportunityView } from '@radar/contracts';
import { useEffect, useState } from 'react';
import { ApiError, useApi } from '@/lib/api';

export const useOpportunity =  (id: string | undefined) => {
    const [data, setData] = useState<OpportunityView | null>(null);
    const [isLoading, setIsLoading] = useState<Boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [canceled, setCanceled] = useState<Boolean>(false);
    const apiClient = useApi();

    if(id === null || id === undefined) return {data, isLoading, error}
    useEffect(() => {

        setIsLoading(true);
        apiClient.opportunities.get(id)
        .then( opportunity => {
                if(!canceled) {setData(opportunity)}
            }
        ).catch(error => {
            setError(error);
        }
            
        )
        setIsLoading(false)
        return () => {
            setCanceled(true);
        }
        
    }, [id, apiClient])
    return {data, isLoading, error}
}
