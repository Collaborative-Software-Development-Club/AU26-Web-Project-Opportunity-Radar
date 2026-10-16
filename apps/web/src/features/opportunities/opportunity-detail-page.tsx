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
import { ApiError } from '@radar/api-client';



// Placeholder: the detail view lands in "Web: Opportunity detail page".
export function OpportunityDetailPage() {
  const { id } = useParams();
  const {data, isLoading, error} = useOpportunity(id)
  
  return (
    <section>
      <Link to="/">Back to Discovery</Link>
      {data !== undefined && data !== null && error == null && !isLoading.valueOf() && opportunityPageCard(data)}
  
      {(data == undefined || data == null) && !isLoading.valueOf() && error !== null &&
      (
        <div>
          <p>Opportunity <code>{id}</code> could not be found.</p>
          <code> {JSON.parse(error.message).error}</code> 
        </div>
      )
        
      }
      </section>
  );
}
