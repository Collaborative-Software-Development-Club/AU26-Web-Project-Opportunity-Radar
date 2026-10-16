import type { OrganizationDetail } from '@radar/contracts';
import { useEffect, useState } from 'react';
import { ApiError, useApi } from '@/lib/api';

export const useOrganization =  (id: string | undefined) => {
    const [data, setData] = useState<OrganizationDetail | null>(null);
    const [isLoading, setIsLoading] = useState<Boolean>(false);
    const [error, setError] = useState<ApiError | null>(null);
    const [canceled, setCanceled] = useState<Boolean>(false);
    const apiClient = useApi();

    if(id === null || id === undefined) return {data, isLoading, error}
    useEffect(() => {
        setIsLoading(true);
        apiClient.organizations.get(id)
        .then( organizations => {
                if(!canceled) {setData(organizations)}
            }
        ).catch(error => 
            setError(error)
        )
        setIsLoading(false)
        return () => {
            setCanceled(true);
        }
        
    }, [id, apiClient])
    return {data, isLoading, error}
}
