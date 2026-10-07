import { useEffect, useState } from 'react';
import type {
  CategoryView, EducationLevelView, FieldView, LocationView, OpportunityView, OrganizationSummary,
} from '@radar/contracts';
import { mockOpportunities } from '../../../mocks/opportunities';


export default function useOpportunity(id: string){
    const [data, setData] = useState<OpportunityView>();
    const [isLoading, setIsLoading] = useState<Boolean>(true);
    const [error, setError] = useState<string | null>("");

    useEffect(() => {
        setIsLoading(true);
        
        const getData = () => {
            const mocks: OpportunityView[]  = mockOpportunities;
            const opportunity = mocks.find(opportunity => opportunity.id === id);
            if(opportunity !== undefined){
                setData(opportunity);
                setError(null);
            } else{
                setError("Retry");
            }
            setIsLoading(false);
        }
        //Fake delay
        setTimeout(getData, 300);


    }, [id]);
    
    return {data, isLoading, error};
}