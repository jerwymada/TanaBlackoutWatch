import { useRef, useEffect, useState } from "react";
import { TimelineSlot } from "./timeline-slot";
import type { Outage } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface TimelineProps {
  outages: Outage[];
  neighborhoodName: string;
  currentHour: number;
  filterHour?: number | null;
}

export function Timeline({ outages, neighborhoodName, currentHour, filterHour }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const displayDate = format(new Date(), 'd MMM', { locale: fr });
  
  const hasOutageAtHour = (hour: number, day: 0 | 1 = 0): boolean => {
    const targetDate = day === 0 ? today : tomorrow;
    const targetHour = hour % 24;
    return outages.some(outage => 
      outage.date === targetDate && 
      targetHour >= outage.startHour && 
      targetHour < outage.endHour
    );
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
  }, [currentHour, filterHour, today]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    const viewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (viewport && Math.abs(diff) > 10) {
      viewport.scrollLeft += diff;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const viewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (viewport) {
      const diff = dragStart - e.clientX;
      viewport.scrollLeft += diff;
      setDragStart(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-1 py-2">
        <div className="text-xs font-semibold text-muted-foreground">
          {displayDate}
        </div>
      </div>
      <div 
        className={`w-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onTouchStart={handleTouchStart} 
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ScrollArea className="w-full whitespace-nowrap cursor-inherit" ref={containerRef}>
          <div className="flex cursor-inherit pointer-events-none">
            <div className="flex gap-1 px-1 pb-1">
              {hours.map(hour => (
                <div 
                  key={`today-${hour}`}
                  className="min-w-[1.875rem] text-center text-xs text-muted-foreground font-medium cursor-inherit"
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
            <div className="w-px bg-border mx-2" />
            <div className="flex gap-1 px-1 pb-1">
              {hours.map(hour => (
                <div 
                  key={`tomorrow-${hour}`}
                  className="min-w-[1.875rem] text-center text-xs text-muted-foreground font-medium cursor-inherit"
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
          <div className="flex cursor-inherit pointer-events-none">
            <div className="flex gap-1 px-1 pb-2">
              {hours.map(hour => (
                <TimelineSlot
                  key={`today-slot-${hour}`}
                  hour={hour}
                  hasOutage={hasOutageAtHour(hour, 0)}
                  neighborhoodName={neighborhoodName}
                  isCurrentHour={hour === currentHour}
                />
              ))}
            </div>
            <div className="w-px bg-border mx-2" />
            <div className="flex gap-1 px-1 pb-2">
              {hours.map(hour => (
                <TimelineSlot
                  key={`tomorrow-slot-${hour}`}
                  hour={hour}
                  hasOutage={hasOutageAtHour(hour, 1)}
                  neighborhoodName={neighborhoodName}
                  isCurrentHour={false}
                />
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
