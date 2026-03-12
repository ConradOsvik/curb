import type { Folder, ReceiptWithItems } from "@curb/api";
import { useDndContext, useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export interface DraggableData {
  type: "folder" | "receipt";
  item: Folder | ReceiptWithItems;
}

interface DraggableItemProps {
  id: string;
  data: DraggableData;
  children: ReactNode;
  isSelected: boolean;
  disabled?: boolean;
}

export function DraggableItem({
  id,
  data,
  children,
  isSelected,
  disabled,
}: DraggableItemProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    data,
    disabled,
    id,
  });
  const { active } = useDndContext();

  // Shrink this item if it's being dragged, OR if it's selected
  // and another selected item is being dragged (multi-drag)
  const isPartOfDrag = isDragging || (isSelected && active !== null);

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        opacity: isPartOfDrag ? 0.4 : 1,
        scale: isPartOfDrag ? 0.95 : 1,
      }}
      transition={{ duration: 0.15 }}
      {...listeners}
      data-dragging={isDragging}
      className="h-full touch-none"
    >
      {children}
    </motion.div>
  );
}
