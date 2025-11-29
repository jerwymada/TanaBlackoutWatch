import { useRef, useEffect, useState } from "react";
import { TimelineSlot } from "./timeline-slot";
import type { Outage } from "@shared/schema";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TimelineProps {
  outages: Outage[];
  neighborhoodName: string;
  currentHour: number;
  filterHour?: number | null;
}

export function Timeline({ outages, neighborhoodName, currentHour, filterHour }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tomorrowMarkerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [showTomorrowDate, setShowTomorrowDate] = useState(false);
  // Create 48 slots for 30-minute intervals (0.0, 0.5, 1.0, 1.5, ..., 23.5)
  const slots = Array.from({ length: 48 }, (_, i) => i * 0.5);
  
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  const displayDate = showTomorrowDate 
    ? format(addDays(new Date(), 1), 'd MMM', { locale: fr })
    : format(new Date(), 'd MMM', { locale: fr });
  
  // Détecte quand les heures du lendemain sont visibles en vérifiant le scroll position
  useEffect(() => {
    if (!containerRef.current) return;
    
    const viewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewport) return;
    
    const handleScroll = () => {
      if (!tomorrowMarkerRef.current) return;
      
      const viewportRect = viewport.getBoundingClientRect();
      const markerRect = tomorrowMarkerRef.current.getBoundingClientRect();
      const viewportLeft = viewport.scrollLeft;
      const markerScrollLeft = tomorrowMarkerRef.current.offsetLeft;
      
      // Si le marqueur a dépassé le viewport (scrollé vers la gauche), affiche la date de demain
      const markerVisible = markerScrollLeft < viewportLeft + viewport.clientWidth && markerScrollLeft >= viewportLeft;
      setShowTomorrowDate(markerScrollLeft < viewportLeft + viewport.clientWidth * 0.3);
    };
    
    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);
  
  const hasOutageAtSlot = (slot: number, day: 0 | 1 = 0): boolean => {
    const targetDate = day === 0 ? today : tomorrow;
    const targetSlot = slot % 24;
    return outages.some(outage => 
      outage.date === targetDate && 
      targetSlot >= outage.startHour && 
      targetSlot < outage.endHour
    );
  };

  const getOutageForSlot = (slot: number, day: 0 | 1 = 0) => {
    const targetDate = day === 0 ? today : tomorrow;
    const targetSlot = slot % 24;
    return outages.find(outage => 
      outage.date === targetDate && 
      targetSlot >= outage.startHour && 
      targetSlot < outage.endHour
    );
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const timer = setTimeout(() => {
      const scrollViewport = containerRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (scrollViewport) {
        const hourToScroll = filterHour !== null && filterHour !== undefined ? filterHour : currentHour;
        const slotWidth = 15; // Smaller width for 30-minute slots
        const gap = 2;
        const containerWidth = scrollViewport.clientWidth;
        // Convert hour to slot index (hour * 2 for 30-minute intervals)
        const slotIndex = hourToScroll * 2;
        const scrollPosition = Math.max(0, (slotIndex * (slotWidth + gap)) - (containerWidth / 2) + (slotWidth / 2));
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
        className="w-full"
        onTouchStart={handleTouchStart} 
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ScrollArea className="w-full whitespace-nowrap" ref={containerRef}>
          <div className="flex pointer-events-none">
            <div className="flex gap-0.5 px-1 pb-1">
              {slots.map((slot, index) => {
                const hour = Math.floor(slot);
                const isHalfHour = slot % 1 !== 0;
                const isCurrentSlot = hour === currentHour && !isHalfHour;
                // Only show hour label on full hours (0, 1, 2, etc.)
                if (isHalfHour) return <div key={`today-${slot}`} className="min-w-[0.9375rem]" />;
                return (
                  <div 
                    key={`today-${slot}`}
                    className={cn(
                      "min-w-[0.9375rem] text-center text-[10px] font-medium",
                      isCurrentSlot 
                        ? "font-bold text-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    {hour.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
            <div ref={tomorrowMarkerRef} className="w-px bg-border mx-2" />
            <div className="flex gap-0.5 px-1 pb-1">
              {slots.map((slot) => {
                const hour = Math.floor(slot);
                const isHalfHour = slot % 1 !== 0;
                if (isHalfHour) return <div key={`tomorrow-${slot}`} className="min-w-[0.9375rem]" />;
                return (
                  <div 
                    key={`tomorrow-${slot}`}
                    className="min-w-[0.9375rem] text-center text-[10px] text-muted-foreground font-medium"
                  >
                    {hour.toString().padStart(2, '0')}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex">
            <div className="flex gap-0.5 px-1 pb-2 pointer-events-auto">
              {slots.map(slot => {
                const outage = getOutageForSlot(slot, 0);
                const hour = Math.floor(slot);
                return (
                  <TimelineSlot
                    key={`today-slot-${slot}`}
                    slot={slot}
                    hour={hour}
                    hasOutage={hasOutageAtSlot(slot, 0)}
                    neighborhoodName={neighborhoodName}
                    isCurrentSlot={hour === currentHour && slot % 1 === 0}
                    outageStartHour={outage?.startHour}
                    outageEndHour={outage?.endHour}
                    outageReason={outage?.reason || undefined}
                  />
                );
              })}
            </div>
            <div className="w-px bg-border mx-2 pointer-events-none" />
            <div className="flex gap-0.5 px-1 pb-2 pointer-events-auto">
              {slots.map(slot => {
                const outage = getOutageForSlot(slot, 1);
                const hour = Math.floor(slot);
                return (
                  <TimelineSlot
                    key={`tomorrow-slot-${slot}`}
                    slot={slot}
                    hour={hour}
                    hasOutage={hasOutageAtSlot(slot, 1)}
                    neighborhoodName={neighborhoodName}
                    isCurrentSlot={false}
                    outageStartHour={outage?.startHour}
                    outageEndHour={outage?.endHour}
                    outageReason={outage?.reason || undefined}
                  />
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
