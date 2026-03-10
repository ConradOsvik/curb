import { useDroppable } from "@dnd-kit/core";
import { ArrowUpIcon } from "@heroicons/react/24/solid";

import { cn } from "@/lib/utils";

import { PARENT_DROP_ID } from "../dnd/file-explorer-dnd-context";

export function ParentDropRow({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="row"
      tabIndex={0}
      className={cn(
        "group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm text-muted-foreground transition-colors hover:bg-accent/50",
        isOver && "bg-accent/50 ring-1 ring-ring"
      )}
      onDoubleClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onNavigate();
        }
      }}
    >
      <ArrowUpIcon className="size-4 shrink-0" />
      <span className="flex-1 truncate font-medium">..</span>
      <span className="w-20 shrink-0">&mdash;</span>
      <span className="w-28 shrink-0">&mdash;</span>
      <span className="w-24 shrink-0 text-right">&mdash;</span>
    </div>
  );
}
