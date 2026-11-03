import { OpportunityView, CompensationView, LocationView, EducationLevelView, FieldView } from "@radar/contracts";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatCompensation = (compensation: CompensationView | null | undefined): ReactNode | null=> {
  if(compensation == null) return null;
  let s: string = "Compensation: ";
    if(compensation.isPaid === false){
      s = "Unpaid";
    } else if(compensation.minAmount === null){
      if(compensation.rawText === null) return null;
      s += compensation.rawText;
    } else{
      s += "$" + compensation.minAmount;
      if(compensation.maxAmount !== null && compensation.maxAmount !== compensation.minAmount) s += "-$" + compensation.maxAmount;
      if(compensation.period !== null) s += (compensation.period === "one-time" ? " " : " / ") + compensation.period;
    }
  return <li>{s}</li>;
}

const formatLocation = (locations: LocationView[] | null | undefined): ReactNode | null=>{
  if(locations == null || locations.length == 0) return null;
  let s: string = "Locations: ";
  
  s += locations.map(element => 
  [element.city, element.stateRegion, element.country].filter(value => value != null).join(", ")
  ).join(", ");
  
  return <li>{s}</li>
}

const createDescription = (opportunity: OpportunityView) => {
  if(opportunity.description == null) return null;
  return(
    <CardContent>
      <h2><b>Description</b></h2>
      <ul>
          <li>{opportunity.description}</li>
      </ul>
    </CardContent>

  )
}

const formatEducationLevel = (educationLevels: EducationLevelView[]) => {
  if(educationLevels.length === 0) return null;
  const fields = educationLevels.map(level =>
    <Badge variant={"outline"} key={level.id}>{level.name}</Badge>
  )
  return <li>Education Level: {fields}</li>
}

const formatFields = (fields: FieldView[]) => {
  if(fields.length === 0) return null;
  const fieldData = fields.map(field =>
    <Badge variant={"outline"} key={field.id}>{field.name}</Badge>
  )
  return(
    <li>Fields: {fieldData}</li>
  )
}


const createDetails = (opportunity: OpportunityView) => {
    const educationLevels = formatEducationLevel(opportunity.educationLevels);
    const comp: ReactNode = formatCompensation(opportunity.compensation);
    const location: ReactNode = formatLocation(opportunity.locations);
    const workMode: ReactNode = opportunity.workMode ? <li>Work mode: {opportunity.workMode}</li>: null;
    const workAuthorization: ReactNode = opportunity.workAuthorization ? <li>Work Authorization: {opportunity.workAuthorization}</li>: null;
    const fields = formatFields(opportunity.fields);
    // If all elements are null, do not render this section
    if(!(educationLevels || comp || location || workMode || workAuthorization || fields)) return null;
    return(
      <CardContent>
        <h2><b>Details</b></h2>
        <ul>
          {fields}
          {educationLevels}
          {comp}
          {location}
          {workMode}
          {workAuthorization}
        </ul>
      </CardContent>
    )
}

const createSummary = (opportunity: OpportunityView) => {
  if(opportunity.summary == null) return null;
  return(
    <CardContent>
      <h2><b>Summary</b></h2>
      <ul>
          <li>{opportunity.summary}</li>
      </ul>
    </CardContent>
  )
}



export function opportunityPageDetails(opportunity: OpportunityView): ReactNode{
  console.log(opportunity);
    const details: ReactNode = createDetails(opportunity);
    const description: ReactNode = createDescription(opportunity);
    const summary: ReactNode = createSummary(opportunity);
    
    if(!(details || description || summary)) return null;
    return (
      <CardContent>
        <Card>
          {details}
          {description}
          {summary}
        </Card>
        </CardContent>
    )
}