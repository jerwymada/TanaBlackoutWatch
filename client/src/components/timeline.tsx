import { useRef, useEffect, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const hasOutageAtHour = (hour: number): boolean => {
    return outages.some(outage => hour >= outage.startHour && hour < outage.endHour);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const timer = setTimeout(() => {
      const scrollViewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollViewport) {
        const hourToScroll = filterHour !== null && filterHour !== undefined ? filterHour : currentHour;
        const slotWidth = 30;
        const gap = 4;
        const containerWidth = scrollViewport.clientWidth;
        const scrollPosition = Math.max(0, (hourToScroll * (slotWidth + gap)) - (containerWidth / 2) + (slotWidth / 2));
        scrollViewport.scrollLeft = scrollPosition;
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [currentHour, filterHour]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    const scrollViewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (scrollViewport && Math.abs(diff) > 10) {
      scrollViewport.scrollLeft += diff * 0.5;
    }
  };

  return (
    <div className="w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <ScrollArea className="w-full whitespace-nowrap" ref={containerRef}>
        <div className="flex gap-1 px-1 pb-1">
          {hours.map(hour => (
            <div 
              key={hour} 
              className="min-w-[1.875rem] text-center text-xs text-muted-foreground font-medium"
            >
              {hour.toString().padStart(2, '0')}
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
