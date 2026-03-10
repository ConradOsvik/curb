import type { Folder, Receipt } from "@curb/db/types";
import { useDroppable } from "@dnd-kit/core";
import { FolderIcon, FolderOpenIcon } from "@heroicons/react/24/solid";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import { ItemContextMenu } from "../context-menus/item-context-menu";
import { DraggableItem } from "../dnd/draggable-item";
import { DroppableFolder } from "../dnd/droppable-folder";
import { PARENT_DROP_ID } from "../dnd/file-explorer-dnd-context";
import { InlineEdit } from "./inline-edit";
import { ScanningPlaceholderCard } from "./scanning-placeholder";

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

function ParentDropCardInline({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="option"
      tabIndex={0}
      aria-selected={false}
      className={cn(
        "flex cursor-default flex-col items-center gap-1 rounded-lg p-2 outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-blue-500",
        isOver && "bg-blue-500/20 ring-2 ring-blue-500 rounded-lg"
      )}
      onDoubleClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onNavigate();
        }
      }}
    >
      <FolderIcon className="size-16 shrink-0 text-muted-foreground/60 drop-shadow-sm" />
      <span className="max-w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium">
        ..
      </span>
    </div>
  );
}

interface FileExplorerCardGridProps {
  items: ExplorerItem[];
  allFolders: Folder[];
  currentFolderId?: string;
  parentFolderId?: string;
  scanningCount: number;
  editingId: string | null;
  isSelected: (id: string) => boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onNavigate: (folderId?: string) => void;
  onViewReceipt: (receipt: Receipt) => void;
  onStartEditing: (id: string) => void;
  onSaveEdit: (id: string, name: string) => void;
  onCancelEdit: () => void;
  onChangeFolderColor: (folderId: string, color: string) => void;
  onMoveFolder: (folderId: string, targetId?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveReceipt: (receiptId: string, targetId?: string) => void;
  onDeleteReceipt: (receiptId: string) => void;
  setItemRef: (id: string, el: HTMLElement | null) => void;
  dropIntoTarget?: string | null;
}

export function FileExplorerCardGrid({
  items,
  allFolders,
  currentFolderId,
  parentFolderId,
  scanningCount,
  editingId,
  isSelected,
  onSelect,
  onNavigate,
  onViewReceipt,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
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
        <FolderOpenIcon className="size-10" />
        <p className="text-sm">
          No receipts yet. Drop images or right-click to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-1 grid-cols-[repeat(auto-fill,110px)]">
        {currentFolderId && (
          <ParentDropCardInline onNavigate={() => onNavigate(parentFolderId)} />
        )}

        {items.map((entry) => {
          if (entry.type === "folder") {
            const folder = entry.item as Folder;
            const colorClass = folder.color
              ? folderColorMap[folder.color]
              : "text-blue-500";
            const selected = isSelected(folder.id);
            const isEditing = editingId === folder.id;

            return (
              <div key={folder.id} ref={(el) => setItemRef(folder.id, el)}>
                <ItemContextMenu
                  type="folder"
                  folders={allFolders.filter((f) => f.id !== folder.id)}
                  currentFolderId={currentFolderId}
                  onRename={() => onStartEditing(folder.id)}
                  onChangeColor={(color) =>
                    onChangeFolderColor(folder.id, color)
                  }
                  onMove={(targetId) => onMoveFolder(folder.id, targetId)}
                  onDelete={() => onDeleteFolder(folder.id)}
                >
                  <DraggableItem
                    id={folder.id}
                    data={{ item: folder, type: "folder" }}
                    isSelected={selected}
                    disabled={isEditing}
                  >
                    <DroppableFolder id={folder.id}>
                      {() => (
                        <div
                          role="option"
                          tabIndex={0}
                          aria-selected={selected}
                          className={cn(
                            "flex cursor-default flex-col items-center gap-1 rounded-lg p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                            selected ? "bg-accent/60" : "hover:bg-accent/30",
                            dropIntoTarget === folder.id &&
                              "bg-blue-500/20 ring-2 ring-blue-500 rounded-lg"
                          )}
                          onClick={(e) => onSelect(folder.id, e)}
                          onDoubleClick={() => onNavigate(folder.id)}
                        >
                          <FolderIcon
                            className={cn(
                              "size-16 shrink-0 drop-shadow-sm",
                              colorClass
                            )}
                          />
                          {isEditing ? (
                            <InlineEdit
                              defaultValue={folder.name}
                              onSave={(name) => onSaveEdit(folder.id, name)}
                              onCancel={onCancelEdit}
                              className="w-full text-center text-xs"
                            />
                          ) : (
                            <span
                              className={cn(
                                "max-w-full truncate rounded-md px-1.5 py-0.5 text-xs",
                                selected
                                  ? "bg-blue-600 font-medium text-white"
                                  : "font-medium"
                              )}
                            >
                              {folder.name}
                            </span>
                          )}
                        </div>
                      )}
                    </DroppableFolder>
                  </DraggableItem>
                </ItemContextMenu>
              </div>
            );
          }

          const receipt = entry.item as Receipt;
          const selected = isSelected(receipt.id);
          return (
            <div key={receipt.id} ref={(el) => setItemRef(receipt.id, el)}>
              <ItemContextMenu
                type="receipt"
                folders={allFolders}
                currentFolderId={currentFolderId}
                onViewDetails={() => onViewReceipt(receipt)}
                onMove={(targetId) => onMoveReceipt(receipt.id, targetId)}
                onDelete={() => onDeleteReceipt(receipt.id)}
              >
                <DraggableItem
                  id={receipt.id}
                  data={{ item: receipt, type: "receipt" }}
                  isSelected={selected}
                >
                  <div
                    role="option"
                    tabIndex={0}
                    aria-selected={selected}
                    className={cn(
                      "flex h-full cursor-default flex-col rounded-lg p-1 outline-none transition-colors",
                      selected
                        ? "bg-accent/60"
                        : "hover:bg-accent/30",
                      "focus-visible:ring-2 focus-visible:ring-blue-500"
                    )}
                    onClick={(e) => onSelect(receipt.id, e)}
                    onDoubleClick={() => onViewReceipt(receipt)}
                  >
                    <div className="flex flex-col gap-1 rounded-t-md bg-white px-2 pt-2 pb-2.5 text-gray-900 dark:bg-gray-100 dark:text-gray-900">
                      <span className="truncate text-sm font-semibold">
                        {receipt.merchantName}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{formatDate(receipt.date)}</span>
                        <span className="capitalize">
                          {receipt.receiptType}
                        </span>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(receipt.total, receipt.currency)}
                      </span>
                    </div>
                    <svg
                      className="block w-full text-white dark:text-gray-100"
                      viewBox="0 0 120 5"
                      preserveAspectRatio="none"
                      height="5"
                    >
                      <path
                        d="M0,0 H120 V5 A5,5 0 0,0 110,5 A5,5 0 0,0 100,5 A5,5 0 0,0 90,5 A5,5 0 0,0 80,5 A5,5 0 0,0 70,5 A5,5 0 0,0 60,5 A5,5 0 0,0 50,5 A5,5 0 0,0 40,5 A5,5 0 0,0 30,5 A5,5 0 0,0 20,5 A5,5 0 0,0 10,5 A5,5 0 0,0 0,5 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </DraggableItem>
              </ItemContextMenu>
            </div>
          );
        })}

        {scanningCount > 0 &&
          Array.from({ length: scanningCount }).map((_, i) => (
            <ScanningPlaceholderCard key={`scanning-${i.toString()}`} />
          ))}
      </div>
    </div>
  );
}
