
import { CategoryView, OpportunityView } from '@radar/contracts';
import { ReactNode } from 'react';
import { opportunityPageDetails } from './opportunity-page-details';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DAY = 86_400_000;

let saved: boolean = false;
const horizontalDiv: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
};


//logic & flow here can be improved
const formatDate = (data: OpportunityView): ReactNode =>{
  let posted: string = "";
  let apply: string = "";
  if(data.postedAt !== null){
    let dPosted: Date = new Date(Date.parse(data.postedAt));
    posted = `Created on ${dPosted.getMonth()+1}/${dPosted.getDate()}/${dPosted.getFullYear()}`;
    if(data.applicationDeadline !== null){
      posted += " - ";
    }
  }
  if(data.applicationDeadline !== null){
    let dApply: Date = new Date(Date.parse(data.applicationDeadline));
    apply = `${dApply.getMonth()+1}/${dApply.getDate()}/${dApply.getFullYear()}`;
    let dNow: Date = new Date(Date.now());

    if(dApply.getTime() < dNow.getTime()){
      return <p>{posted}<strong>Deadline Passed ({apply})</strong></p>
    } else if(dApply.getTime() - dNow.getTime() <= 7 * DAY){
      return <p>{posted}<strong>Apply by {apply}</strong></p>;
    }
  }
  return <p>{posted + "Apply by " + apply}</p>;
}

const createCategoryBadges = (categories: CategoryView[]) =>{
    if(categories == null || categories == undefined) return null;
    const badges = categories.map(element =>
        <Badge key={element.id}>{element.name}</Badge>
    )
    return(
        <span> {badges} </span>
    )
}

const createActiveBadges = (data:OpportunityView) => {
  if(data.status == null ||data.status == undefined || data.status === "active"){
    return(
      <Badge variant="outline" className='p-5   float-right'>Active</Badge>
      //TODO active/closed/expired badges
    )
  } else if(data.status === "expired"){
    return(
      <Badge variant="destructive">Expired</Badge>
    )
  } else{
    return(
      <Badge variant="destructive">Closed</Badge>
    )
  }
}

// Placeholder: the detail view lands in "Web: Opportunity detail page".
export function opportunityPageCard(data:OpportunityView) {

if(data == null || data == undefined) return null;
  return (
    <Card className="gap-6 rounded-2xl border-2 shadow-none">
        <CardHeader>
            <CardDescription>
                {data.organization?.logoUrl == null ? <h2> {data?.organization?.name} </h2>:<img  src="{data?.organization?.logoUrl}"></img>}
            </CardDescription>
            <CardTitle className="text-teal-800 font-serif text-lg leading-snug text-5xl font-bold">
                {data.title}
            </CardTitle>
            <CardDescription>
                <Button className="button button-secondary" onClick={() =>{window.open(data.sourceUrl, "_blank", "noopener,noreferrer")}}>View Source</Button>
                <span> Categories: {createCategoryBadges(data.categories)} </span>
                
            </CardDescription>
            <CardDescription>
              <span className="grid gap-2">
                  {data !== null && formatDate(data)} 
                <span className="grid grid-cols-3 gap-4">
                    
                    <Button hidden={!(data.status == "active")} className="button button-primary" onClick={() => window.open(data.applicationUrl, "_blank", "noopener,noreferrer")}>Apply</Button>
                    <Button className="button button-primary" onClick={() => {saved = true}}>Save</Button>
                    {createActiveBadges(data)}
                </span>
              </span>
        
                
            </CardDescription>
        </CardHeader>
        {opportunityPageDetails(data)}
    </Card>
  );
}
