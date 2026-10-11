import { OpportunityView, CompensationView, LocationView } from "@radar/contracts";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { create } from "domain";

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

const createDescription = (data: OpportunityView) => {
  if(data.description == null) return null;
  return(
    <CardContent>
      <h2>Description</h2>
      <ul>
          <li>{data.description}</li>
      </ul>
    </CardContent>

  )
}

const createDetails = (data: OpportunityView) => {
    const comp: ReactNode = formatCompensation(data.compensation);
    const location: ReactNode = formatLocation(data.locations);
    const workMode: ReactNode = data.workMode ? <li>Work mode: {data.workMode}</li>: null;
    const workAuthorization: ReactNode = data.workAuthorization ? <li>Work Authorization: {data.workAuthorization}</li>: null;
    if(comp != null && location != null &&  workMode != null && workAuthorization != null) return null;
    return(
      <CardContent>
        <h2>Details</h2>
        <ul>
          {comp}
          {location}
          {workMode}
          {workAuthorization}
        </ul>
      </CardContent>
    )
}

const createSummary = (data: OpportunityView) => {
  if(data.summary == null) return null;
  return(
    <CardContent>
      <h2>Summary</h2>
      <ul>
          <li>{data.summary}</li>
      </ul>
    </CardContent>
  )
}

export function opportunityPageDetails(data: OpportunityView): ReactNode{
    const details: ReactNode = createDetails(data);
    const description: ReactNode = createDescription(data);
    const summary: ReactNode = createSummary(data);
    if(details == null && description == null && summary == null) return null;
    return (
      <Card>
        {details}
        {description}
        {summary}
      </Card>
    )
}