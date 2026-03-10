import type { Folder, Receipt } from "@curb/db/types";
import { useDroppable } from "@dnd-kit/core";
import { FolderIcon, FolderOpenIcon } from "@heroicons/react/24/solid";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import { ItemContextMenu } from "../context-menus/item-context-menu";
import { DraggableItem } from "../dnd/draggable-item";
import { DroppableFolder } from "../dnd/droppable-folder";
import { PARENT_DROP_ID } from "../dnd/file-explorer-dnd-context";
import { FileExplorerRow } from "./file-explorer-row";
import { ScanningPlaceholderRow } from "./scanning-placeholder";

function ParentDropRowInline({ onNavigate }: { onNavigate: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: PARENT_DROP_ID });

  return (
    <div
      ref={setNodeRef}
      role="row"
      tabIndex={0}
      className={cn(
        "group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500",
        isOver && "bg-blue-500/20 ring-2 ring-blue-500"
      )}
      onDoubleClick={onNavigate}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onNavigate();
        }
      }}
    >
      <FolderIcon className="size-4 shrink-0 text-muted-foreground/60" />
      <span className="flex-1 truncate font-medium">..</span>
      <span className="w-20 shrink-0">&mdash;</span>
      <span className="w-28 shrink-0">&mdash;</span>
      <span className="w-24 shrink-0 text-right">&mdash;</span>
    </div>
  );
}

interface FileExplorerTableProps {
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

export function FileExplorerTable({
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
}: FileExplorerTableProps) {
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
    <div className="flex-1 overflow-y-auto" role="table">
      <div className="sticky top-0 z-10 flex h-8 items-center gap-3 border-b bg-surface px-4 text-xs font-medium text-muted-foreground">
        <div className="size-4 shrink-0" />
        <span className="flex-1">Name</span>
        <span className="w-20 shrink-0">Type</span>
        <span className="w-28 shrink-0">Date</span>
        <span className="w-24 shrink-0 text-right">Amount</span>
      </div>

      {currentFolderId && (
        <ParentDropRowInline onNavigate={() => onNavigate(parentFolderId)} />
      )}

      {items.map((entry) => {
        const isEditing = editingId === entry.item.id;

        return entry.type === "folder" ? (
          <div key={entry.item.id} ref={(el) => setItemRef(entry.item.id, el)}>
            <ItemContextMenu
              type="folder"
              folders={allFolders.filter((f) => f.id !== entry.item.id)}
              currentFolderId={currentFolderId}
              onRename={() => onStartEditing(entry.item.id)}
              onChangeColor={(color) =>
                onChangeFolderColor(entry.item.id, color)
              }
              onMove={(targetId) => onMoveFolder(entry.item.id, targetId)}
              onDelete={() => onDeleteFolder(entry.item.id)}
            >
              <DraggableItem
                id={entry.item.id}
                data={{
                  item: entry.item,
                  type: "folder",
                }}
                isSelected={isSelected(entry.item.id)}
                disabled={isEditing}
              >
                <DroppableFolder id={entry.item.id}>
                  {() => (
                    <FileExplorerRow
                      type="folder"
                      item={entry.item as Folder}
                      isSelected={isSelected(entry.item.id)}
                      isDropTarget={dropIntoTarget === entry.item.id}
                      isEditing={isEditing}
                      onClick={(e) => onSelect(entry.item.id, e)}
                      onDoubleClick={() => onNavigate(entry.item.id)}
                      onSaveEdit={(name) => onSaveEdit(entry.item.id, name)}
                      onCancelEdit={onCancelEdit}
                    />
                  )}
                </DroppableFolder>
              </DraggableItem>
            </ItemContextMenu>
          </div>
        ) : (
          <div key={entry.item.id} ref={(el) => setItemRef(entry.item.id, el)}>
            <ItemContextMenu
              type="receipt"
              folders={allFolders}
              currentFolderId={currentFolderId}
              onViewDetails={() => onViewReceipt(entry.item as Receipt)}
              onMove={(targetId) => onMoveReceipt(entry.item.id, targetId)}
              onDelete={() => onDeleteReceipt(entry.item.id)}
            >
              <DraggableItem
                id={entry.item.id}
                data={{
                  item: entry.item,
                  type: "receipt",
                }}
                isSelected={isSelected(entry.item.id)}
              >
                <FileExplorerRow
                  type="receipt"
                  item={entry.item as Receipt}
                  isSelected={isSelected(entry.item.id)}
                  onClick={(e) => onSelect(entry.item.id, e)}
                  onDoubleClick={() => onViewReceipt(entry.item as Receipt)}
                />
              </DraggableItem>
            </ItemContextMenu>
          </div>
        );
      })}

      {scanningCount > 0 &&
        Array.from({ length: scanningCount }).map((_, i) => (
          <ScanningPlaceholderRow key={`scanning-${i.toString()}`} />
        ))}
    </div>
  );
}
