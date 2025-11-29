import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineSlotProps {
  hour: number;
  hasOutage: boolean;
  neighborhoodName: string;
  isCurrentHour?: boolean;
}

export function TimelineSlot({ hour, hasOutage, neighborhoodName, isCurrentHour }: TimelineSlotProps) {
  const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "min-w-[1.875rem] h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-default select-none",
            hasOutage 
              ? "bg-outage text-outage-foreground" 
              : "bg-active/20 text-active dark:bg-active/30",
            isCurrentHour && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
          )}
          data-testid={`timeline-slot-${hour}`}
          aria-label={`${formattedHour} - ${hasOutage ? 'Coupure' : 'Électricité active'} - ${neighborhoodName}`}
        >
          {hasOutage && (
            <div className="w-2 h-2 rounded-full bg-outage-foreground/80" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-foreground text-background px-3 py-2 text-sm"
      >
        <p className="font-medium">{neighborhoodName}</p>
        <p className="text-xs opacity-80">
          {formattedHour} - {hasOutage ? 'Coupure programmée' : 'Électricité active'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
