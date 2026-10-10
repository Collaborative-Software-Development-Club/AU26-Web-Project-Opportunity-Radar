import type { OpportunityView } from '@radar/contracts';
import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api';

export const useOpportunity =  (id: string | undefined) => {
    const [data, setData] = useState<OpportunityView | null>(null);
    const [isLoading, setIsLoading] = useState<Boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [canceled, setCanceled] = useState<Boolean>(false);
    const apiClient = useApi();

    if(id === null || id === undefined) return {data, isLoading, error: "id null"}
    useEffect(() => {

        setIsLoading(true);
        apiClient.opportunities.get(id)
        .then( opportunity => {
                console.log(opportunity + " "  + isLoading)
                if(!canceled) {setData(opportunity)}
            }
        ).catch(error => 
            setError(error)
        )
        setIsLoading(false)
        console.log("Data: " + data + "\nLoading: " + isLoading + "\nError: " + error);
        return () => {
            setCanceled(true);
        }
        
    }, [id, apiClient])
    console.log(data)
    return {data, isLoading, error}
}
