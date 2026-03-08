import type { Doc } from "@curb/backend/convex/_generated/dataModel";
import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

export interface DraggableData {
  type: "folder" | "receipt";
  item: Doc<"folders"> | Doc<"receipts">;
}

interface DraggableItemProps {
  id: string;
  data: DraggableData;
  children: ReactNode;
  isSelected: boolean;
  disabled?: boolean;
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return false;
  }
  return defaultAnimateLayoutChanges(args);
};

export function DraggableItem({
  id,
  data,
  children,
  disabled,
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    animateLayoutChanges,
    data,
    disabled,
    id,
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-dragging={isDragging}
      className="touch-none"
    >
      {children}
    </div>
  );
}
