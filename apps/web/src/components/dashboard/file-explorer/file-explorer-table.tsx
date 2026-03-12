import type { Folder, ReceiptWithItems } from "@curb/api";
import { FolderIcon, FolderOpenIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import type { ExplorerItem } from "@/hooks/use-dashboard";

import type { ItemWrapperProps } from "./file-explorer-card-grid";
import { FileExplorerRow } from "./file-explorer-row";
import { ScanningPlaceholderRow } from "./scanning-placeholder";

interface FileExplorerTableProps {
  items: ExplorerItem[];
  currentFolderId?: string;
  parentFolderId?: string;
  renderItemWrapper: (props: ItemWrapperProps) => ReactNode;
  renderParentRow?: (onNavigate: () => void) => ReactNode;
  onNavigate: (folderId?: string) => void;
  onViewReceipt: (receipt: ReceiptWithItems) => void;
  isSelected?: (id: string) => boolean;
  onSelect?: (id: string, e: React.MouseEvent) => void;
  onFocusItem?: (id: string) => void;
  setItemRef?: (id: string, el: HTMLElement | null) => void;
  editingId?: string | null;
  onSaveEdit?: (id: string, name: string) => void;
  onCancelEdit?: () => void;
  scanningCount?: number;
  dropIntoTarget?: string | null;
  emptyIcon?: ReactNode;
  emptyMessage?: string;
}

export function FileExplorerTable({
  items,
  currentFolderId,
  parentFolderId,
  renderItemWrapper,
  renderParentRow,
  onNavigate,
  onViewReceipt,
  isSelected = () => false,
  onSelect,
  onFocusItem,
  setItemRef,
  editingId = null,
  onSaveEdit,
  onCancelEdit,
  scanningCount = 0,
  dropIntoTarget,
  emptyIcon = <FolderOpenIcon className="size-10" />,
  emptyMessage = "No receipts yet. Drop images or right-click to get started.",
}: FileExplorerTableProps) {
  const isEmpty = items.length === 0 && !currentFolderId;

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
        {emptyIcon}
        <p className="text-sm">{emptyMessage}</p>
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

      {currentFolderId &&
        (renderParentRow ? (
          renderParentRow(() => onNavigate(parentFolderId))
        ) : (
          <div
            role="row"
            tabIndex={0}
            className="group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
            onDoubleClick={() => onNavigate(parentFolderId)}
          >
            <FolderIcon className="size-4 shrink-0 text-muted-foreground/60" />
            <span className="flex-1 truncate font-medium">..</span>
            <span className="w-20 shrink-0">&mdash;</span>
            <span className="w-28 shrink-0">&mdash;</span>
            <span className="w-24 shrink-0 text-right">&mdash;</span>
          </div>
        ))}

      {items.map((entry) => {
        const isEditing = editingId === entry.item.id;
        const selected = isSelected(entry.item.id);

        const row =
          entry.type === "folder" ? (
            <FileExplorerRow
              type="folder"
              item={entry.item as Folder}
              isSelected={selected}
              isDropTarget={dropIntoTarget === entry.item.id}
              isEditing={isEditing}
              onClick={(e) => onSelect?.(entry.item.id, e)}
              onFocus={() => onFocusItem?.(entry.item.id)}
              onDoubleClick={() => onNavigate(entry.item.id)}
              onSaveEdit={(name) => onSaveEdit?.(entry.item.id, name)}
              onCancelEdit={() => onCancelEdit?.()}
            />
          ) : (
            <FileExplorerRow
              type="receipt"
              item={entry.item as ReceiptWithItems}
              isSelected={selected}
              onClick={(e) => onSelect?.(entry.item.id, e)}
              onFocus={() => onFocusItem?.(entry.item.id)}
              onDoubleClick={() =>
                onViewReceipt(entry.item as ReceiptWithItems)
              }
            />
          );

        return (
          <div
            key={entry.item.id}
            ref={(el) => setItemRef?.(entry.item.id, el)}
          >
            {renderItemWrapper({
              children: row,
              entry,
              isEditing,
              selected,
            })}
          </div>
        );
      })}

      {scanningCount > 0 &&
        Array.from({ length: scanningCount }).map((_, i) => (
          <ScanningPlaceholderRow key={`scanning-placeholder-${String(i)}`} />
        ))}
    </div>
  );
}
