import { OpportunityView, CompensationView, LocationView } from "@radar/contracts";
import { ReactNode } from "react";

const formatCompensation = (compensation: CompensationView | null | undefined): ReactNode | null=> {
  if(compensation === null || compensation === undefined) return null;
  let s: string = "Compensation: ";
    if(compensation.isPaid){
      if(compensation.minAmount === compensation.maxAmount){
        s = s + "$" + compensation.minAmount + " " + (compensation.period !== "one-time" ? "/ " : "") + compensation.period;
      } else{
        s = s + "$" + compensation.minAmount + "-$" + compensation.maxAmount + " / " + compensation.period;
      }
    } else {
      s = "Unpaid";
    }
  return <li>{s}</li>;
}

const formatLocation = (locations: LocationView[] | null | undefined): ReactNode | null=>{
  if(locations === null || locations === undefined) return null;
  let s: string = "Locations: ";
  
  s += locations.map(element => 
  [element.city, element.stateRegion, element.country].filter(value => value != null).join(", ")
  ).join(", ");
  
  return <li>{s}</li>
}

export function opportunityPageDetails(data: OpportunityView): ReactNode{
    const comp: ReactNode | null = formatCompensation(data.compensation)
    const location: ReactNode | null= formatLocation(data.locations)
    const workMode: ReactNode | null= data.workMode ? <li>Work mode: {data.workMode}</li>: null
    const workAuthorization: ReactNode | null= data.workAuthorization ? <li>Work Authorization: {data.workAuthorization}</li>: null
    if(comp == null && location == null && workMode == null && workAuthorization == null) return;
    return (
        <div>
            <h2>Details</h2>
            <ul>
              {comp}
              {location}
              {workMode}
              {workAuthorization}
            </ul>
          </div>
    )
}