import type { ReceiptWithItems } from "@curb/api";
import { FolderIcon, FolderOpenIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";

import type { ExplorerItem } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

import { InlineEdit } from "./inline-edit";
import { ScanningPlaceholderCard } from "./scanning-placeholder";

export interface ItemWrapperProps {
  entry: ExplorerItem;
  selected: boolean;
  isEditing: boolean;
  children: ReactNode;
}

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

interface FileExplorerCardGridProps {
  items: ExplorerItem[];
  currentFolderId?: string;
  parentFolderId?: string;
  renderItemWrapper: (props: ItemWrapperProps) => ReactNode;
  renderParentCard?: (onNavigate: () => void) => ReactNode;
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

export function FileExplorerCardGrid({
  items,
  currentFolderId,
  parentFolderId,
  renderItemWrapper,
  renderParentCard,
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
}: FileExplorerCardGridProps) {
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
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid gap-2 grid-cols-[repeat(auto-fill,120px)]">
        {currentFolderId &&
          (renderParentCard ? (
            renderParentCard(() => onNavigate(parentFolderId))
          ) : (
            <div
              role="option"
              tabIndex={0}
              aria-selected={false}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 outline-none transition-colors hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-blue-500"
              onDoubleClick={() => onNavigate(parentFolderId)}
            >
              <FolderIcon className="size-16 shrink-0 text-muted-foreground/60 drop-shadow-sm" />
              <span className="max-w-full truncate rounded-md px-1.5 py-0.5 text-xs font-medium">
                ..
              </span>
            </div>
          ))}

        {items.map((entry) => {
          if (entry.type === "folder") {
            const folder = entry.item;
            const colorClass = folder.color
              ? folderColorMap[folder.color]
              : "text-blue-500";
            const selected = isSelected(folder.id);
            const isEditing = editingId === folder.id;

            return (
              <div key={folder.id} ref={(el) => setItemRef?.(folder.id, el)}>
                {renderItemWrapper({
                  children: (
                    <div
                      role="option"
                      tabIndex={0}
                      aria-selected={selected}
                      className={cn(
                        "flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                        selected ? "bg-accent/60" : "hover:bg-accent/30",
                        dropIntoTarget === folder.id &&
                          "bg-blue-500/20 ring-2 ring-blue-500 rounded-lg"
                      )}
                      onClick={(e) => onSelect?.(folder.id, e)}
                      onFocus={() => onFocusItem?.(folder.id)}
                      onDoubleClick={() => onNavigate(folder.id)}
                      onKeyDown={() => {}}
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
                          onSave={(name) => onSaveEdit?.(folder.id, name)}
                          onCancel={() => onCancelEdit?.()}
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
                  ),
                  entry,
                  isEditing,
                  selected,
                })}
              </div>
            );
          }

          const receipt = entry.item;
          const selected = isSelected(receipt.id);
          return (
            <div key={receipt.id} ref={(el) => setItemRef?.(receipt.id, el)}>
              {renderItemWrapper({
                children: (
                  <div
                    role="option"
                    tabIndex={0}
                    aria-selected={selected}
                    className={cn(
                      "flex h-full w-full cursor-pointer flex-col rounded-lg p-1.5 outline-none transition-colors",
                      selected ? "bg-accent/60" : "hover:bg-accent/30",
                      "focus-visible:ring-2 focus-visible:ring-blue-500"
                    )}
                    onClick={(e) => onSelect?.(receipt.id, e)}
                    onFocus={() => onFocusItem?.(receipt.id)}
                    onDoubleClick={() => onViewReceipt(receipt)}
                    onKeyDown={() => {}}
                  >
                    <svg
                      className="block w-full text-white drop-shadow-[0_-1px_0_rgba(0,0,0,0.05)] dark:text-gray-100 dark:drop-shadow-none"
                      viewBox="0 0 120 5"
                      preserveAspectRatio="none"
                      height="5"
                    >
                      <path
                        d="M0,5 H120 V0 A5,5 0 0,1 110,0 A5,5 0 0,1 100,0 A5,5 0 0,1 90,0 A5,5 0 0,1 80,0 A5,5 0 0,1 70,0 A5,5 0 0,1 60,0 A5,5 0 0,1 50,0 A5,5 0 0,1 40,0 A5,5 0 0,1 30,0 A5,5 0 0,1 20,0 A5,5 0 0,1 10,0 A5,5 0 0,1 0,0 Z"
                        fill="currentColor"
                      />
                    </svg>
                    <div className="flex flex-1 flex-col gap-1 bg-white px-2 py-2 text-gray-900 shadow-sm ring-1 ring-black/5 dark:bg-gray-100 dark:text-gray-900 dark:shadow-none dark:ring-0">
                      <span className="truncate text-xs font-semibold">
                        {receipt.merchantName}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>{formatDate(receipt.date)}</span>
                        <span className="capitalize">
                          {receipt.receiptType}
                        </span>
                      </div>
                      <span className="text-xs font-bold tabular-nums">
                        {formatCurrency(receipt.total, receipt.currency)}
                      </span>
                    </div>
                    <svg
                      className="block w-full text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.05)] dark:text-gray-100 dark:drop-shadow-none"
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
                ),
                entry,
                isEditing: false,
                selected,
              })}
            </div>
          );
        })}

        {scanningCount > 0 &&
          Array.from({ length: scanningCount }).map((_, i) => (
            <ScanningPlaceholderCard
              key={`scanning-placeholder-${String(i)}`}
            />
          ))}
      </div>
    </div>
  );
}
