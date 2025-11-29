import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Clock, MapPin, Calendar, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HistoricalStats } from "@shared/schema";
import { format, subDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  className 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: typeof TrendingUp;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function NeighborhoodRanking({ 
  rankings 
}: { 
  rankings: HistoricalStats['neighborhoodRankings'] 
}) {
  if (rankings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune donnée disponible
      </div>
    );
  }

  const maxHours = Math.max(...rankings.map(r => r.totalOutageHours));

  return (
    <div className="space-y-3">
      {rankings.slice(0, 10).map((ranking, index) => {
        const percentage = maxHours > 0 ? (ranking.totalOutageHours / maxHours) * 100 : 0;
        return (
          <div key={ranking.neighborhoodId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={index < 3 ? "default" : "secondary"}
                  className={index === 0 ? "bg-outage text-outage-foreground" : ""}
                >
                  #{index + 1}
                </Badge>
                <span className="font-medium">{ranking.neighborhoodName}</span>
              </div>
              <span className="text-muted-foreground">{ranking.totalOutageHours}h</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-outage/70 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DailyChart({ 
  dailyStats 
}: { 
  dailyStats: HistoricalStats['dailyStats'] 
}) {
  if (dailyStats.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Aucune donnée disponible
      </div>
    );
  }

  const maxOutages = Math.max(...dailyStats.map(d => d.totalOutages));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1">
        {dailyStats.slice(-14).map((stat) => {
          const date = parseISO(stat.date);
          const intensity = maxOutages > 0 ? stat.totalOutages / maxOutages : 0;
          return (
            <div 
              key={stat.date}
              className="text-center"
            >
              <div 
                className="aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors"
                style={{
                  backgroundColor: `rgba(231, 76, 60, ${0.1 + intensity * 0.7})`,
                  color: intensity > 0.5 ? 'white' : 'inherit'
                }}
                title={`${format(date, "d MMM", { locale: fr })}: ${stat.totalOutages} coupures, ${stat.totalHours}h total`}
              >
                {stat.totalOutages}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {format(date, "d", { locale: fr })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground text-center">
        14 derniers jours (nombre de coupures par jour)
      </div>
    </div>
  );
}

export default function Stats() {
  const [dateRange, setDateRange] = useState("14");

  const startDate = useMemo(() => {
    const days = parseInt(dateRange, 10);
    return format(subDays(new Date(), days), "yyyy-MM-dd");
  }, [dateRange]);

  const endDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const { data: stats, isLoading, isError } = useQuery<HistoricalStats>({
    queryKey: ["/api/stats", { startDate, endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/stats?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                  Statistiques
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Historique des délestages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger 
                  className="w-[140px] h-11"
                  data-testid="select-date-range"
                >
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="14">14 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                </SelectContent>
              </Select>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 space-y-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </>
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Erreur lors du chargement des statistiques</p>
            </CardContent>
          </Card>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total heures de coupure"
                value={`${stats.totalOutageHours}h`}
                subtitle={`Sur les ${dateRange} derniers jours`}
                icon={Clock}
              />
              <StatCard 
                title="Moyenne quotidienne"
                value={stats.averageDailyOutages.toFixed(1)}
                subtitle="Coupures par jour"
                icon={TrendingUp}
              />
              <StatCard 
                title="Quartiers touchés"
                value={stats.neighborhoodRankings.length}
                subtitle="Quartiers avec coupures"
                icon={MapPin}
              />
              <StatCard 
                title="Jours avec données"
                value={stats.dailyStats.length}
                subtitle="Jours enregistrés"
                icon={BarChart2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-outage" />
                    Quartiers les plus touchés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NeighborhoodRanking rankings={stats.neighborhoodRankings} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-attention" />
                    Activité quotidienne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyChart dailyStats={stats.dailyStats} />
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}

        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>
            Données historiques simulées pour démonstration.
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> • </span>
            <Link href="/" className="text-primary hover:underline">
              Retour au tableau de bord
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
