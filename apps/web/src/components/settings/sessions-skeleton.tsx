import { Skeleton } from "@/components/ui/skeleton";

export function SessionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border px-3 py-2.5"
        >
          <Skeleton className="size-9 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
