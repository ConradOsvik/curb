import type { Doc, Id } from "@curb/backend/convex/_generated/dataModel";
import { FolderOpen } from "lucide-react";
import { motion } from "motion/react";

import type { ExplorerItem } from "@/hooks/use-dashboard";

import { DraggableItem } from "../dnd/draggable-item";
import { DroppableFolder } from "../dnd/droppable-folder";
import { ItemContextMenu } from "../context-menus/item-context-menu";
import { FileExplorerRow } from "./file-explorer-row";
import { ParentDropRow } from "./parent-drop-target";
import { ScanningPlaceholderRow } from "./scanning-placeholder";

interface FileExplorerTableProps {
  items: ExplorerItem[];
  allFolders: Doc<"folders">[];
  currentFolderId?: Id<"folders">;
  parentFolderId?: Id<"folders">;
  scanningCount: number;
  isSelected: (id: string) => boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onNavigate: (folderId?: Id<"folders">) => void;
  onViewReceipt: (receipt: Doc<"receipts">) => void;
  onRenameFolder: (folderId: Id<"folders">, name: string) => void;
  onChangeFolderColor: (folderId: Id<"folders">, color: string) => void;
  onMoveFolder: (folderId: Id<"folders">, targetId?: Id<"folders">) => void;
  onDeleteFolder: (folderId: Id<"folders">) => void;
  onMoveReceipt: (receiptId: Id<"receipts">, targetId?: Id<"folders">) => void;
  onDeleteReceipt: (receiptId: Id<"receipts">) => void;
  setItemRef: (id: string, el: HTMLElement | null) => void;
  dropIntoTarget?: string | null;
}

export function FileExplorerTable({
  items,
  allFolders,
  currentFolderId,
  parentFolderId,
  scanningCount,
  isSelected,
  onSelect,
  onNavigate,
  onViewReceipt,
  onRenameFolder,
  onChangeFolderColor,
  onMoveFolder,
  onDeleteFolder,
  onMoveReceipt,
  onDeleteReceipt,
  setItemRef,
  dropIntoTarget,
}: FileExplorerTableProps) {
  const isEmpty = items.length === 0 && !currentFolderId;

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        <FolderOpen className="size-10 stroke-1" />
        <p className="text-sm">
          No receipts yet. Drop images or right-click to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" role="table">
      <div className="sticky top-0 z-10 flex h-8 items-center gap-3 border-b bg-surface px-4 text-xs font-medium text-muted-foreground">
        <div className="size-4 shrink-0" />
        <span className="flex-1">Name</span>
        <span className="w-20 shrink-0">Type</span>
        <span className="w-28 shrink-0">Date</span>
        <span className="w-24 shrink-0 text-right">Amount</span>
      </div>

      {currentFolderId && (
        <ParentDropRow onNavigate={() => onNavigate(parentFolderId)} />
      )}

      {items.map((entry) =>
        entry.type === "folder" ? (
          <motion.div
            key={entry.item._id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            ref={(el) => setItemRef(entry.item._id, el)}
          >
            <ItemContextMenu
              type="folder"
              folders={allFolders.filter((f) => f._id !== entry.item._id)}
              currentFolderId={currentFolderId}
              onRename={() =>
                onRenameFolder(
                  entry.item._id as Id<"folders">,
                  (entry.item as Doc<"folders">).name
                )
              }
              onChangeColor={(color) =>
                onChangeFolderColor(entry.item._id as Id<"folders">, color)
              }
              onMove={(targetId) =>
                onMoveFolder(entry.item._id as Id<"folders">, targetId)
              }
              onDelete={() => onDeleteFolder(entry.item._id as Id<"folders">)}
            >
              <DraggableItem
                id={entry.item._id}
                data={{
                  item: entry.item,
                  type: "folder",
                }}
                isSelected={isSelected(entry.item._id)}
              >
                <DroppableFolder id={entry.item._id}>
                  {() => (
                    <FileExplorerRow
                      type="folder"
                      item={entry.item as Doc<"folders">}
                      isSelected={isSelected(entry.item._id)}
                      isDropTarget={dropIntoTarget === entry.item._id}
                      onClick={(e) => onSelect(entry.item._id, e)}
                      onDoubleClick={() =>
                        onNavigate(entry.item._id as Id<"folders">)
                      }
                    />
                  )}
                </DroppableFolder>
              </DraggableItem>
            </ItemContextMenu>
          </motion.div>
        ) : (
          <motion.div
            key={entry.item._id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            ref={(el) => setItemRef(entry.item._id, el)}
          >
            <ItemContextMenu
              type="receipt"
              folders={allFolders}
              currentFolderId={currentFolderId}
              onViewDetails={() => onViewReceipt(entry.item as Doc<"receipts">)}
              onMove={(targetId) =>
                onMoveReceipt(entry.item._id as Id<"receipts">, targetId)
              }
              onDelete={() => onDeleteReceipt(entry.item._id as Id<"receipts">)}
            >
              <DraggableItem
                id={entry.item._id}
                data={{
                  item: entry.item,
                  type: "receipt",
                }}
                isSelected={isSelected(entry.item._id)}
              >
                <FileExplorerRow
                  type="receipt"
                  item={entry.item as Doc<"receipts">}
                  isSelected={isSelected(entry.item._id)}
                  onClick={(e) => onSelect(entry.item._id, e)}
                  onDoubleClick={() =>
                    onViewReceipt(entry.item as Doc<"receipts">)
                  }
                />
              </DraggableItem>
            </ItemContextMenu>
          </motion.div>
        )
      )}

      {scanningCount > 0 &&
        Array.from({ length: scanningCount }).map((_, i) => (
          <ScanningPlaceholderRow key={`scanning-${i.toString()}`} />
        ))}
    </div>
  );
}
