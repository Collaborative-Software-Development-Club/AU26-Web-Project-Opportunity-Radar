import { Link, useParams } from 'react-router';
import useOpportunity from './components/OpportunityDetail';
import { CompensationView, LocationView, OpportunityView } from '@radar/contracts';
import { ReactNode, useEffect, useState } from 'react';

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
    if(dApply.getTime() - dNow.getTime() <= 7 * DAY){
      return <p>{posted}<strong>{apply}</strong></p>;
    } else if(dApply.getTime() < dNow.getTime()){
      return <p>{posted}<strong>Deadline Passed</strong></p>
    }
  }
  
  return <p>{posted + apply}</p>;
}


const formatCompensation = (compensation: CompensationView): string => {
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
  return s;
}

const formatLocation = (locations: LocationView[]): ReactNode=>{
  let s: string = "Locations: ";
  
  s += locations.map(element => 
  [element.city, element.stateRegion, element.country].filter(value => value != null).join(", ")
  ).join(", ");
  
  return <li>{s}</li>
}

// Placeholder: the detail view lands in "Web: Opportunity detail page".
export function OpportunityDetailPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOpportunity(id?? "");
  
  return (
    <section>
      <Link to="/">Back to Discovery</Link>
      {data !== undefined && error == null && !isLoading.valueOf() && 

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
        <div>
        <h2>Details</h2>
        <ul>
          {data.compensation !== null && data.compensation !== undefined && <li>{formatCompensation(data!.compensation)}</li>}
          {data.locations !== undefined && (data?.locations !== null ? data.locations.length > 0 && formatLocation(data.locations): "")}
          {data.workMode !== null && <li>Work mode: {data.workMode}</li>}
          {data.workAuthorization !== null && <li>Work Authorization: {data.workAuthorization}</li>}
        </ul>
        </div>

        {
          data.description !== null &&
        <div>
          <h2>Description</h2>
          <ul>
             <li>{data.description}</li>
          </ul>
        </div>
        }
        {
          data.summary !== null &&
        <div>
          <h2>Summary</h2>
          <ul>
             <li>{data.summary}</li>
          </ul>
        </div>
        }

      </div>
      }

      {data == undefined && !isLoading.valueOf() &&  
      <p>Opportunity <code>{id}</code> could not be found {error}.</p>
      }
      
    </section>
  );
}
