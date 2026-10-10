import { useEffect, useState } from 'react';
import type {
  CategoryView, EducationLevelView, FieldView, LocationView, OpportunityView, OrganizationSummary,
} from '@radar/contracts';
import { mockOpportunities } from '../../../mocks/opportunities';
import { ApiClient, ApiClientOptions, createApiClient } from '@radar/api-client';

const usingMockData: Boolean = true;


export default function useOpportunity(id: string){
    const [data, setData] = useState<OpportunityView>();
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [error, setError] = useState<string | null>("");

    useEffect(() => {

        
        setIsLoading(true);
        const getData = async () => {
            if(usingMockData){
                const mocks: OpportunityView[]  = mockOpportunities;
                const opportunity = mocks.find(opportunity => opportunity.id === id);
                if(opportunity !== undefined){
                    setData(opportunity);
                    setError(null);
                } else{
                    setError("Retry");
                }
                setIsLoading(false);
            } else{
                // const client: ApiClient = createApiClient()
                // const opportunity: OpportunityView = 
            }
            
        }
        if(usingMockData){
            //Fake delay
            setTimeout(getData, 300);
        }
        
        


    }, [id]);
    
    return {data, isLoading, error};
}