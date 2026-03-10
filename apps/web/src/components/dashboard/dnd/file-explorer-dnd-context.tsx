import type { Folder, Receipt } from "@curb/db/types";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { DocumentTextIcon, FolderIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useCallback, useRef, useState } from "react";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import type { DraggableData } from "./draggable-item";

export const PARENT_DROP_ID = "__parent__";

const folderColorMap: Record<string, string> = {
  blue: "text-blue-500",
  gray: "text-gray-400",
  green: "text-green-500",
  orange: "text-orange-500",
  pink: "text-pink-500",
  purple: "text-purple-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
};

function getItemColorClass(data: DraggableData): string {
  if (data.type === "folder") {
    return folderColorMap[(data.item as Folder).color ?? ""] ?? "text-blue-500";
  }
  return "text-muted-foreground";
}

function getItemLabel(data: DraggableData): string {
  if (data.type === "folder") {
    return (data.item as Folder).name;
  }
  return (data.item as Receipt).merchantName;
}

interface FileExplorerDndContextProps {
  children: (dropIntoTarget: string | null) => ReactNode;
  items: ExplorerItem[];
  itemRefs: Map<string, HTMLElement>;
  parentFolderId?: string;
  selectedIds: Set<string>;
  view: "grid" | "list";
  onMoveFolder: (folderId: string, targetFolderId?: string) => void;
  onMoveReceipt: (receiptId: string, targetFolderId?: string) => void;
}

interface DraggedItemInfo {
  id: string;
  data: DraggableData;
  offsetX: number;
  offsetY: number;
}

export function FileExplorerDndContext({
  children,
  items,
  itemRefs,
  parentFolderId,
  selectedIds,
  view,
  onMoveFolder,
  onMoveReceipt,
}: FileExplorerDndContextProps) {
  const [draggedItems, setDraggedItems] = useState<DraggedItemInfo[]>([]);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [dropIntoTarget, setDropIntoTarget] = useState<string | null>(null);
  const dropIntoTargetRef = useRef<string | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 8,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const activeId = event.active.id as string;
      const data = event.active.data.current as DraggableData | undefined;
      if (!data) {
        return;
      }

      const activeEl = itemRefs.get(activeId);
      if (!activeEl) {
        return;
      }

      const activeRect = activeEl.getBoundingClientRect();
      setDragWidth(activeRect.width);

      const dragged: DraggedItemInfo[] = [];

      if (selectedIds.has(activeId) && selectedIds.size > 1) {
        for (const id of selectedIds) {
          const entry = items.find((e) => e.item.id === id);
          if (!entry) {
            continue;
          }

          const el = itemRefs.get(id);
          if (!el) {
            continue;
          }

          const rect = el.getBoundingClientRect();
          dragged.push({
            data: { item: entry.item, type: entry.type },
            id,
            offsetX: rect.left - activeRect.left,
            offsetY: rect.top - activeRect.top,
          });
        }
      } else {
        dragged.push({ data, id: activeId, offsetX: 0, offsetY: 0 });
      }

      setDraggedItems(dragged);
    },
    [items, selectedIds, itemRefs]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);
      return;
    }

    const overId = over.id as string;

    if (over.id === PARENT_DROP_ID || overId.startsWith("breadcrumb:")) {
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);
      return;
    }
    if (overId.endsWith(":into")) {
      const folderId = overId.slice(0, -5);
      if (folderId !== (active.id as string)) {
        dropIntoTargetRef.current = folderId;
        setDropIntoTarget(folderId);
        return;
      }
    }

    dropIntoTargetRef.current = null;
    setDropIntoTarget(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggedItems([]);

      const currentDropTarget = dropIntoTargetRef.current;
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);

      const { active, over } = event;
      const activeData = active.data.current as DraggableData | undefined;

      if (!over || !activeData) {
        return;
      }

      let targetFolderId: string | undefined;

      const overId = over.id as string;

      if (over.id === PARENT_DROP_ID) {
        targetFolderId = parentFolderId;
      } else if (overId.startsWith("breadcrumb:")) {
        const crumbId = overId.slice("breadcrumb:".length);
        targetFolderId = crumbId === "__root__" ? undefined : crumbId;
      } else {
        const dropTarget =
          currentDropTarget ||
          (overId.endsWith(":into") ? overId.slice(0, -5) : null);
        if (dropTarget && dropTarget !== (active.id as string)) {
          targetFolderId = dropTarget;
        } else {
          return;
        }
      }

      if (selectedIds.has(active.id as string) && selectedIds.size > 1) {
        for (const id of selectedIds) {
          if (id === targetFolderId) {
            continue;
          }
          const entry = items.find((e) => e.item.id === id);
          if (entry?.type === "folder") {
            onMoveFolder(id, targetFolderId);
          } else {
            onMoveReceipt(id, targetFolderId);
          }
        }
      } else if (activeData.type === "folder") {
        onMoveFolder(active.id as string, targetFolderId);
      } else {
        onMoveReceipt(active.id as string, targetFolderId);
      }
    },
    [items, selectedIds, onMoveFolder, onMoveReceipt, parentFolderId]
  );

  const isActive = draggedItems.length > 0;

  const renderGridOverlay = () =>
    draggedItems.map((item) => {
      const Icon = item.data.type === "folder" ? FolderIcon : DocumentTextIcon;
      return (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: item.offsetX,
            top: item.offsetY,
            width: dragWidth ?? undefined,
          }}
        >
          <div className="flex flex-col items-center gap-1 p-2">
            <Icon
              className={cn(
                "size-16 shrink-0 drop-shadow-sm",
                getItemColorClass(item.data)
              )}
            />
            <span className="max-w-full truncate rounded-md bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">
              {getItemLabel(item.data)}
            </span>
          </div>
        </div>
      );
    });

  const renderListOverlay = () => {
    if (draggedItems.length === 1) {
      const [item] = draggedItems;
      const Icon = item.data.type === "folder" ? FolderIcon : DocumentTextIcon;
      return (
        <div className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm">
          <Icon className={cn("size-4", getItemColorClass(item.data))} />
          <span className="text-sm font-medium">{getItemLabel(item.data)}</span>
        </div>
      );
    }

    return (
      <div className="relative">
        {draggedItems.map((item, i) => {
          const Icon =
            item.data.type === "folder" ? FolderIcon : DocumentTextIcon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 backdrop-blur-sm",
                i === 0 ? "relative shadow-lg" : "absolute inset-x-0"
              )}
              style={
                i > 0
                  ? {
                      top: -(i * 4),
                      transform: `translateX(${i * 4}px)`,
                    }
                  : undefined
              }
            >
              <Icon className={cn("size-4", getItemColorClass(item.data))} />
              <span className="text-sm font-medium">
                {getItemLabel(item.data)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {children(dropIntoTarget)}
      <DragOverlay dropAnimation={null}>
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {view === "grid" ? renderGridOverlay() : renderListOverlay()}
              {draggedItems.length > 1 && (
                <div
                  className={cn(
                    "absolute -right-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full",
                    "bg-primary text-xs font-bold text-primary-foreground shadow-md"
                  )}
                >
                  {draggedItems.length}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DragOverlay>
    </DndContext>
  );
}
