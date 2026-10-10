import { Link, useParams } from 'react-router';
import { useOpportunity } from '../hooks/use-opportunity';
import { CompensationView, LocationView, OpportunityView } from '@radar/contracts';
import { ReactNode, useEffect, useState } from 'react';
import { opportunityPageDetails } from './opportunity-page-details';
import { Clock, Heart, HeartOff, MapPin } from "lucide-react";
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
    apply = `Apply by ${dApply.getMonth()+1}/${dApply.getDate()}/${dApply.getFullYear()}`;
    let dNow: Date = new Date(Date.now());

    if(dApply.getTime() < dNow.getTime()){
      return <p>{posted}<strong>Deadline Passed</strong></p>
    } else if(dApply.getTime() - dNow.getTime() <= 7 * DAY){
      return <p>{posted}<strong>{apply}</strong></p>;
    }
  }
  
  return <p>{posted + apply}</p>;
}



// Placeholder: the detail view lands in "Web: Opportunity detail page".
export function opportunityPageCard(data:OpportunityView) {
    
if(data == null || data == undefined) return null;
  return (
    <Card className="gap-3 rounded-2xl border-2 shadow-none">

      <div>
        {data?.organization?.logoUrl == null ? <p> {data?.organization?.name} </p>:<img  src="{data?.organization?.logoUrl}"></img>}

        <p> Categories:    <strong>
        {data?.categories?.map((element) => element.name).join(", ")}
        </strong>
        </p>
        {data !== null && formatDate(data)}
        <h2>Applications {data.status}</h2>
        <div style={horizontalDiv}> 
          <button hidden={!(data.status == "active")} className="button-primary" onClick={() => window.open(data.applicationUrl, "_blank", "noopener,noreferrer")}>Apply</button>
          <a href={data.sourceUrl}>View Source</a>
          <button className="button-primary" onClick={() => {saved = true}}>Save</button>
        </div>

        <h1>{data?.title}</h1>

        {opportunityPageDetails(data)}

        {data.description !== null &&
        <div>
          <h2>Description</h2>
          <ul>
             <li>{data.description}</li>
          </ul>
        </div>
        }

        {data.summary !== null &&
        <div>
          <h2>Summary</h2>
          <ul>
             <li>{data.summary}</li>
          </ul>
        </div>
        }

      </div>
    </Card>
  );
}
