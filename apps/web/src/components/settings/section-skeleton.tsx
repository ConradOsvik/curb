import { Skeleton } from "@/components/ui/skeleton";

export function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
