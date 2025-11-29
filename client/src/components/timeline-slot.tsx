import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineSlotProps {
  slot: number; // Represents time in hours with half-hours: 0.0, 0.5, 1.0, 1.5, etc.
  hour: number; // The hour part (floor of slot)
  hasOutage: boolean;
  neighborhoodName: string;
  isCurrentSlot?: boolean;
  outageStartHour?: number;
  outageEndHour?: number;
  outageReason?: string;
}

export function TimelineSlot({ 
  slot,
  hour, 
  hasOutage, 
  neighborhoodName, 
  isCurrentSlot,
  outageStartHour,
  outageEndHour,
  outageReason,
}: TimelineSlotProps) {
  const isHalfHour = slot % 1 !== 0;
  const minutes = isHalfHour ? '30' : '00';
  const formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
  
  const formatTime = (timeSlot: number): string => {
    const h = Math.floor(timeSlot);
    const m = timeSlot % 1 !== 0 ? '30' : '00';
    return `${h.toString().padStart(2, '0')}:${m}`;
  };
  
  const outageStartFormatted = outageStartHour !== undefined ? formatTime(outageStartHour) : '';
  const outageEndFormatted = outageEndHour !== undefined ? formatTime(outageEndHour) : '';
  const outageDuration = outageEndHour !== undefined && outageStartHour !== undefined 
    ? (outageEndHour - outageStartHour).toFixed(1) 
    : '0';
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "min-w-[0.9375rem] h-10 rounded-sm flex items-center justify-center text-[10px] font-medium transition-all duration-200 cursor-default select-none",
            hasOutage 
              ? "bg-[hsl(0,100%,92%)] text-[hsl(6,78%,57%)]" 
              : "bg-active/20 text-active dark:bg-active/30",
            isCurrentSlot && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background"
          )}
          data-testid={`timeline-slot-${slot}`}
          aria-label={`${formattedTime} - ${hasOutage ? 'Coupure' : 'Électricité active'} - ${neighborhoodName}`}
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
            Électricité active à {formattedTime}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
