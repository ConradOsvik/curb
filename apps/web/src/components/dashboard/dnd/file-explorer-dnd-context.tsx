import type { Doc, Id } from "@curb/backend/convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Folder, Receipt } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import type { DraggableData } from "./draggable-item";

export const PARENT_DROP_ID = "__parent__";

interface FileExplorerDndContextProps {
  children: (items: ExplorerItem[], dropIntoTarget: string | null) => ReactNode;
  items: ExplorerItem[];
  parentFolderId?: Id<"folders">;
  selectedIds: Set<string>;
  view: "grid" | "list";
  onMoveFolder: (
    folderId: Id<"folders">,
    targetFolderId?: Id<"folders">
  ) => void;
  onMoveReceipt: (
    receiptId: Id<"receipts">,
    targetFolderId?: Id<"folders">
  ) => void;
  onReorder: (items: ExplorerItem[]) => void;
}

interface ActiveItem {
  id: string;
  data: DraggableData;
}

function getItemIds(items: ExplorerItem[]): string {
  return items.map((e) => e.item._id).join(",");
}

// Overlap-based collision detection with three zones per folder:
//   Entry edge (~25%)  → dead zone (no action)
//   Middle    (~50%)   → drop INTO folder
//   Exit edge (~25%)   → reorder / swap
// Uses the dragged item's rect overlap — not cursor position — so
// the behaviour matches what the user sees visually.
const folderAwareCollision: CollisionDetection = (args) => {
  const { collisionRect, droppableContainers, droppableRects, active } = args;
  const activeId = active.id;

  // Drag direction from initial position
  const initialRect = active.rect.current?.initial;
  const dragDeltaX = initialRect ? collisionRect.left - initialRect.left : 0;
  const dragDeltaY = initialRect ? collisionRect.top - initialRect.top : 0;

  const collisionCenterX = collisionRect.left + collisionRect.width / 2;
  const collisionCenterY = collisionRect.top + collisionRect.height / 2;
  const useHorizontal = Math.abs(dragDeltaX) > Math.abs(dragDeltaY);

  interface Candidate {
    id: string;
    container: (typeof droppableContainers)[number];
    overlapRatio: number;
    priority: number; // 2 = drop-into, 1 = reorder
  }

  const candidates: Candidate[] = [];

  for (const container of droppableContainers) {
    const cId = container.id;
    if (cId === activeId) {
      continue;
    }
    if (typeof cId === "string" && cId.endsWith(":into")) {
      continue;
    }

    const rect = droppableRects.get(cId);
    if (!rect) {
      continue;
    }

    // Rect overlap check
    const overlapX =
      Math.min(collisionRect.right, rect.right) -
      Math.max(collisionRect.left, rect.left);
    const overlapY =
      Math.min(collisionRect.bottom, rect.bottom) -
      Math.max(collisionRect.top, rect.top);
    if (overlapX <= 0 || overlapY <= 0) {
      continue;
    }

    const overlapArea = overlapX * overlapY;
    const targetArea = rect.width * rect.height;
    const overlapRatio = overlapArea / targetArea;

    // Parent drop target — always match on any overlap
    if (cId === PARENT_DROP_ID) {
      candidates.push({
        container,
        id: cId,
        overlapRatio,
        priority: 1,
      });
      continue;
    }

    const data = container.data?.current as DraggableData | undefined;
    const isFolder = data?.type === "folder";

    if (isFolder) {
      // Relative position of the collision center within the target (0–1)
      const rel = useHorizontal
        ? (collisionCenterX - rect.left) / rect.width
        : (collisionCenterY - rect.top) / rect.height;

      const movingPositive = useHorizontal ? dragDeltaX > 0 : dragDeltaY > 0;

      const ENTRY = 0.25;
      const EXIT = 0.75;

      if (rel >= ENTRY && rel <= EXIT) {
        // Middle zone → drop into
        candidates.push({
          container,
          id: `${cId}:into`,
          overlapRatio,
          priority: 2,
        });
      } else if (
        (movingPositive && rel > EXIT) ||
        (!movingPositive && rel < ENTRY)
      ) {
        // Exit side → reorder
        candidates.push({
          container,
          id: cId as string,
          overlapRatio,
          priority: 1,
        });
      }
      // Entry side → dead zone (no candidate)
    } else {
      // Non-folder: reorder when collision center is within target rect
      const inTarget =
        collisionCenterX >= rect.left &&
        collisionCenterX <= rect.right &&
        collisionCenterY >= rect.top &&
        collisionCenterY <= rect.bottom;

      if (inTarget) {
        candidates.push({
          container,
          id: cId as string,
          overlapRatio,
          priority: 1,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Prefer drop-into (priority 2) over reorder (priority 1),
  // then pick the target with the most overlap.
  candidates.sort(
    (a, b) => b.priority - a.priority || b.overlapRatio - a.overlapRatio
  );

  const best = candidates[0];

  // For :into collisions, look up the actual :into droppable container
  // so dnd-kit can build a proper `over` object.
  if (best.id.endsWith(":into")) {
    const intoContainer = droppableContainers.find((c) => c.id === best.id);
    if (intoContainer) {
      return [
        {
          data: { droppableContainer: intoContainer, value: best.overlapRatio },
          id: best.id,
        },
      ];
    }
  }

  return [
    {
      data: { droppableContainer: best.container, value: best.overlapRatio },
      id: best.id,
    },
  ];
};

export function FileExplorerDndContext({
  children,
  items,
  parentFolderId,
  selectedIds,
  view,
  onMoveFolder,
  onMoveReceipt,
  onReorder,
}: FileExplorerDndContextProps) {
  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [localItems, setLocalItems] = useState(items);
  const [dropIntoTarget, setDropIntoTarget] = useState<string | null>(null);
  const dropIntoTargetRef = useRef<string | null>(null);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;
  const isDragging = useRef(false);
  const pendingReorder = useRef(false);

  // Sync local items from props, but only when:
  // - Not actively dragging
  // - No pending reorder, OR server has caught up (order matches)
  useEffect(() => {
    if (isDragging.current) {
      return;
    }

    if (pendingReorder.current) {
      // Check if the server order now matches what we set
      if (getItemIds(items) === getItemIds(localItemsRef.current)) {
        pendingReorder.current = false;
        setLocalItems(items);
      }
      return;
    }

    setLocalItems(items);
  }, [items]);

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

  const itemIds = useMemo(
    () => localItems.map((entry) => entry.item._id),
    [localItems]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      isDragging.current = true;
      dragStartOrder.current = getItemIds(items);
      setLocalItems(items);
      localItemsRef.current = items;
      const initialRect = event.active.rect.current?.initial;
      if (initialRect) {
        setDragWidth(initialRect.width);
      }
      const data = event.active.data.current as DraggableData | undefined;
      if (data) {
        setActiveItem({
          data,
          id: event.active.id as string,
        });
      }
    },
    [items]
  );

  // Store the original item order at drag start so we can detect changes
  const dragStartOrder = useRef("");

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);
      return;
    }

    if (over.id === PARENT_DROP_ID) {
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);
      return;
    }

    // Folder "drop into" zone (inner droppable with :into suffix)
    const overId = over.id as string;
    if (overId.endsWith(":into")) {
      const folderId = overId.slice(0, -5);
      if (folderId !== (active.id as string)) {
        dropIntoTargetRef.current = folderId;
        setDropIntoTarget(folderId);
      }
      return;
    }

    // Regular sortable item — reorder
    dropIntoTargetRef.current = null;
    setDropIntoTarget(null);

    setLocalItems((current) => {
      const oldIndex = current.findIndex(
        (entry) => entry.item._id === active.id
      );
      const newIndex = current.findIndex((entry) => entry.item._id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return current;
      }
      const moved = arrayMove(current, oldIndex, newIndex);
      localItemsRef.current = moved;
      return moved;
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      isDragging.current = false;
      setActiveItem(null);

      const currentDropTarget = dropIntoTargetRef.current;
      dropIntoTargetRef.current = null;
      setDropIntoTarget(null);

      const { active, over } = event;

      const activeData = active.data.current as DraggableData | undefined;

      // Drag cancelled or released in a dead zone — still commit
      // any reorder that happened visually during the drag.
      if (!over || !activeData) {
        const currentOrder = getItemIds(localItemsRef.current);
        if (currentOrder !== dragStartOrder.current) {
          pendingReorder.current = true;
          onReorder(localItemsRef.current);
        } else {
          setLocalItems(items);
        }
        return;
      }

      // Dropped onto ".." — move to parent folder
      if (over.id === PARENT_DROP_ID) {
        if (selectedIds.has(active.id as string) && selectedIds.size > 1) {
          for (const id of selectedIds) {
            if (id.includes("folders")) {
              onMoveFolder(id as Id<"folders">, parentFolderId);
            } else {
              onMoveReceipt(id as Id<"receipts">, parentFolderId);
            }
          }
        } else if (activeData.type === "folder") {
          onMoveFolder(active.id as Id<"folders">, parentFolderId);
        } else {
          onMoveReceipt(active.id as Id<"receipts">, parentFolderId);
        }
        return;
      }

      // Dropped into center zone of a folder — move into it
      const overId = over.id as string;
      const dropTarget =
        currentDropTarget ||
        (overId.endsWith(":into") ? overId.slice(0, -5) : null);
      if (dropTarget && dropTarget !== (active.id as string)) {
        const targetFolderId = dropTarget as Id<"folders">;
        if (selectedIds.has(active.id as string) && selectedIds.size > 1) {
          for (const id of selectedIds) {
            if (id === (targetFolderId as string)) {
              continue;
            }
            if (id.includes("folders")) {
              onMoveFolder(id as Id<"folders">, targetFolderId);
            } else {
              onMoveReceipt(id as Id<"receipts">, targetFolderId);
            }
          }
        } else if (activeData.type === "folder") {
          onMoveFolder(active.id as Id<"folders">, targetFolderId);
        } else {
          onMoveReceipt(active.id as Id<"receipts">, targetFolderId);
        }
        setLocalItems(items);
        return;
      }

      // Edge zone or non-folder: check if order changed during drag
      const currentOrder = getItemIds(localItemsRef.current);
      if (currentOrder !== dragStartOrder.current) {
        pendingReorder.current = true;
        onReorder(localItemsRef.current);
      }
    },
    [items, selectedIds, onMoveFolder, onMoveReceipt, onReorder, parentFolderId]
  );

  const draggedCount =
    activeItem && selectedIds.has(activeItem.id) ? selectedIds.size : 1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={folderAwareCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itemIds}
        strategy={
          view === "grid" ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        {children(localItems, dropIntoTarget)}
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div
            className="relative"
            style={
              view === "grid" && dragWidth ? { width: dragWidth } : undefined
            }
          >
            {view === "grid" ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border bg-background p-4 shadow-lg">
                {activeItem.data.type === "folder" ? (
                  <>
                    <Folder className="size-8 text-muted-foreground" />
                    <span className="max-w-full truncate text-xs font-medium">
                      {(activeItem.data.item as Doc<"folders">).name}
                    </span>
                  </>
                ) : (
                  <>
                    <Receipt className="size-8 text-muted-foreground" />
                    <span className="max-w-full truncate text-xs font-medium">
                      {(activeItem.data.item as Doc<"receipts">).merchantName}
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md border bg-background/90 px-3 py-2 shadow-lg backdrop-blur-sm">
                {activeItem.data.type === "folder" ? (
                  <>
                    <Folder className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {(activeItem.data.item as Doc<"folders">).name}
                    </span>
                  </>
                ) : (
                  <>
                    <Receipt className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {(activeItem.data.item as Doc<"receipts">).merchantName}
                    </span>
                  </>
                )}
              </div>
            )}
            {draggedCount > 1 && (
              <div
                className={cn(
                  "absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full",
                  "bg-primary text-xs font-bold text-primary-foreground shadow-md"
                )}
              >
                {draggedCount}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
