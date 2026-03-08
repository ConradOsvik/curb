import type { Doc, Id } from "@curb/backend/convex/_generated/dataModel";
import { Folder, FolderOpen } from "lucide-react";
import { motion } from "motion/react";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import { DraggableItem } from "../dnd/draggable-item";
import { DroppableFolder } from "../dnd/droppable-folder";
import { ItemContextMenu } from "../context-menus/item-context-menu";
import { ParentDropCard } from "./parent-drop-card";
import { ScanningPlaceholderCard } from "./scanning-placeholder";

const folderColorMap: Record<string, string> = {
  blue: "text-blue-500",
  gray: "text-gray-500",
  green: "text-green-500",
  orange: "text-orange-500",
  pink: "text-pink-500",
  purple: "text-purple-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currency || "USD",
    style: "currency",
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

interface FileExplorerCardGridProps {
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

export function FileExplorerCardGrid({
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
}: FileExplorerCardGridProps) {
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
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,120px)]">
        {scanningCount > 0 &&
          Array.from({ length: scanningCount }).map((_, i) => (
            <ScanningPlaceholderCard key={`scanning-${i.toString()}`} />
          ))}

        {currentFolderId && (
          <ParentDropCard onNavigate={() => onNavigate(parentFolderId)} />
        )}

        {items.map((entry) => {
          if (entry.type === "folder") {
            const folder = entry.item as Doc<"folders">;
            const colorClass = folder.color
              ? folderColorMap[folder.color]
              : "text-muted-foreground";

            return (
              <motion.div
                key={folder._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                ref={(el) => setItemRef(folder._id, el)}
              >
                <ItemContextMenu
                  type="folder"
                  folders={allFolders.filter((f) => f._id !== folder._id)}
                  currentFolderId={currentFolderId}
                  onRename={() => onRenameFolder(folder._id, folder.name)}
                  onChangeColor={(color) =>
                    onChangeFolderColor(folder._id, color)
                  }
                  onMove={(targetId) => onMoveFolder(folder._id, targetId)}
                  onDelete={() => onDeleteFolder(folder._id)}
                >
                  <DraggableItem
                    id={folder._id}
                    data={{ item: folder, type: "folder" }}
                    isSelected={isSelected(folder._id)}
                  >
                    <DroppableFolder id={folder._id}>
                      {() => (
                        <div
                          role="option"
                          tabIndex={0}
                          aria-selected={isSelected(folder._id)}
                          className={cn(
                            "flex cursor-default flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                            isSelected(folder._id) &&
                              "bg-accent ring-1 ring-ring",
                            dropIntoTarget === folder._id &&
                              "bg-accent/50 ring-1 ring-ring"
                          )}
                          onClick={(e) => onSelect(folder._id, e)}
                          onDoubleClick={() => onNavigate(folder._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onNavigate(folder._id);
                            }
                          }}
                        >
                          <Folder className={cn("size-8", colorClass)} />
                          <span className="max-w-full truncate text-xs font-medium">
                            {folder.name}
                          </span>
                        </div>
                      )}
                    </DroppableFolder>
                  </DraggableItem>
                </ItemContextMenu>
              </motion.div>
            );
          }

          const receipt = entry.item as Doc<"receipts">;
          return (
            <motion.div
              key={receipt._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              ref={(el) => setItemRef(receipt._id, el)}
            >
              <ItemContextMenu
                type="receipt"
                folders={allFolders}
                currentFolderId={currentFolderId}
                onViewDetails={() => onViewReceipt(receipt)}
                onMove={(targetId) => onMoveReceipt(receipt._id, targetId)}
                onDelete={() => onDeleteReceipt(receipt._id)}
              >
                <DraggableItem
                  id={receipt._id}
                  data={{ item: receipt, type: "receipt" }}
                  isSelected={isSelected(receipt._id)}
                >
                  <div
                    role="option"
                    tabIndex={0}
                    aria-selected={isSelected(receipt._id)}
                    className={cn(
                      "flex cursor-default flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent/50",
                      isSelected(receipt._id) && "bg-accent ring-1 ring-ring"
                    )}
                    onClick={(e) => onSelect(receipt._id, e)}
                    onDoubleClick={() => onViewReceipt(receipt)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onViewReceipt(receipt);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="truncate text-sm font-medium">
                        {receipt.merchantName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(receipt.date)}</span>
                      <span className="capitalize">{receipt.receiptType}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrency(receipt.total, receipt.currency)}
                    </span>
                  </div>
                </DraggableItem>
              </ItemContextMenu>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
