import { useRef, useEffect } from "react";
import { TimelineSlot } from "./timeline-slot";
import type { Outage } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface TimelineProps {
  outages: Outage[];
  neighborhoodName: string;
  currentHour: number;
  filterHour?: number | null;
}

export function Timeline({ outages, neighborhoodName, currentHour, filterHour }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const hasOutageAtHour = (hour: number): boolean => {
    return outages.some(outage => hour >= outage.startHour && hour < outage.endHour);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const hourToScroll = filterHour !== null && filterHour !== undefined ? filterHour : currentHour;
      const slotWidth = 64;
      const gap = 4;
      const containerWidth = scrollRef.current.offsetWidth;
      const scrollPosition = Math.max(0, (hourToScroll * (slotWidth + gap)) - (containerWidth / 2) + (slotWidth / 2));
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [currentHour, filterHour]);

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap" ref={scrollRef}>
        <div className="flex gap-1 px-1 pb-1">
          {hours.map(hour => (
            <div 
              key={hour} 
              className="min-w-[3.75rem] text-center text-xs text-muted-foreground font-medium"
            >
              {hour.toString().padStart(2, '0')}h
            </div>
          ))}
        </div>
        <div className="flex gap-1 px-1 pb-2">
          {hours.map(hour => (
            <TimelineSlot
              key={hour}
              hour={hour}
              hasOutage={hasOutageAtHour(hour)}
              neighborhoodName={neighborhoodName}
              isCurrentHour={hour === currentHour}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
