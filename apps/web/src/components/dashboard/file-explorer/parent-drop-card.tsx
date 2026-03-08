import { useDroppable } from "@dnd-kit/core";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { PARENT_DROP_ID } from "../dnd/file-explorer-dnd-context";

export function ParentDropCard({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="option"
      tabIndex={0}
      aria-selected={false}
      className={cn(
        "flex cursor-default flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-muted-foreground transition-colors hover:bg-accent/50",
        isOver && "bg-accent/50 ring-1 ring-ring"
      )}
      onClick={onNavigate}
      onDoubleClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onNavigate();
        }
      }}
    >
      <ArrowUp className="size-8" />
      <span className="text-xs font-medium">..</span>
    </div>
  );
}
