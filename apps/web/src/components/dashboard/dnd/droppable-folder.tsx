import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

interface DroppableFolderProps {
  id: string;
  children: (isOver: boolean) => ReactNode;
}

export function DroppableFolder({ id, children }: DroppableFolderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${id}:into`,
  });

  return (
    <div className="relative">
      {children(isOver)}
      <div
        ref={setNodeRef}
        className="absolute inset-x-0 top-1/4 bottom-1/4 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
