import { Loader2 } from "lucide-react";

export function ScanningPlaceholderRow() {
  return (
    <div className="flex h-10 animate-pulse items-center gap-3 border-b px-4 text-sm opacity-50">
      <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
      <span className="flex-1 truncate text-muted-foreground">
        Scanning receipt...
      </span>
      <span className="w-20 shrink-0">&mdash;</span>
      <span className="w-28 shrink-0">&mdash;</span>
      <span className="w-24 shrink-0 text-right">&mdash;</span>
    </div>
  );
}

export function ScanningPlaceholderCard() {
  return (
    <div className="flex animate-pulse flex-col gap-2 rounded-lg border border-dashed p-4 opacity-50">
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Scanning...</span>
      </div>
      <div className="h-3 w-2/3 rounded bg-muted" />
      <div className="h-3 w-1/3 rounded bg-muted" />
    </div>
  );
}
