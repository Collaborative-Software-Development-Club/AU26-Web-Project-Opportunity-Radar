//TODO: lift the heart save button out to use in the opp. page as well
import { Button } from "@/components/ui/button";
import type { CompensationView, OpportunityView } from "@radar/contracts";
import { Clock, Heart, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSaved } from "@/features/saved/use-saved";

interface SaveButtonProps {
  opportunity: OpportunityView;
}

export function SaveButton({opportunity}: SaveButtonProps){
    const { isSaved, toggle } = useSaved();
    const saved = isSaved(opportunity.id);
    
    return (
        
        <Button
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={
              saved
                ? `Unsave ${opportunity.title}`
                : `Save ${opportunity.title}`
            }
            onClick={() => toggle(opportunity.id)}
          >
            <Heart
              className={cn(
                saved ? "fill-current text-rose-600" : "text-muted-foreground",
              )}
            />
          </Button>
    )
}
