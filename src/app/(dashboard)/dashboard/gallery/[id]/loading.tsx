import { Skeleton } from "@/components/ui/skeleton";

export default function QuoteDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-4 w-28" />

      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="flex gap-3 border-t border-[#E5E5E5] pt-4">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}
