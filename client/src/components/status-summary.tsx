import { Zap, ZapOff, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OutageSchedule } from "@shared/schema";

interface StatusSummaryProps {
  schedules: OutageSchedule[];
  currentHour: number;
}

export function StatusSummary({ schedules, currentHour }: StatusSummaryProps) {
  const activeCount = schedules.filter(schedule => {
    return !schedule.outages.some(
      outage => currentHour >= outage.startHour && currentHour < outage.endHour
    );
  }).length;

  const outageCount = schedules.length - activeCount;

  const upcomingOutages = schedules.filter(schedule => {
    const hasCurrentOutage = schedule.outages.some(
      outage => currentHour >= outage.startHour && currentHour < outage.endHour
    );
    const hasUpcomingOutage = schedule.outages.some(
      outage => outage.startHour > currentHour && outage.startHour <= currentHour + 2
    );
    return !hasCurrentOutage && hasUpcomingOutage;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card className="bg-outage/10 border-outage/20 dark:bg-outage/20">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="p-2 rounded-full bg-outage/20">
            <ZapOff className="h-5 w-5 text-outage" />
          </div>
          <div>
            <p className="text-2xl font-bold text-outage" data-testid="text-outage-count">{outageCount}</p>
            <p className="text-sm text-muted-foreground">En coupure</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-attention/10 border-attention/20 dark:bg-attention/20">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="p-2 rounded-full bg-attention/20">
            <Clock className="h-5 w-5 text-attention" />
          </div>
          <div>
            <p className="text-2xl font-bold text-attention" data-testid="text-upcoming-count">{upcomingOutages}</p>
            <p className="text-sm text-muted-foreground">Coupures dans 2h</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
