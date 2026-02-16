import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-48" />
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="border-border border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
              <Skeleton className="h-8 w-28 rounded-md" />
            </div>
            <div className="mt-3 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-48" />
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
