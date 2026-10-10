import { Link, useParams } from 'react-router';
import {useOpportunity} from './hooks/use-opportunity';
import { CompensationView, LocationView, OpportunityView } from '@radar/contracts';
import { ReactNode, useEffect, useState } from 'react';
import { opportunityPageCard } from './components/opportunity-page-card';
import { opportunityPageDetails } from './components/opportunity-page-details';
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
export function OpportunityDetailPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOpportunity(id)


  
  return (
    <section>
      <Link to="/">Back to Discovery</Link>
      {data !== undefined && data !== null && error == null && !isLoading.valueOf() && 
        opportunityPageCard(data)
      }
      

      {(data == undefined || data == null) && !isLoading.valueOf() &&  
      <p>Opportunity <code>{id}</code> could not be found {error}.</p>
      }
      </section>
  );
}
