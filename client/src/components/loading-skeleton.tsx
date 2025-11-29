import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NeighborhoodCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3 space-y-0">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-9 rounded-md" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[3.75rem] h-4" />
            ))}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="min-w-[3.75rem] h-10 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-8" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FilterControlsSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Skeleton className="h-11 flex-1" />
      <div className="flex gap-2">
        <Skeleton className="h-11 w-full sm:w-[140px]" />
        <Skeleton className="h-11 w-[100px]" />
      </div>
    </div>
  );
}
