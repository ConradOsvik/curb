import type { Doc } from "@curb/backend/convex/_generated/dataModel";
import { Folder } from "lucide-react";

import { cn } from "@/lib/utils";

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
    year: "numeric",
  });
}

interface FolderRowProps {
  type: "folder";
  item: Doc<"folders">;
  isSelected: boolean;
  isDropTarget?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

interface ReceiptRowProps {
  type: "receipt";
  item: Doc<"receipts">;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

type FileExplorerRowProps = FolderRowProps | ReceiptRowProps;

export function FileExplorerRow(props: FileExplorerRowProps) {
  const { type, isSelected, onClick, onDoubleClick } = props;

  if (type === "folder") {
    const folder = props.item;
    const colorClass = folder.color
      ? folderColorMap[folder.color]
      : "text-muted-foreground";

    return (
      <div
        role="row"
        tabIndex={0}
        className={cn(
          "group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm transition-colors hover:bg-accent/50",
          isSelected && "bg-accent",
          props.isDropTarget && "bg-accent/50 ring-1 ring-ring"
        )}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onDoubleClick();
          }
        }}
      >
        <Folder className={cn("size-4 shrink-0", colorClass)} />
        <span className="flex-1 truncate font-medium">{folder.name}</span>
        <span className="w-20 shrink-0 text-muted-foreground">Folder</span>
        <span className="w-28 shrink-0 text-muted-foreground">&mdash;</span>
        <span className="w-24 shrink-0 text-right text-muted-foreground">
          &mdash;
        </span>
      </div>
    );
  }

  const receipt = props.item;
  return (
    <div
      role="row"
      tabIndex={0}
      className={cn(
        "group flex h-10 cursor-default items-center gap-3 border-b px-4 text-sm transition-colors hover:bg-accent/50",
        isSelected && "bg-accent"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onDoubleClick();
        }
      }}
    >
      <div className="size-4 shrink-0 rounded-sm border bg-muted" />
      <span className="flex-1 truncate">{receipt.merchantName}</span>
      <span className="w-20 shrink-0 text-xs capitalize text-muted-foreground">
        {receipt.receiptType}
      </span>
      <span className="w-28 shrink-0 text-muted-foreground">
        {formatDate(receipt.date)}
      </span>
      <span className="w-24 shrink-0 text-right tabular-nums">
        {formatCurrency(receipt.total, receipt.currency)}
      </span>
    </div>
  );
}
