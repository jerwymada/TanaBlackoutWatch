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
  outageStartHour?: number;
  outageEndHour?: number;
  outageReason?: string;
}

export function TimelineSlot({ 
  hour, 
  hasOutage, 
  neighborhoodName, 
  isCurrentHour,
  outageStartHour,
  outageEndHour,
  outageReason,
}: TimelineSlotProps) {
  const formattedHour = `${hour.toString().padStart(2, '0')}:00`;
  const outageStartFormatted = outageStartHour ? `${outageStartHour.toString().padStart(2, '0')}:00` : '';
  const outageEndFormatted = outageEndHour ? `${outageEndHour.toString().padStart(2, '0')}:00` : '';
  const outageDuration = outageEndHour && outageStartHour ? outageEndHour - outageStartHour : 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "min-w-[1.875rem] h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-default select-none",
            hasOutage 
              ? "bg-[hsl(0,100%,92%)] text-[hsl(6,78%,57%)]" 
              : "bg-active/20 text-active dark:bg-active/30",
            isCurrentHour && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
          )}
          data-testid={`timeline-slot-${hour}`}
          aria-label={`${formattedHour} - ${hasOutage ? 'Coupure' : 'Électricité active'} - ${neighborhoodName}`}
        >
          {hasOutage && (
            <div className="w-2 h-2 rounded-full bg-[hsl(6,78%,57%)]" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="bg-foreground text-background px-3 py-2 text-sm"
      >
        <p className="font-medium">{neighborhoodName}</p>
        {hasOutage ? (
          <>
            <p className="text-xs opacity-80">
              Coupure programmée
            </p>
            <p className="text-xs opacity-80">
              {outageStartFormatted} - {outageEndFormatted}
            </p>
            <p className="text-xs opacity-80">
              Durée: {outageDuration}h
            </p>
            {outageReason && (
              <p className="text-xs opacity-80">
                Raison: {outageReason}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs opacity-80">
            Électricité active à {formattedHour}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
